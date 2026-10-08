import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOwnAccount } from '@/actions/account';
import { PageShell } from '@/components/PageShell';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'ADMIN') redirect('/admin/users');

  const user = await getOwnAccount();
  if (!user) redirect('/login');

  return (
    <PageShell role={session.role}>
      <h1 style={{ marginTop: '1.5rem' }}>用戶管理</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>電郵</th>
              <th>姓名</th>
              <th>角色</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>業主</td>
              <td>{new Date(user.createdAt).toLocaleDateString('zh-Hant')}</td>
              <td>
                <Link href="/account/edit">編輯</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
