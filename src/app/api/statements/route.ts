import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { propertyId, tenantId, periodStart, periodEnd, billings, rentings } = body;

    if (!propertyId || !tenantId || !periodStart || !periodEnd) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    const owned = await prisma.propertyOwner.findFirst({
      where: { propertyId, userId: session.id },
    });
    if (!owned && session.role !== 'ADMIN') {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.statement.create({
      data: {
        propertyId,
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        billings: {
          create: (billings || []).map((b: { issueDate: string; title: string; qty: number; unitRate: number; lastReading: number; thisReading: number; placement: number }) => ({
            issueDate: new Date(b.issueDate || periodEnd),
            title: b.title,
            qty: b.qty,
            unitRate: b.unitRate,
            lastReading: b.lastReading,
            thisReading: b.thisReading,
            placement: b.placement,
          })),
        },
        rentings: {
          create: (rentings || []).map((r: { lastPaymentDate: string; openingBalance: number; paymentReceived: number; placement: number }) => ({
            lastPaymentDate: new Date(r.lastPaymentDate),
            openingBalance: r.openingBalance,
            paymentReceived: r.paymentReceived,
            placement: r.placement,
          })),
        },
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
