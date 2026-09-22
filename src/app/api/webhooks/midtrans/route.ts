import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { sendOrderPaidSuccessEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    // 1. Signature Verification
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto.createHash('sha512').update(rawSignature).digest('hex');

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 401 });
    }

    // 2. Fetch current order
    const order = await prisma.order.findUnique({
      where: { orderNumber: order_id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === PaymentStatus.SETTLEMENT) {
      return NextResponse.json({ message: 'Order already settled' }, { status: 200 });
    }

    let orderStatus: OrderStatus = order.status;
    let paymentStatus: PaymentStatus = order.paymentStatus;
    let shouldRestoreStock = false;

    // 3. Evaluate Midtrans Status State Machine
    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = PaymentStatus.SETTLEMENT;
        orderStatus = OrderStatus.PROCESSING;
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = PaymentStatus.SETTLEMENT;
      orderStatus = OrderStatus.PROCESSING;
    } else if (transaction_status === 'pending') {
      paymentStatus = PaymentStatus.PENDING;
      orderStatus = OrderStatus.PENDING;
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      paymentStatus =
        transaction_status === 'expire' ? PaymentStatus.EXPIRE : PaymentStatus.CANCEL;
      orderStatus =
        transaction_status === 'expire' ? OrderStatus.EXPIRED : OrderStatus.CANCELLED;
      shouldRestoreStock = true;
    }

    // 4. Update Database
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paymentStatus: paymentStatus,
        paymentType: payment_type,
        paidAt: paymentStatus === PaymentStatus.SETTLEMENT ? new Date() : null,
      },
    });

    if (shouldRestoreStock) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockKg: { increment: item.requestedKg } },
        }).catch(() => {});
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: `PAYMENT_${transaction_status.toUpperCase()}`,
        entity: 'Order',
        entityId: order.id,
        details: JSON.stringify({ transaction_status, gross_amount, payment_type }),
      },
    }).catch(() => {});

    // Send Payment Success Email if settled
    if (paymentStatus === PaymentStatus.SETTLEMENT) {
      try {
        await sendOrderPaidSuccessEmail(order.id);
      } catch (e) {
        console.error('Failed to send paid success email in webhook:', e);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: unknown) {
    console.error('Midtrans Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
