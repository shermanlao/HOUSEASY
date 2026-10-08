import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PageShell } from '@/components/PageShell';
import { DeployPanel } from './DeployPanel';

export default async function DeployAdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/properties');

  return (
    <PageShell role={session.role}>
      <h1 style={{ marginTop: '1.5rem' }}>版本管理</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        租務易與 LEVO 分開顯示 git 版本。推上使用伺服器已有的 git 權限，不會再問 token。
      </p>
      <DeployPanel />
    </PageShell>
  );
}
