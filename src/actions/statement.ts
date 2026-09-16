'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
export async function getStatementsForProperty(propertyId: string, tenantId?: string) {
  const session = await requireAuth();
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId, userId: session.id },
  });
  if (!owned && session.role !== 'ADMIN') return [];

  const where: { propertyId: string; tenantId?: string } = { propertyId };
  if (tenantId) where.tenantId = tenantId;

  return prisma.statement.findMany({
    where,
    include: {
      tenant: true,
      billings: { orderBy: { placement: 'asc' } },
      rentings: { orderBy: { placement: 'asc' } },
      receipts: true,
    },
    orderBy: { periodStart: 'desc' },
  });
}

export async function getStatement(id: string) {
  const session = await requireAuth();
  const stmt = await prisma.statement.findUnique({
    where: { id },
    include: {
      property: true,
      tenant: true,
      billings: { orderBy: { placement: 'asc' } },
      rentings: { orderBy: { placement: 'asc' } },
      receipts: true,
    },
  });
  if (!stmt) return null;
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId: stmt.propertyId, userId: session.id },
  });
  if (!owned && session.role !== 'ADMIN') return null;
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
  propertyId: string;
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  billings: BillingInput[];
  rentings: RentingInput[];
}) {
  const session = await requireAuth();
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId: data.propertyId, userId: session.id },
  });
  if (!owned && session.role !== 'ADMIN') {
    return { error: '權限不足' };
  }

  await prisma.statement.create({
    data: {
      propertyId: data.propertyId,
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
