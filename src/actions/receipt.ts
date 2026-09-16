'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function getReceipt(id: string) {
  const session = await requireAuth();
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      statement: {
        include: {
          property: true,
          tenant: true,
        },
      },
    },
  });
  if (!receipt) return null;
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId: receipt.statement.propertyId, userId: session.id },
  });
  if (!owned && session.role !== 'ADMIN') return null;
  return receipt;
}
