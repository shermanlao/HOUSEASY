import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOwnAccount } from '@/actions/account';
import { AccountForm } from '../AccountForm';
import { PageShell } from '@/components/PageShell';

export default async function EditAccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'ADMIN') redirect('/admin/users');

  const user = await getOwnAccount();
  if (!user) redirect('/login');

  return (
    <PageShell role={session.role}>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/account">← 返回用戶管理</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯用戶</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <AccountForm user={{ email: user.email, name: user.name }} />
      </div>
    </PageShell>
  );
}
