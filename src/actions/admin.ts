'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function upsertProductAction(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SELLER') {
      return { error: 'Unauthorized' };
    }

    const id = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = (formData.get('category') as string) || 'AYAM_SEGAR';
    const pricePerKg = parseInt((formData.get('pricePerKg') || formData.get('price')) as string, 10);
    const stockKg = parseFloat((formData.get('stockKg') || formData.get('stock')) as string);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Handle Image Upload
    const imageFile = formData.get('image') as File | null;
    let images: string[] | undefined = undefined;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${imageFile.name.replace(/\s/g, '-')}`;

      const uploadDir = join(process.cwd(), 'public/uploads');
      await mkdir(uploadDir, { recursive: true }).catch(() => {});

      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      images = [`/uploads/${filename}`];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = { name, description, category, pricePerKg, stockKg, slug };
    if (images) {
      data.images = images;
    }

    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      if (!data.images) data.images = ['/placeholder.png'];
      await prisma.product.create({ data });
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error saving product:', error);
    return { error: 'Failed to save product.' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SELLER') {
      return { error: 'Unauthorized' };
    }

    await prisma.product.delete({ where: { id } });
    revalidatePath('/admin/products');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product.' };
  }
}
