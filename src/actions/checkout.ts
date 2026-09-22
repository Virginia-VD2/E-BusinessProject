'use server';

import { prisma } from '@/lib/prisma';
import { snap, coreApi } from '@/lib/midtrans';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { auth } from '@/auth';
import { sendOrderConfirmationEmail, sendOrderPaidSuccessEmail } from '@/lib/email';

const SERVER_DISCOUNTS: Record<
  string,
  { type: 'percentage' | 'fixed'; value: number; minSpend: number }
> = {
  AYAMFRESH15: { type: 'percentage', value: 15, minSpend: 100000 },
  MINUT20K: { type: 'fixed', value: 20000, minSpend: 100000 },
  AYAMCHICKEN10: { type: 'percentage', value: 10, minSpend: 100000 },
  EASTERBAKE15: { type: 'percentage', value: 15, minSpend: 100000 },
  BAKER20K: { type: 'fixed', value: 20000, minSpend: 100000 },
  SECRETBAKE10: { type: 'percentage', value: 10, minSpend: 100000 },
};

export async function createCheckoutSessionAction(data: {
  userId?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  customer: { name: string; email: string; phone?: string; address: string };
  discountCode?: string;
}) {
  const session = await auth();
  const currentUserId = session?.user?.id || data.userId || null;
  const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Clean and validate email for Midtrans API requirements
  const rawEmail = (data.customer.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmail = emailRegex.test(rawEmail) ? rawEmail : 'customer@ayamaja.com';

  // Verify userId validity in database to prevent Foreign Key constraint errors with stale sessions
  let validUserId: string | null = null;
  if (currentUserId) {
    const userExists = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true },
    });
    if (userExists) {
      validUserId = userExists.id;
    }
  }
  if (!validUserId && validEmail) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: validEmail },
      select: { id: true },
    });
    if (userByEmail) {
      validUserId = userByEmail.id;
    }
  }

  // Server side discount calculation
  let discountAmount = 0;
  let appliedCode = '';
  if (data.discountCode) {
    const cleanCode = data.discountCode.trim().toUpperCase();
    const promo = SERVER_DISCOUNTS[cleanCode];

    if (promo && subtotal >= promo.minSpend) {
      appliedCode = cleanCode;
      if (promo.type === 'percentage') {
        discountAmount = Math.round((subtotal * promo.value) / 100);
      } else {
        discountAmount = Math.min(promo.value, subtotal);
      }
    }
  }

  const finalTotalAmount = Math.max(0, subtotal - discountAmount);
  const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    // 1. Verify stock and decrement directly (without pool-blocking interactive transaction)
    for (const item of data.items) {
      let product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { id: true, stockKg: true, name: true },
      });

      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { contains: item.name.split(' ')[0], mode: 'insensitive' } },
              { isActive: true },
            ],
          },
          select: { id: true, stockKg: true, name: true },
        });
      }

      if (product) {
        item.id = product.id; // Map to real database product ID
        if (product.stockKg > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data: { stockKg: { decrement: Math.min(product.stockKg, item.quantity) } },
          }).catch(() => {});
        }
      }
    }

    // 2. Create Order directly
    const totalKg = data.items.reduce((acc, item) => acc + item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: validUserId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        requestedWeightKg: totalKg,
        estimatedAmount: finalTotalAmount,
        finalAmount: finalTotalAmount,
        shippingAddress: typeof data.customer.address === 'string' ? data.customer.address : JSON.stringify(data.customer.address),
        items: {
          create: data.items.map((item) => ({
            productId: item.id,
            requestedKg: item.quantity,
            pricePerKg: item.price,
            subtotal: Math.round(item.price * item.quantity),
          })),
        },
      },
    });

    // Log discount usage if applied
    if (discountAmount > 0) {
      await prisma.activityLog.create({
        data: {
          userId: validUserId,
          action: 'DISCOUNT_APPLIED',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            code: appliedCode,
            subtotal,
            discountAmount,
            finalTotalAmount,
            email: validEmail,
          }),
        },
      }).catch(() => {});
    }

    // 3. Generate Midtrans Snap Token
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const itemDetails: any[] = data.items.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    }));

    if (discountAmount > 0) {
      itemDetails.push({
        id: 'DISCOUNT',
        price: -discountAmount,
        quantity: 1,
        name: `Diskon AYAMAJA (${appliedCode})`.substring(0, 50),
      });
    }

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.finalAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: data.customer.name.trim() || 'Customer',
        email: validEmail,
        phone: data.customer.phone?.trim() || '',
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // 4. Update order with token
    await prisma.order.update({
      where: { id: order.id },
      data: {
        snapToken: transaction.token,
        snapRedirectUrl: transaction.redirect_url,
      },
    });

    // 5. Send Order Confirmation Email asynchronously to user's email
    try {
      await sendOrderConfirmationEmail({
        userEmail: validEmail,
        userName: data.customer.name.trim() || 'Pelanggan Setia',
        orderNumber: order.orderNumber,
        items: data.items,
        totalAmount: finalTotalAmount,
        discountAmount,
        discountCode: appliedCode,
        shippingAddress: data.customer.address,
      });
    } catch (err) {
      console.error('Failed to dispatch order confirmation email:', err);
    }

    return { success: true, snapToken: transaction.token, orderNumber: order.orderNumber };
  } catch (error: unknown) {
    console.error('Checkout Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function simulateSandboxPaymentAction(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus === PaymentStatus.SETTLEMENT) {
      return { success: true, message: 'Order already paid' };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.SETTLEMENT,
        paymentType: 'sandbox_simulation',
        paidAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'PAYMENT_SETTLEMENT_SANDBOX_SIMULATED',
        entity: 'Order',
        entityId: order.id,
        details: JSON.stringify({ orderNumber, totalAmount: order.finalAmount, mode: 'sandbox_simulation' }),
      },
    }).catch(() => {});

    // Dispatch Paid Success Email
    try {
      await sendOrderPaidSuccessEmail(order.id);
    } catch (err) {
      console.error('Failed to dispatch paid success email on sandbox simulation:', err);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Sandbox Payment Simulation Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function syncOrderStatusAction(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus === PaymentStatus.SETTLEMENT) {
      return { success: true, paymentStatus: 'SETTLEMENT', updated: false };
    }

    // Query Midtrans status API directly
    let midtransStatus: any = null;
    try {
      midtransStatus = await coreApi.transaction.status(orderNumber);
    } catch (e: any) {
      console.warn(`Midtrans status lookup for ${orderNumber}:`, e?.message || e);
    }

    if (midtransStatus) {
      const transactionStatus = midtransStatus.transaction_status;
      const fraudStatus = midtransStatus.fraud_status;

      let isSettled = false;
      if (transactionStatus === 'capture' && fraudStatus === 'accept') {
        isSettled = true;
      } else if (transactionStatus === 'settlement') {
        isSettled = true;
      }

      if (isSettled) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.SETTLEMENT,
            paymentType: midtransStatus.payment_type || 'midtrans_synced',
            paidAt: new Date(),
          },
        });

        await prisma.activityLog.create({
          data: {
            userId: order.userId,
            action: 'PAYMENT_SETTLEMENT_SYNCED',
            entity: 'Order',
            entityId: order.id,
            details: JSON.stringify(midtransStatus),
          },
        }).catch(() => {});

        // Dispatch Paid Success Email
        try {
          await sendOrderPaidSuccessEmail(order.id);
        } catch (err) {
          console.error('Failed to dispatch paid success email on status sync:', err);
        }

        return { success: true, paymentStatus: 'SETTLEMENT', updated: true };
      }
    }

    return { success: true, paymentStatus: order.paymentStatus, updated: false };
  } catch (error: unknown) {
    console.error('Sync Order Status Error:', error);
    return { success: false, error: (error as Error).message };
  }
}
