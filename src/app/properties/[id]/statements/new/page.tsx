import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { CreateStatementForm } from '../CreateStatementForm';

export default async function NewStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  const canEdit = property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';
  if (!canEdit) notFound();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/">首頁</Link>
        <Link href="/properties">物業管理</Link>
        {session?.role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
        <Link href="/logout">登出</Link>
      </nav>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}/statements`}>← 返回租單列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>新增租單</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {property.addressChinese}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreateStatementForm property={property} />
      </div>
    </div>
  );
}
