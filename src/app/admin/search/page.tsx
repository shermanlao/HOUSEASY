import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PageShell } from '@/components/PageShell';
import { SearchAdminPanel } from './SearchAdminPanel';

export default async function SearchAdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/properties');

  return (
    <PageShell role={session.role}>
      <h1 style={{ marginTop: '1.5rem' }}>搜尋管理</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        物業搜尋樓盤資料與同步
      </p>
      <SearchAdminPanel />
    </PageShell>
  );
}
