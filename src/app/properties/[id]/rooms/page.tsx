import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { CreateRoomForm } from '@/components/CreateRoomForm';
import { PageShell } from '@/components/PageShell';
import { formatMonthlyRent } from '@/lib/rent';

export default async function PropertyRoomsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  const canEdit = property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}`}>← 返回物業</Link>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h1 style={{ margin: 0 }}>房間管理</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
          {property.addressChinese}
        </p>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {canEdit && <CreateRoomForm propertyId={id} />}
        {property.rooms.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無房間</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>房間名稱</th>
                <th>月租</th>
                <th>租客數</th>
                <th>租單數</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {property.rooms.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{formatMonthlyRent(r.monthlyRent)}</td>
                  <td>{r.tenants.filter((t) => t.isActive).length}</td>
                  <td>{r._count.statements}</td>
                  <td>
                    <Link href={`/properties/${id}/rooms/${r.id}`}>檢視</Link>
                    {' | '}
                    <Link href={`/properties/${id}/rooms/${r.id}/edit`}>編輯</Link>
                    {' | '}
                    <Link href={`/properties/${id}/statements?roomId=${r.id}`}>檢視租單</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
