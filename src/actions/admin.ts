'use server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function addOwner(formData: FormData) {
  await requireAdmin();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!email || !name || !password) {
    return { error: '請填寫所有欄位' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: '此電郵已存在' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name, passwordHash, role: 'OWNER' },
  });
  return { success: true };
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
