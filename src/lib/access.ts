import { prisma } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';

export async function canAccessProperty(
  propertyId: string,
  session: SessionUser
): Promise<boolean> {
  if (session.role === 'ADMIN') return true;
  const owned = await prisma.propertyOwner.findFirst({
    where: { propertyId, userId: session.id },
  });
  return !!owned;
}

export async function canAccessRoom(roomId: string, session: SessionUser): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { propertyId: true },
  });
  if (!room) return false;
  return canAccessProperty(room.propertyId, session);
}

/** null means admin can see all properties. */
export async function accessiblePropertyIds(session: SessionUser): Promise<string[] | null> {
  if (session.role === 'ADMIN') return null;
  const owners = await prisma.propertyOwner.findMany({
    where: { userId: session.id },
    select: { propertyId: true },
  });
  return owners.map((o) => o.propertyId);
}
