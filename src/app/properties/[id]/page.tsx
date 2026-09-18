import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { AddTenantForm } from './AddTenantForm';
import { AddOwnerForm } from './AddOwnerForm';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  const canEdit = property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/">首頁</Link>
        <Link href="/properties">物業管理</Link>
        {session?.role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
        <LogoutButton />
      </nav>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href="/properties" style={{ fontSize: '0.875rem' }}>
          ← 返回物業列表
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h1>物業詳情</h1>
        <table className="table" style={{ marginTop: '1rem' }}>
          <tbody>
            {property.name && (
              <tr>
                <td style={{ fontWeight: 600, width: '140px' }}>物業名稱</td>
                <td>{property.name}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 600, width: '140px' }}>地址（中文）</td>
              <td>{property.addressChinese}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>地址（英文）</td>
              <td>{property.addressEnglish}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>月租</td>
              <td>${Number(property.monthlyRent).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>業主</td>
              <td>
                {property.owners.map((o) => o.user.name).join(', ')}
              </td>
            </tr>
          </tbody>
        </table>
        {canEdit && session?.role === 'ADMIN' && (
          <div style={{ marginTop: '1rem' }}>
            <AddOwnerForm propertyId={id} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>租客</h2>
        {canEdit && <AddTenantForm propertyId={id} />}
        {property.tenants.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>尚無租客</p>
        ) : (
          <table className="table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>姓名（中文）</th>
                <th>姓名（英文）</th>
                <th>電話</th>
                <th>護照/身份證</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {property.tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.nameChinese}</td>
                  <td>{t.nameEnglish}</td>
                  <td>{t.phone}</td>
                  <td>{t.passportOrHkid || '-'}</td>
                  <td>
                    <Link href={`/properties/${id}/statements?tenantId=${t.id}`}>檢視租單</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href={`/properties/${id}/statements`} className="btn btn-primary">
          租單管理
        </Link>
      </div>
    </div>
  );
}
