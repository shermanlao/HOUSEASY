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
        <Link href="/">??</Link>
        <Link href="/properties">????</Link>
        {session?.role === 'ADMIN' && <Link href="/admin/users">????</Link>}
        <LogoutButton />
      </nav>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href="/properties" style={{ fontSize: '0.875rem' }}>
          ? ??????
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h1>????</h1>
        <table className="table" style={{ marginTop: '1rem' }}>
          <tbody>
            {property.name && (
              <tr>
                <td style={{ fontWeight: 600, width: '140px' }}>????</td>
                <td>{property.name}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 600, width: '140px' }}>??????</td>
              <td>{property.addressChinese}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>??????</td>
              <td>{property.addressEnglish}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>??</td>
              <td>${Number(property.monthlyRent).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>??</td>
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
        <h2 style={{ marginBottom: '1rem' }}>??</h2>
        {canEdit && <AddTenantForm propertyId={id} />}
        {property.tenants.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>????</p>
        ) : (
          <table className="table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>??????</th>
                <th>??????</th>
                <th>??</th>
                <th>??/???</th>
                <th>??</th>
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
                    <Link href={`/properties/${id}/statements?tenantId=${t.id}`}>????</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href={`/properties/${id}/statements`} className="btn btn-primary">
          ????
        </Link>
      </div>
    </div>
  );
}
