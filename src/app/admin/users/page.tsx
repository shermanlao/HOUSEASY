import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getUsers } from '@/actions/admin';
import { AddUserForm } from './AddUserForm';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/properties');

  const users = await getUsers();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/properties">物業管理</Link>
        <Link href="/admin/users">用戶管理</Link>
        <LogoutButton />
      </nav>
      <h1 style={{ marginTop: '1.5rem' }}>用戶管理</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>新增業主</h2>
        <AddUserForm />
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>用戶列表</h2>
        <table className="table">
          <thead>
            <tr>
              <th>電郵</th>
              <th>姓名</th>
              <th>角色</th>
              <th>建立時間</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role === 'ADMIN' ? '管理員' : '業主'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString('zh-Hant')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
