'use server';

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getAdminOrdersAction() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    return { success: true, orders };
  } catch (error: unknown) {
    console.error('getAdminOrdersAction Error:', error);
    return { success: false, orders: [], error: (error as Error).message };
  }
}

export async function updateAdminOrderStatusAction(orderNumber: string, status: OrderStatus) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return { success: false, error: 'Pesanan tidak ditemukan' };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'ADMIN_UPDATE_ORDER_STATUS',
        entity: 'Order',
        entityId: order.id,
        details: JSON.stringify({ orderNumber, newStatus: status }),
      },
    }).catch(() => {});

    revalidatePath('/admin');
    revalidatePath('/my-orders');
    revalidatePath(`/orders/${orderNumber}`);

    return { success: true, newStatus: status };
  } catch (error: unknown) {
    console.error('updateAdminOrderStatusAction Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function verifyAdminWeightAction(orderNumber: string, actualKg: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: 'Pesanan tidak ditemukan' };
    }

    const pricePerKg = order.items.length > 0 ? order.items[0].pricePerKg : order.estimatedAmount / Math.max(1, order.requestedWeightKg);
    const updatedFinalAmount = Math.round(pricePerKg * actualKg);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        actualWeightKg: actualKg,
        finalAmount: updatedFinalAmount,
        status: OrderStatus.WEIGHT_VERIFIED,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'ADMIN_VERIFY_WEIGHT_IOT',
        entity: 'Order',
        entityId: order.id,
        details: JSON.stringify({ orderNumber, requestedKg: order.requestedWeightKg, actualKg, updatedFinalAmount }),
      },
    }).catch(() => {});

    revalidatePath('/admin');
    revalidatePath('/my-orders');
    revalidatePath(`/orders/${orderNumber}`);

    return { success: true, actualKg, updatedFinalAmount };
  } catch (error: unknown) {
    console.error('verifyAdminWeightAction Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('deleteProductAction error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function upsertProductAction(formData: FormData) {
  try {
    const id = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const category = (formData.get('category') as string) || 'AYAM_SEGAR';
    const description = (formData.get('description') as string) || '';
    const pricePerKg = parseInt((formData.get('pricePerKg') as string) || '32000', 10);
    const stockKg = parseFloat((formData.get('stockKg') as string) || '50');

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;

    if (id) {
      await prisma.product.update({
        where: { id },
        data: {
          name,
          category,
          description,
          pricePerKg,
          stockKg,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name,
          slug,
          category,
          description,
          pricePerKg,
          stockKg,
          images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80'],
        },
      });
    }

    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('upsertProductAction error:', error);
    return { success: false, error: (error as Error).message };
  }
}
