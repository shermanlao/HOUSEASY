'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';

export async function getReceipt(id: string) {
  const session = await requireAuth();
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      statement: {
        include: {
          room: { include: { property: true } },
          tenant: true,
        },
      },
    },
  });
  if (!receipt) return null;
  if (!(await canAccessRoom(receipt.statement.roomId, session))) return null;
  return receipt;
}
