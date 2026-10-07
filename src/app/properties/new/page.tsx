import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { CreatePropertyForm } from '../CreatePropertyForm';
import { PageShell } from '@/components/PageShell';

export default async function NewPropertyPage() {
  const session = await getSession();

  return (
    <PageShell role={session?.role}>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/properties">← 返回物業列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>新增物業</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreatePropertyForm />
      </div>
    </PageShell>
  );
}
