'use server';

import { prisma } from '@/lib/prisma';
import { snap, coreApi } from '@/lib/midtrans';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { auth } from '@/auth';

export async function createCheckoutSessionAction(data: {
  userId?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  customer: { name: string; email: string; phone?: string; address: string };
}) {
  const session = await auth();
  const currentUserId = session?.user?.id || data.userId || null;
  const totalAmount = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
          throw new Error(`Insufficient stock for ${product?.name ?? item.id}`);
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
          totalAmount,
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

      return newOrder;
    });

    // 3. Generate Midtrans Snap Token
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalAmount,
      },
      item_details: data.items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name.substring(0, 50),
      })),
      customer_details: {
        first_name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || '',
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
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
