'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { accessiblePropertyIds, canAccessProperty, canAccessRoom } from '@/lib/access';
import { parseOptionalMonthlyRent } from '@/lib/rent';

export async function getRoomsForUser(propertyId?: string) {
  const session = await requireAuth();
  const propertyIds = await accessiblePropertyIds(session);
  if (propertyId) {
    if (!(await canAccessProperty(propertyId, session))) return [];
  }

  return prisma.room.findMany({
    where: {
      ...(propertyId ? { propertyId } : propertyIds === null ? {} : { propertyId: { in: propertyIds } }),
    },
    include: {
      property: true,
      tenants: true,
      _count: { select: { statements: true, tenants: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRoom(id: string) {
  const session = await requireAuth();
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          owners: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
      tenants: { orderBy: [{ isActive: 'desc' }, { nameChinese: 'asc' }] },
      _count: { select: { statements: true } },
    },
  });
  if (!room) return null;
  const isOwner = room.property.owners.some((o) => o.userId === session.id);
  if (!isOwner && session.role !== 'ADMIN') return null;
  return room;
}

export async function createRoom(formData: FormData) {
  const session = await requireAuth();
  const propertyId = formData.get('propertyId') as string;
  const name = (formData.get('name') as string)?.trim();
  const monthlyRent = parseOptionalMonthlyRent(formData.get('monthlyRent'));

  if (!propertyId || !name) {
    return { error: '請填寫必填欄位' };
  }
  if (!monthlyRent.ok) {
    return { error: '月租必須為 0 或以上' };
  }

  if (!(await canAccessProperty(propertyId, session))) {
    return { error: '權限不足' };
  }

  const room = await prisma.room.create({
    data: { propertyId, name, monthlyRent: monthlyRent.value },
  });
  return { success: true, id: room.id };
}

export async function updateRoom(
  id: string,
  data: { name?: string; monthlyRent?: number | null }
) {
  const session = await requireAuth();
  if (!(await canAccessRoom(id, session))) return { error: '權限不足' };

  await prisma.room.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent }),
    },
  });
  return { success: true };
}
