import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getStatement } from '@/actions/statement';
import { AddReceiptForm } from './AddReceiptForm';
import { PageShell } from '@/components/PageShell';

function num(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'object' && n !== null && 'toString' in n) return parseFloat((n as { toString: () => string }).toString()) || 0;
  return 0;
}

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const stmt = await getStatement(id);
  if (!stmt) notFound();

  return (
    <PageShell role={session?.role} propertyId={stmt.room.propertyId}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/statements/${id}`}>← 返回租單</Link>
      </div>
      <h1 style={{ marginTop: '1rem' }}>收據管理</h1>
      <p style={{ color: 'var(--muted)' }}>{stmt.tenant.nameChinese} - {new Date(stmt.periodStart).toLocaleDateString('zh-Hant')} 至 {new Date(stmt.periodEnd).toLocaleDateString('zh-Hant')}</p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>新增收據</h2>
        <AddReceiptForm statementId={id} />
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>收據列表</h2>
        {stmt.receipts.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>尚無收據</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>繳款日期</th>
                <th>金額</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {stmt.receipts.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.paymentDate).toLocaleDateString('zh-Hant')}</td>
                  <td>${num(r.amountReceived).toFixed(2)}</td>
                  <td>
                    <Link href={`/receipts/${r.id}/print`} target="_blank" rel="noopener">列印收據</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
