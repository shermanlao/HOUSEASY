import { prisma } from '@/lib/db';

export type OwnerSignature = {
  name: string;
  pngBase64: string;
};

export async function getOwnerSignaturesForProperty(propertyId: string): Promise<OwnerSignature[]> {
  const owners = await prisma.user.findMany({
    where: {
      propertyOwners: { some: { propertyId } },
      signaturePng: { not: null },
    },
    select: { name: true, signaturePng: true },
    orderBy: { name: 'asc' },
  });
  return owners.flatMap((o) =>
    o.signaturePng
      ? [{ name: o.name, pngBase64: Buffer.from(o.signaturePng).toString('base64') }]
      : []
  );
}
