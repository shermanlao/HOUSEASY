import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const statementId = formData.get('statementId') as string;
    const paymentDate = formData.get('paymentDate') as string;
    const amountReceived = parseFloat(formData.get('amountReceived') as string);

    if (!statementId || !paymentDate || isNaN(amountReceived)) {
      return Response.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    const stmt = await prisma.statement.findUnique({
      where: { id: statementId },
    });
    if (!stmt) return Response.json({ error: '租單不存在' }, { status: 404 });

    if (!(await canAccessRoom(stmt.roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.receipt.create({
      data: {
        statementId,
        paymentDate: new Date(paymentDate),
        amountReceived,
      },
    });
    return Response.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: '新增失敗' }, { status: 500 });
  }
}
