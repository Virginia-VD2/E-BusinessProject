'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function registerUserAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Hash password & Create user
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.USER,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred during registration.' };
  }
}

export async function signOutAction() {
  const { signOut } = await import('@/auth');
  await signOut({ redirectTo: '/' });
}
