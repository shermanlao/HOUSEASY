import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTenant } from '@/actions/tenant';
import { AddTenantForm } from '@/components/AddTenantForm';
import { PageShell } from '@/components/PageShell';

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const roomHref = `/properties/${tenant.room.propertyId}/rooms/${tenant.roomId}`;

  return (
    <PageShell role={session?.role} propertyId={tenant.room.propertyId}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={roomHref}>← 返回房間</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯租客</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {tenant.room.property.addressChinese} / {tenant.room.name}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <AddTenantForm
          roomId={tenant.roomId}
          tenant={{
            id: tenant.id,
            nameChinese: tenant.nameChinese,
            nameEnglish: tenant.nameEnglish,
            phone: tenant.phone,
            passportOrHkid: tenant.passportOrHkid,
          }}
        />
      </div>
    </PageShell>
  );
}
