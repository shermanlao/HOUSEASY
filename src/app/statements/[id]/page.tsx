import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getStatement } from '@/actions/statement';

function num(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'object' && n !== null && 'toString' in n) return parseFloat((n as { toString: () => string }).toString()) || 0;
  return 0;
}

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const stmt = await getStatement(id);
  if (!stmt) notFound();

  const billingTotal = stmt.billings.reduce((sum, b) => sum + num(b.qty) * num(b.unitRate), 0);
  const rentingBalance = stmt.rentings.reduce((sum, r) => sum + (num(r.paymentReceived) - num(r.openingBalance)), 0);
  const totalDue = num(stmt.property.monthlyRent) + billingTotal - rentingBalance;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/">首頁</Link>
        <Link href="/properties">物業管理</Link>
        {session?.role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
        <Link href="/logout">登出</Link>
      </nav>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${stmt.propertyId}/statements`}>← 返回租單列表</Link>
      </div>
      <h1 style={{ marginTop: '1rem' }}>租單詳情</h1>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p><strong>物業：</strong>{stmt.property.addressChinese}</p>
        <p><strong>租客：</strong>{stmt.tenant.nameChinese} {stmt.tenant.nameEnglish} {stmt.tenant.phone}</p>
        <p><strong>期數：</strong>
          {new Date(stmt.periodStart).toLocaleDateString('zh-Hant')} 至 {new Date(stmt.periodEnd).toLocaleDateString('zh-Hant')}
        </p>

        <h3 style={{ marginTop: '1.5rem' }}>收費項目</h3>
        <table className="table">
          <thead>
            <tr>
              <th>項目</th>
              <th>上月度數</th>
              <th>今月度數</th>
              <th>用量</th>
              <th>單價</th>
              <th>小計</th>
            </tr>
          </thead>
          <tbody>
            {stmt.billings.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{num(b.lastReading)}</td>
                <td>{num(b.thisReading)}</td>
                <td>{num(b.qty)}</td>
                <td>${num(b.unitRate)}</td>
                <td>${(num(b.qty) * num(b.unitRate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: '0.5rem' }}><strong>月租：</strong>${num(stmt.property.monthlyRent).toLocaleString()}</p>

        {stmt.rentings.length > 0 && (
          <>
            <h3 style={{ marginTop: '1rem' }}>上次繳款</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>應繳</th>
                  <th>實收</th>
                  <th>結餘</th>
                </tr>
              </thead>
              <tbody>
                {stmt.rentings.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.lastPaymentDate).toLocaleDateString('zh-Hant')}</td>
                    <td>${num(r.openingBalance).toFixed(2)}</td>
                    <td>${num(r.paymentReceived).toFixed(2)}</td>
                    <td>${(num(r.paymentReceived) - num(r.openingBalance)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p style={{ marginTop: '1rem', fontWeight: 600 }}>合計需繳：${totalDue.toFixed(2)}</p>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link href={`/statements/${id}/print`} className="btn btn-primary" target="_blank">
          列印租單
        </Link>
        <Link href={`/statements/${id}/receipts`} className="btn btn-secondary">
          收據管理
        </Link>
      </div>
    </div>
  );
}
