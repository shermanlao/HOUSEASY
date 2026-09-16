import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>RentalEasy 租務易</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
        歡迎，{session.name}
      </p>
      <nav className="nav" style={{ marginTop: '1.5rem', borderBottom: 'none' }}>
        <Link href="/properties">物業管理</Link>
        {session.role === 'ADMIN' && (
          <Link href="/admin/users">用戶管理</Link>
        )}
        <Link href="/logout">登出</Link>
      </nav>
    </div>
  );
}
