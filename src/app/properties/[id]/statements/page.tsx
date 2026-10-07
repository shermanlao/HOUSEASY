import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { getStatementsForUser } from '@/actions/statement';
import { PageShell } from '@/components/PageShell';

export default async function StatementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tenantId?: string; roomId?: string }>;
}) {
  const { id } = await params;
  const { tenantId, roomId } = await searchParams;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  const statements = await getStatementsForUser({
    propertyId: id,
    tenantId: tenantId || undefined,
    roomId: roomId || undefined,
  });
  const canEdit = property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}`}>← 返回物業</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>租單列表</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
            {property.addressChinese}
          </p>
        </div>
        {canEdit && (
          <Link href={`/properties/${id}/statements/new`} className="btn btn-primary">
            新增租單
          </Link>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {statements.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無租單</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>房間</th>
                <th>租客</th>
                <th>開始日期</th>
                <th>結束日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((s) => (
                <tr key={s.id}>
                  <td>{s.room.name}</td>
                  <td>{s.tenant.nameChinese} {s.tenant.nameEnglish}</td>
                  <td>{new Date(s.periodStart).toLocaleDateString('zh-Hant')}</td>
                  <td>{new Date(s.periodEnd).toLocaleDateString('zh-Hant')}</td>
                  <td>
                    <Link href={`/statements/${s.id}`}>檢視</Link>
                    {' | '}
                    <Link href={`/statements/${s.id}/print`} target="_blank">列印租單</Link>
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
