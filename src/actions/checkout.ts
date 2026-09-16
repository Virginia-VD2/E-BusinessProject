'use server';

import { prisma } from '@/lib/prisma';
import { snap, coreApi } from '@/lib/midtrans';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { auth } from '@/auth';
import { sendOrderConfirmationEmail } from '@/lib/email';

const SERVER_DISCOUNTS: Record<
  string,
  { type: 'percentage' | 'fixed'; value: number; minSpend: number }
> = {
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
  const validEmail = emailRegex.test(rawEmail) ? rawEmail : 'customer@velourspatisserie.web.id';

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
    const order = await prisma.$transaction(async (tx) => {
      // 1. Verify stock and decrement
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { stock: true, name: true },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock tidak cukup untuk ${product?.name ?? item.id}`);
        }

        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 2. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: currentUserId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          totalAmount: finalTotalAmount,
          shippingAddress: JSON.stringify(data.customer.address),
          items: {
            create: data.items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // Log discount usage if applied
      if (discountAmount > 0) {
        await tx.activityLog.create({
          data: {
            userId: currentUserId,
            action: 'DISCOUNT_APPLIED',
            entity: 'Order',
            entityId: newOrder.id,
            details: JSON.stringify({
              code: appliedCode,
              subtotal,
              discountAmount,
              finalTotalAmount,
            }),
          },
        });
      }

      return newOrder;
    });

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
        name: `Diskon Easter Egg (${appliedCode})`.substring(0, 50),
      });
    }

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalAmount,
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

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.SETTLEMENT,
          paymentType: 'sandbox_simulation',
          paidAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: order.userId,
          action: 'PAYMENT_SETTLEMENT_SANDBOX_SIMULATED',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({ orderNumber, totalAmount: order.totalAmount, mode: 'sandbox_simulation' }),
        },
      });
    });

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
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.PROCESSING,
              paymentStatus: PaymentStatus.SETTLEMENT,
              paymentType: midtransStatus.payment_type || 'midtrans_synced',
              paidAt: new Date(),
              midtransResponse: JSON.stringify(midtransStatus),
            },
          });

          await tx.activityLog.create({
            data: {
              userId: order.userId,
              action: 'PAYMENT_SETTLEMENT_SYNCED',
              entity: 'Order',
              entityId: order.id,
              details: JSON.stringify(midtransStatus),
            },
          });
        });

        return { success: true, paymentStatus: 'SETTLEMENT', updated: true };
      }
    }

    return { success: true, paymentStatus: order.paymentStatus, updated: false };
  } catch (error: unknown) {
    console.error('Sync Order Status Error:', error);
    return { success: false, error: (error as Error).message };
  }
}
