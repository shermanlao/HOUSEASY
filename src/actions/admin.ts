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

export async function updateUser(data: {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}) {
  await requireAdmin();
  const { id, email, name, role, password } = data;

  if (!id || !email || !name || !role) {
    return { error: '請填寫所有必填欄位' };
  }
  if (role !== 'ADMIN' && role !== 'OWNER') {
    return { error: '角色無效' };
  }
  if (password && password.length < 6) {
    return { error: '密碼至少 6 位' };
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return { error: '用戶不存在' };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (emailTaken) {
    return { error: '此電郵已被其他用戶使用' };
  }

  const updateData: {
    email: string;
    name: string;
    role: string;
    passwordHash?: string;
  } = { email, name, role };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({ where: { id }, data: updateData });
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (!id) {
    return { error: '用戶不存在' };
  }
  if (id === session.id) {
    return { error: '不能刪除目前登入的帳號' };
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return { error: '用戶不存在' };
  }

  if (existing.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      return { error: '不能刪除最後一位管理員' };
    }
  }

  await prisma.user.delete({ where: { id } });
  return { success: true };
}
