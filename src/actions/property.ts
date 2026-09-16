'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function getPropertiesForUser() {
  const session = await requireAuth();
  const owners = await prisma.propertyOwner.findMany({
    where: { userId: session.id },
    include: {
      property: {
        include: {
          tenants: true,
          _count: { select: { statements: true } },
        },
      },
    },
  });
  return owners.map((o) => o.property);
}

export async function createProperty(formData: FormData) {
  const session = await requireAuth();
  const name = (formData.get('name') as string) || '';
  const addressChinese = formData.get('addressChinese') as string;
  const addressEnglish = formData.get('addressEnglish') as string;
  const monthlyRent = parseFloat(formData.get('monthlyRent') as string);

  if (!addressChinese || !addressEnglish || isNaN(monthlyRent)) {
    return { error: '請填寫所有欄位' };
  }

  const property = await prisma.property.create({
    data: {
      name,
      addressChinese,
      addressEnglish,
      monthlyRent,
      owners: {
        create: { userId: session.id },
      },
    },
  });
  return { success: true, id: property.id };
}

export async function addOwnerToProperty(propertyId: string, userId: string) {
  await requireAuth();
  await prisma.propertyOwner.create({
    data: { propertyId, userId },
  });
  return { success: true };
}

export async function getProperty(id: string) {
  const session = await requireAuth();
  const property = await prisma.property.findFirst({
    where: { id },
    include: {
      owners: { include: { user: { select: { id: true, name: true, email: true } } } },
      tenants: true,
    },
  });
  if (!property) return null;
  const isOwner = property.owners.some((o) => o.userId === session.id);
  if (!isOwner && session.role !== 'ADMIN') return null;
  return property;
}

export async function updateProperty(
  id: string,
  data: { addressChinese?: string; addressEnglish?: string; monthlyRent?: number }
) {
  const session = await requireAuth();
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId: id, userId: session.id },
  });
  if (!owned) return { error: '權限不足' };

  await prisma.property.update({
    where: { id },
    data: {
      ...(data.addressChinese != null && { addressChinese: data.addressChinese }),
      ...(data.addressEnglish != null && { addressEnglish: data.addressEnglish }),
      ...(data.monthlyRent != null && { monthlyRent: data.monthlyRent }),
    },
  });
  return { success: true };
}
