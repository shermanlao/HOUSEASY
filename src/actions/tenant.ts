'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function createTenant(formData: FormData) {
  const session = await requireAuth();
  const propertyId = formData.get('propertyId') as string;
  const nameChinese = formData.get('nameChinese') as string;
  const nameEnglish = formData.get('nameEnglish') as string;
  const phone = formData.get('phone') as string;
  const passportOrHkid = (formData.get('passportOrHkid') as string) || undefined;

  if (!propertyId || !nameChinese || !nameEnglish || !phone) {
    return { error: '請填寫必填欄位' };
  }

  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId, userId: session.id },
  });
  if (!owned && session.role !== 'ADMIN') {
    return { error: '權限不足' };
  }

  await prisma.tenant.create({
    data: { propertyId, nameChinese, nameEnglish, phone, passportOrHkid },
  });
  return { success: true };
}

export async function getTenant(id: string) {
  await requireAuth();
  return prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
}
