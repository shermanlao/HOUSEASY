import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRoomsForUser } from '@/actions/room';
import { PageShell } from '@/components/PageShell';

export default async function RoomsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const rooms = await getRoomsForUser();

  return (
    <PageShell role={session.role}>
      <h1 style={{ marginTop: '1.5rem' }}>房間管理</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {rooms.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無房間。請先在物業下新增房間。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>物業</th>
                <th>房間名稱</th>
                <th>月租</th>
                <th>租客數</th>
                <th>租單數</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td>{r.property.name || r.property.addressChinese}</td>
                  <td>{r.name}</td>
                  <td>${Number(r.monthlyRent).toLocaleString()}</td>
                  <td>{r._count.tenants}</td>
                  <td>{r._count.statements}</td>
                  <td>
                    <Link href={`/properties/${r.propertyId}/rooms/${r.id}`}>檢視</Link>
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
