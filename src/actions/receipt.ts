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

export async function updateReceipt(
  id: string,
  data: { paymentDate: Date; amountReceived: number }
) {
  const session = await requireAuth();
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { statement: true },
  });
  if (!receipt) return { error: '收據不存在' };
  if (!(await canAccessRoom(receipt.statement.roomId, session))) {
    return { error: '權限不足' };
  }
  if (Number.isNaN(data.amountReceived)) return { error: '請填寫所有欄位' };

  await prisma.receipt.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate,
      amountReceived: data.amountReceived,
    },
  });
  return { success: true };
}
