import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProperty } from '@/actions/property';
import { CreatePropertyForm } from '../../CreatePropertyForm';
import { PageShell } from '@/components/PageShell';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}`}>← 返回物業詳情</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯物業</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreatePropertyForm
          property={{
            id: property.id,
            name: property.name || '',
            addressChinese: property.addressChinese,
            addressEnglish: property.addressEnglish,
          }}
        />
      </div>
    </PageShell>
  );
}
