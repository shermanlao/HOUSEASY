import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUsers } from '@/actions/admin';
import { AddUserForm } from './AddUserForm';
import { UsersList } from './UsersList';
import { PageShell } from '@/components/PageShell';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/properties');

  const users = await getUsers();
  const rows = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <PageShell role={session.role}>
      <h1 style={{ marginTop: '1.5rem' }}>用戶管理</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>新增業主</h2>
        <AddUserForm />
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>用戶列表</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          點擊列以編輯用戶，或按刪除移除用戶
        </p>
        <UsersList users={rows} currentUserId={session.id} />
      </div>
    </PageShell>
  );
}
