'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';
import { ACTIVE_TENANT_ERROR, createActiveTenant } from '@/lib/tenant';

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

  try {
    await createActiveTenant({ roomId, nameChinese, nameEnglish, phone, passportOrHkid });
  } catch (err) {
    if (err instanceof Error && err.message === ACTIVE_TENANT_ERROR) {
      return { error: ACTIVE_TENANT_ERROR };
    }
    throw err;
  }
  return { success: true };
}

export async function getTenant(id: string) {
  const session = await requireAuth();
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { room: { include: { property: true } } },
  });
  if (!tenant) return null;
  if (!(await canAccessRoom(tenant.roomId, session))) return null;
  return tenant;
}

export async function updateTenant(
  id: string,
  data: {
    nameChinese: string;
    nameEnglish: string;
    phone: string;
    passportOrHkid?: string;
  }
) {
  const session = await requireAuth();
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return { error: '租客不存在' };
  if (!(await canAccessRoom(tenant.roomId, session))) return { error: '權限不足' };
  if (!data.nameChinese || !data.nameEnglish || !data.phone) {
    return { error: '請填寫必填欄位' };
  }

  await prisma.tenant.update({
    where: { id },
    data: {
      nameChinese: data.nameChinese,
      nameEnglish: data.nameEnglish,
      phone: data.phone,
      passportOrHkid: data.passportOrHkid || null,
    },
  });
  return { success: true };
}
