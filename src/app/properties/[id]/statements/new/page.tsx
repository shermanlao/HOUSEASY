import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { CreateStatementForm } from '../CreateStatementForm';
import { PageShell } from '@/components/PageShell';

export default async function NewStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  const canEdit = property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';
  if (!canEdit) notFound();

  const rooms = property.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    propertyId: property.id,
    monthlyRent: Number(r.monthlyRent),
    tenants: r.tenants.map((t) => ({
      id: t.id,
      nameChinese: t.nameChinese,
      nameEnglish: t.nameEnglish,
    })),
  }));

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}/statements`}>← 返回租單列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>新增租單</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {property.addressChinese}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {rooms.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>請先新增房間與租客。</p>
        ) : (
          <CreateStatementForm
            rooms={rooms}
            returnTo={`/properties/${id}/statements`}
          />
        )}
      </div>
    </PageShell>
  );
}
