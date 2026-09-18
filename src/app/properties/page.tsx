import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPropertiesForUser } from '@/actions/property';
import { LogoutButton } from '@/components/LogoutButton';

export default async function PropertiesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const properties = await getPropertiesForUser();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/properties">物業管理</Link>
        {session.role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
        <LogoutButton />
      </nav>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>我的物業</h1>
        <Link href="/properties/new" className="btn btn-primary">
          新增物業
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {properties.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無物業，請先新增。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>物業名稱</th>
                <th>地址（中文）</th>
                <th>地址（英文）</th>
                <th>月租</th>
                <th>租客數</th>
                <th>租單數</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}>
                  <td>{p.name || p.addressChinese || '-'}</td>
                  <td>{p.addressChinese}</td>
                  <td>{p.addressEnglish}</td>
                  <td>${Number(p.monthlyRent).toLocaleString()}</td>
                  <td>{p.tenants.length}</td>
                  <td>{p._count?.statements ?? 0}</td>
                  <td>
                    <Link href={`/properties/${p.id}`}>檢視</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
