'use server';

import { prisma } from '@/lib/db';
import { createSession, requireAuth } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function getOwnAccount() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user || user.role !== 'OWNER') return null;
  return user;
}

export async function updateOwnAccount(data: { email: string; name: string; password?: string }) {
  const session = await requireAuth();
  if (session.role !== 'OWNER') {
    return { error: '權限不足' };
  }

  const email = data.email.trim();
  const name = data.name.trim();
  const password = data.password?.trim() || '';

  if (!email || !name) {
    return { error: '請填寫所有必填欄位' };
  }
  if (password && password.length < 6) {
    return { error: '密碼至少 6 位' };
  }

  const existing = await prisma.user.findUnique({ where: { id: session.id } });
  if (!existing || existing.role !== 'OWNER') {
    return { error: '用戶不存在' };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: session.id } },
  });
  if (emailTaken) {
    return { error: '此電郵已被其他用戶使用' };
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      email,
      name,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  await createSession(updated);
  return { success: true };
}
