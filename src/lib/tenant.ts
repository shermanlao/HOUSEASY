import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const ACTIVE_TENANT_ERROR = '此房間已有在住租客，請先遷出。';
export const ACTIVE_TENANT_DELETE_ERROR = '在住租客不能刪除，請先遷出。';

export function tenantsForStatement<T extends { id: string; isActive: boolean }>(
  tenants: T[],
  currentTenantId?: string
): T[] {
  return tenants.filter((t) => t.isActive || t.id === currentTenantId);
}

function activeTenantTaken(err: unknown): boolean {
  return (
    (err instanceof Error && err.message === ACTIVE_TENANT_ERROR) ||
    (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
  );
}

export async function createActiveTenant(data: {
  roomId: string;
  nameChinese: string;
  nameEnglish: string;
  phone: string;
  passportOrHkid?: string;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const active = await tx.tenant.findFirst({
        where: { roomId: data.roomId, isActive: true },
        select: { id: true },
      });
      if (active) throw new Error(ACTIVE_TENANT_ERROR);
      return tx.tenant.create({
        data: { ...data, isActive: true },
      });
    });
  } catch (err) {
    if (activeTenantTaken(err)) throw new Error(ACTIVE_TENANT_ERROR);
    throw err;
  }
}

export async function setTenantActive(id: string, isActive: boolean) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return { error: '租客不存在' as const };
  if (tenant.isActive === isActive) return { tenant };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (isActive) {
        const other = await tx.tenant.findFirst({
          where: { roomId: tenant.roomId, isActive: true, NOT: { id } },
          select: { id: true },
        });
        if (other) throw new Error(ACTIVE_TENANT_ERROR);
      }
      return tx.tenant.update({ where: { id }, data: { isActive } });
    });
    return { tenant: updated };
  } catch (err) {
    if (activeTenantTaken(err)) return { error: ACTIVE_TENANT_ERROR };
    throw err;
  }
}

export async function deleteInactiveTenant(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });
  if (!tenant) return { error: '租客不存在' as const };
  if (tenant.isActive) return { error: ACTIVE_TENANT_DELETE_ERROR };
  await prisma.tenant.delete({ where: { id } });
  return { success: true as const };
}
