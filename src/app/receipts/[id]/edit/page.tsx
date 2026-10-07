import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReceipt } from '@/actions/receipt';
import { AddReceiptForm } from '@/app/statements/[id]/receipts/AddReceiptForm';
import { PageShell } from '@/components/PageShell';
import { toInputDate } from '@/lib/dates';

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const receipt = await getReceipt(id);
  if (!receipt) notFound();

  const statementHref = `/statements/${receipt.statementId}/receipts`;

  return (
    <PageShell role={session?.role} propertyId={receipt.statement.room.propertyId}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={statementHref}>← 返回收據列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯收據</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {receipt.statement.tenant.nameChinese}{' '}
        {receipt.statement.tenant.nameEnglish}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <AddReceiptForm
          statementId={receipt.statementId}
          receipt={{
            id: receipt.id,
            paymentDate: toInputDate(receipt.paymentDate),
            amountReceived: Number(receipt.amountReceived),
          }}
        />
      </div>
    </PageShell>
  );
}
