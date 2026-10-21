import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { roomId, tenantId, periodStart, periodEnd, billings, rentings } = body;

    if (!roomId || !tenantId || !periodStart || !periodEnd) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    if (!(await canAccessRoom(roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.roomId !== roomId) {
      return Response.json({ error: '租客不屬於此房間' }, { status: 400 });
    }
    if (!tenant.isActive) {
      return Response.json({ error: '只能選擇在住租客' }, { status: 400 });
    }

    await prisma.statement.create({
      data: {
        roomId,
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { id, roomId, tenantId, periodStart, periodEnd, billings, rentings } = body;

    if (!id || !roomId || !tenantId || !periodStart || !periodEnd) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    const stmt = await prisma.statement.findUnique({ where: { id } });
    if (!stmt) return Response.json({ error: '租單不存在' }, { status: 404 });
    if (!(await canAccessRoom(stmt.roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }
    if (!(await canAccessRoom(roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.roomId !== roomId) {
      return Response.json({ error: '租客不屬於此房間' }, { status: 400 });
    }
    if (!tenant.isActive && tenant.id !== stmt.tenantId) {
      return Response.json({ error: '只能選擇在住租客' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.billing.deleteMany({ where: { statementId: id } });
      await tx.renting.deleteMany({ where: { statementId: id } });
      await tx.statement.update({
        where: { id },
        data: {
          roomId,
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
    });
    return Response.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: '更新失敗' }, { status: 500 });
  }
}
