'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessProperty } from '@/lib/access';

const propertyListInclude = {
  rooms: {
    include: {
      tenants: true,
      _count: { select: { statements: true } },
    },
  },
  _count: { select: { rooms: true } },
} as const;

export async function getPropertiesForUser() {
  const session = await requireAuth();

  if (session.role === 'ADMIN') {
    return prisma.property.findMany({
      include: propertyListInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  const owners = await prisma.propertyOwner.findMany({
    where: { userId: session.id },
    include: {
      property: { include: propertyListInclude },
    },
  });
  return owners.map((o) => o.property);
}

export async function createProperty(formData: FormData) {
  const session = await requireAuth();
  const name = (formData.get('name') as string) || '';
  const addressChinese = formData.get('addressChinese') as string;
  const addressEnglish = formData.get('addressEnglish') as string;

  if (!addressChinese || !addressEnglish) {
    return { error: '請填寫所有欄位' };
  }

  const property = await prisma.property.create({
    data: {
      name,
      addressChinese,
      addressEnglish,
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
      rooms: {
        include: {
          tenants: true,
          _count: { select: { statements: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!property) return null;
  const isOwner = property.owners.some((o) => o.userId === session.id);
  if (!isOwner && session.role !== 'ADMIN') return null;
  return property;
}

export async function updateProperty(
  id: string,
  data: { addressChinese?: string; addressEnglish?: string }
) {
  const session = await requireAuth();
  if (!(await canAccessProperty(id, session))) return { error: '權限不足' };

  await prisma.property.update({
    where: { id },
    data: {
      ...(data.addressChinese != null && { addressChinese: data.addressChinese }),
      ...(data.addressEnglish != null && { addressEnglish: data.addressEnglish }),
    },
  });
  return { success: true };
}
