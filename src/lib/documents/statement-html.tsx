import type { Statement, Property, Tenant, Billing, Renting, Room } from '@prisma/client';
import { chargeUsesReadings } from '@/lib/billing';

function num(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'object' && n !== null && 'toString' in n) return parseFloat((n as { toString: () => string }).toString()) || 0;
  return 0;
}

type StatementWithRelations = Statement & {
  room: Room & { property: Property };
  tenant: Tenant;
  billings: Billing[];
  rentings: Renting[];
};

function meterLabels(title: string) {
  const lower = title.toLowerCase();
  if (title.includes('電') || lower.includes('electric')) {
    return {
      section: '本月電費金額 Monthly Electricity Fee',
      last: '上月電費度數 Last Reading',
      current: '本月電費度數 Electricity Reading',
      used: '耗電度數 Total Used',
    };
  }
  if (title.includes('水') || lower.includes('water')) {
    return {
      section: '本月水費金額 Monthly Water Fee',
      last: '上月水費度數 Last Reading',
      current: '本月水費度數 Water Reading',
      used: '耗水度數 Total Used',
    };
  }
  return {
    section: title,
    last: '上月度數 Last Reading',
    current: '今月度數 This Reading',
    used: '用量 Total Used',
  };
}

function renderBillingSection(b: Billing): string {
  const qty = num(b.qty);
  const rate = num(b.unitRate);
  const subtotal = `HK$${rate.toFixed(2)} x ${qty} = $${(qty * rate).toFixed(2)}`;
  const date = new Date(b.issueDate).toLocaleDateString('en-GB');

  if (!chargeUsesReadings(num(b.lastReading), num(b.thisReading))) {
    return `
  <div class="section-title">${b.title}</div>
  <table>
    <thead>
      <tr>
        <th>數量 QTY</th>
        <th>日期 Date</th>
        <th>合計 Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${qty}</td>
        <td>${date}</td>
        <td>${subtotal}</td>
      </tr>
    </tbody>
  </table>`;
  }

  const labels = meterLabels(b.title);
  return `
  <div class="section-title">${labels.section}</div>
  <table>
    <thead>
      <tr>
        <th>${labels.last}</th>
        <th>日期 Date</th>
        <th>${labels.current}</th>
        <th>日期 Date</th>
        <th>${labels.used}</th>
        <th>合計 Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${num(b.lastReading)}</td>
        <td>${date}</td>
        <td>${num(b.thisReading)}</td>
        <td>${date}</td>
        <td>${qty}</td>
        <td>${subtotal}</td>
      </tr>
    </tbody>
  </table>`;
}

export function renderStatementHTML(stmt: StatementWithRelations): string {
  const billingTotal = stmt.billings.reduce((sum, b) => sum + num(b.qty) * num(b.unitRate), 0);
  const rentingBalance = stmt.rentings.reduce((sum, r) => sum + (num(r.paymentReceived) - num(r.openingBalance)), 0);
  const monthlyRent = stmt.room.monthlyRent == null ? 0 : num(stmt.room.monthlyRent);
  const rentLine = stmt.room.monthlyRent == null ? '—' : `HK$${monthlyRent.toLocaleString()}`;
  const totalDue = monthlyRent + billingTotal - rentingBalance;

  const billingSections = [...stmt.billings]
    .sort((a, b) => a.placement - b.placement)
    .map((b) => renderBillingSection(b))
    .join('');

  const rentingRows = stmt.rentings
    .sort((a, b) => a.placement - b.placement)
    .map(
      (r) => `
    <tr>
      <td>${new Date(r.lastPaymentDate).toLocaleDateString('en-GB')}</td>
      <td>$${num(r.openingBalance).toFixed(2)}</td>
      <td>$${num(r.paymentReceived).toFixed(2)}</td>
      <td>$${(num(r.paymentReceived) - num(r.openingBalance)).toFixed(2)}</td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>租單 Rent Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 24px; font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; }
    .section-title { font-weight: 600; margin: 16px 0 8px; }
    .total { font-weight: 600; font-size: 1.1rem; margin-top: 8px; background: #ffffcc; padding: 8px; }
    .note { font-size: 0.85rem; color: #666; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>租單 Rent Statement</h1>

  <table>
    <tr><th>姓名 Name</th><td>${stmt.tenant.nameChinese} ${stmt.tenant.nameEnglish} ${stmt.tenant.phone}</td></tr>
    <tr><th>地址 Address</th><td>${stmt.room.property.addressChinese}<br>${stmt.room.property.addressEnglish} ${stmt.room.name}</td></tr>
  </table>

  ${billingSections}

  <div class="section-title">本月租金 Monthly Rent</div>
  <p>${rentLine}</p>

  ${stmt.rentings.length > 0 ? `
  <div class="section-title">上次繳款 Previous Payment</div>
  <table>
    <thead>
      <tr>
        <th>上次繳款日期 Last Payment Date</th>
        <th>上次應繳金額 Opening Balance</th>
        <th>上次繳款金額 Payment Received</th>
        <th>上月結餘 Previous Balance</th>
      </tr>
    </thead>
    <tbody>${rentingRows}</tbody>
  </table>
  ` : ''}

  <div class="total">合計 Total: HK$${(monthlyRent + billingTotal).toFixed(2)}${rentingBalance !== 0 ? ` - $${rentingBalance.toFixed(2)}` : ''} = HK$${totalDue.toFixed(2)}</div>
  <div class="note">總數金額 = 本月租金+電費+水費-上月結餘<br>Total Amount = Monthly Rent + Electricity Fee + Water Fee - Previous Balance</div>
</body>
</html>`;
}
