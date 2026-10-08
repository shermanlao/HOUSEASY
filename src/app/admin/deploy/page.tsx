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
      <div style={{ marginTop: '1rem' }}>
        <DeployPanel />
      </div>
    </PageShell>
  );
}
