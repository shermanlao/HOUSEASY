import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRoomsForUser } from '@/actions/room';
import { CreateStatementForm } from '@/app/properties/[id]/statements/CreateStatementForm';
import { PageShell } from '@/components/PageShell';
import { tenantsForStatement } from '@/lib/tenant';

export default async function NewGlobalStatementPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const rooms = await getRoomsForUser();

  const options = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    propertyId: r.propertyId,
    propertyName: r.property.name || r.property.addressChinese,
    monthlyRent: r.monthlyRent,
    tenants: tenantsForStatement(r.tenants).map((t) => ({
      id: t.id,
      nameChinese: t.nameChinese,
      nameEnglish: t.nameEnglish,
      isActive: t.isActive,
    })),
  }));

  return (
    <PageShell role={session.role}>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/statements">← 返回租單列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>新增租單</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {options.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>請先新增房間與租客。</p>
        ) : (
          <CreateStatementForm rooms={options} returnTo="/statements" />
        )}
      </div>
    </PageShell>
  );
}
