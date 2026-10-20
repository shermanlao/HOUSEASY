import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { AddOwnerForm } from './AddOwnerForm';
import { PageShell } from '@/components/PageShell';
import { formatMonthlyRent } from '@/lib/rent';

export default async function PropertyDetailPage({
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
      <div style={{ marginTop: '1.5rem' }}>
        <Link href="/properties" style={{ fontSize: '0.875rem' }}>
          ← 返回物業列表
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ margin: 0 }}>物業詳情</h1>
          {canEdit && (
            <Link href={`/properties/${id}/edit`} className="btn btn-primary">
              編輯物業
            </Link>
          )}
        </div>
        <table className="table" style={{ marginTop: '1rem' }}>
          <tbody>
            {property.name && (
              <tr>
                <td style={{ fontWeight: 600, width: '140px' }}>物業名稱</td>
                <td>{property.name}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 600, width: '140px' }}>地址（中文）</td>
              <td>{property.addressChinese}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>地址（英文）</td>
              <td>{property.addressEnglish}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>業主</td>
              <td>
                {property.owners.map((o) => o.user.name).join(', ')}
              </td>
            </tr>
          </tbody>
        </table>
        {canEdit && session?.role === 'ADMIN' && (
          <div style={{ marginTop: '1rem' }}>
            <AddOwnerForm propertyId={id} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>房間</h2>
          <Link href={`/properties/${id}/rooms`} className="btn btn-primary">
            房間管理
          </Link>
        </div>
        {property.rooms.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無房間，請先新增。</p>
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
                  <td>{r.tenants.length}</td>
                  <td>{r._count.statements}</td>
                  <td>
                    <Link href={`/properties/${id}/rooms/${r.id}`}>檢視</Link>
                    {' | '}
                    <Link href={`/properties/${id}/rooms/${r.id}/edit`}>編輯</Link>
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
