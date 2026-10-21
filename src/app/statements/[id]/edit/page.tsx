import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getStatement } from '@/actions/statement';
import { getRoomsForUser } from '@/actions/room';
import { CreateStatementForm } from '@/app/properties/[id]/statements/CreateStatementForm';
import { PageShell } from '@/components/PageShell';
import { toInputDate } from '@/lib/dates';
import { tenantsForStatement } from '@/lib/tenant';

export default async function EditStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const stmt = await getStatement(id);
  if (!stmt) notFound();

  const rooms = await getRoomsForUser();
  const options = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    propertyId: r.propertyId,
    propertyName: r.property.name || r.property.addressChinese,
    monthlyRent: r.monthlyRent,
    tenants: tenantsForStatement(r.tenants, stmt.tenantId).map((t) => ({
      id: t.id,
      nameChinese: t.nameChinese,
      nameEnglish: t.nameEnglish,
      isActive: t.isActive,
    })),
  }));
  if (!options.some((r) => r.id === stmt.roomId)) {
    options.unshift({
      id: stmt.room.id,
      name: stmt.room.name,
      propertyId: stmt.room.propertyId,
      propertyName: stmt.room.property.name || stmt.room.property.addressChinese,
      monthlyRent: stmt.room.monthlyRent,
      tenants: [
        {
          id: stmt.tenant.id,
          nameChinese: stmt.tenant.nameChinese,
          nameEnglish: stmt.tenant.nameEnglish,
          isActive: stmt.tenant.isActive,
        },
      ],
    });
  }

  const firstRenting = stmt.rentings[0];

  return (
    <PageShell role={session?.role} propertyId={stmt.room.propertyId}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/statements/${id}`}>← 返回租單詳情</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯租單</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {stmt.room.property.addressChinese} / {stmt.room.name}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreateStatementForm
          rooms={options}
          returnTo={`/statements/${id}`}
          statement={{
            id: stmt.id,
            roomId: stmt.roomId,
            tenantId: stmt.tenantId,
            periodStart: toInputDate(stmt.periodStart),
            periodEnd: toInputDate(stmt.periodEnd),
            billings: stmt.billings.map((b) => ({
              title: b.title,
              qty: Number(b.qty),
              unitRate: Number(b.unitRate),
              lastReading: Number(b.lastReading),
              thisReading: Number(b.thisReading),
              issueDate: toInputDate(b.issueDate),
            })),
            renting: firstRenting
              ? {
                  lastPaymentDate: toInputDate(firstRenting.lastPaymentDate),
                  openingBalance: Number(firstRenting.openingBalance),
                  paymentReceived: Number(firstRenting.paymentReceived),
                }
              : { lastPaymentDate: '', openingBalance: 0, paymentReceived: 0 },
          }}
        />
      </div>
    </PageShell>
  );
}
