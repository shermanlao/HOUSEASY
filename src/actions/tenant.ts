'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';

export async function createTenant(formData: FormData) {
  const session = await requireAuth();
  const roomId = formData.get('roomId') as string;
  const nameChinese = formData.get('nameChinese') as string;
  const nameEnglish = formData.get('nameEnglish') as string;
  const phone = formData.get('phone') as string;
  const passportOrHkid = (formData.get('passportOrHkid') as string) || undefined;

  if (!roomId || !nameChinese || !nameEnglish || !phone) {
    return { error: '請填寫必填欄位' };
  }

  if (!(await canAccessRoom(roomId, session))) {
    return { error: '權限不足' };
  }

  await prisma.tenant.create({
    data: { roomId, nameChinese, nameEnglish, phone, passportOrHkid },
  });
  return { success: true };
}

export async function getTenant(id: string) {
  await requireAuth();
  return prisma.tenant.findUnique({
    where: { id },
    include: { room: { include: { property: true } } },
  });
}
