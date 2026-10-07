'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { accessiblePropertyIds, canAccessProperty, canAccessRoom } from '@/lib/access';

const statementInclude = {
  tenant: true,
  room: { include: { property: true } },
  billings: { orderBy: { placement: 'asc' as const } },
  rentings: { orderBy: { placement: 'asc' as const } },
  receipts: true,
};

export async function getStatementsForUser(opts?: { propertyId?: string; roomId?: string; tenantId?: string }) {
  const session = await requireAuth();
  const propertyIds = await accessiblePropertyIds(session);

  if (opts?.propertyId && !(await canAccessProperty(opts.propertyId, session))) return [];
  if (opts?.roomId && !(await canAccessRoom(opts.roomId, session))) return [];

  return prisma.statement.findMany({
    where: {
      ...(opts?.tenantId ? { tenantId: opts.tenantId } : {}),
      ...(opts?.roomId
        ? { roomId: opts.roomId }
        : {
            room: {
              ...(opts?.propertyId
                ? { propertyId: opts.propertyId }
                : propertyIds === null
                  ? {}
                  : { propertyId: { in: propertyIds } }),
            },
          }),
    },
    include: statementInclude,
    orderBy: { periodStart: 'desc' },
  });
}

export async function getStatement(id: string) {
  const session = await requireAuth();
  const stmt = await prisma.statement.findUnique({
    where: { id },
    include: statementInclude,
  });
  if (!stmt) return null;
  if (!(await canAccessRoom(stmt.roomId, session))) return null;
  return stmt;
}

interface BillingInput {
  issueDate: Date;
  title: string;
  qty: number;
  unitRate: number;
  lastReading: number;
  thisReading: number;
  placement: number;
}

interface RentingInput {
  lastPaymentDate: Date;
  openingBalance: number;
  paymentReceived: number;
  placement: number;
}

export async function createStatement(data: {
  roomId: string;
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  billings: BillingInput[];
  rentings: RentingInput[];
}) {
  const session = await requireAuth();
  if (!(await canAccessRoom(data.roomId, session))) {
    return { error: '權限不足' };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
  if (!tenant || tenant.roomId !== data.roomId) {
    return { error: '租客不屬於此房間' };
  }

  await prisma.statement.create({
    data: {
      roomId: data.roomId,
      tenantId: data.tenantId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      billings: {
        create: data.billings.map((b) => ({
          issueDate: b.issueDate,
          title: b.title,
          qty: b.qty,
          unitRate: b.unitRate,
          lastReading: b.lastReading,
          thisReading: b.thisReading,
          placement: b.placement,
        })),
      },
      rentings: {
        create: data.rentings.map((r) => ({
          lastPaymentDate: r.lastPaymentDate,
          openingBalance: r.openingBalance,
          paymentReceived: r.paymentReceived,
          placement: r.placement,
        })),
      },
    },
  });
  return { success: true };
}

export async function updateStatement(
  id: string,
  data: {
    roomId: string;
    tenantId: string;
    periodStart: Date;
    periodEnd: Date;
    billings: BillingInput[];
    rentings: RentingInput[];
  }
) {
  const session = await requireAuth();
  const stmt = await prisma.statement.findUnique({ where: { id } });
  if (!stmt) return { error: '租單不存在' };
  if (!(await canAccessRoom(stmt.roomId, session))) return { error: '權限不足' };
  if (!(await canAccessRoom(data.roomId, session))) return { error: '權限不足' };

  const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
  if (!tenant || tenant.roomId !== data.roomId) {
    return { error: '租客不屬於此房間' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.billing.deleteMany({ where: { statementId: id } });
    await tx.renting.deleteMany({ where: { statementId: id } });
    await tx.statement.update({
      where: { id },
      data: {
        roomId: data.roomId,
        tenantId: data.tenantId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        billings: {
          create: data.billings.map((b) => ({
            issueDate: b.issueDate,
            title: b.title,
            qty: b.qty,
            unitRate: b.unitRate,
            lastReading: b.lastReading,
            thisReading: b.thisReading,
            placement: b.placement,
          })),
        },
        rentings: {
          create: data.rentings.map((r) => ({
            lastPaymentDate: r.lastPaymentDate,
            openingBalance: r.openingBalance,
            paymentReceived: r.paymentReceived,
            placement: r.placement,
          })),
        },
      },
    });
  });
  return { success: true };
}
