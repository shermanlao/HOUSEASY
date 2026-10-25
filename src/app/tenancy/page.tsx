import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getStatementsForUser } from '@/actions/statement';
import { PageShell } from '@/components/PageShell';

export default async function AllStatementsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const statements = await getStatementsForUser();

  return (
    <PageShell role={session.role}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>租單管理</h1>
        <Link href="/tenancy/new" className="btn btn-primary">
          新增租單
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {statements.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無租單</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>物業</th>
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
                  <td>{s.room.property.name || s.room.property.addressChinese}</td>
                  <td>{s.room.name}</td>
                  <td>{s.tenant.nameChinese} {s.tenant.nameEnglish}</td>
                  <td>{new Date(s.periodStart).toLocaleDateString('zh-Hant')}</td>
                  <td>{new Date(s.periodEnd).toLocaleDateString('zh-Hant')}</td>
                  <td>
                    <Link href={`/tenancy/${s.id}`}>檢視</Link>
                    {' | '}
                    <Link href={`/tenancy/${s.id}/edit`}>編輯</Link>
                    {' | '}
                    <Link href={`/tenancy/${s.id}/print`} target="_blank">列印租單</Link>
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
