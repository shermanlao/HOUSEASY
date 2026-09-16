import type { Statement, Property, Tenant, Billing, Renting } from '@prisma/client';

function num(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'object' && n !== null && 'toString' in n) return parseFloat((n as { toString: () => string }).toString()) || 0;
  return 0;
}

type StatementWithRelations = Statement & {
  property: Property;
  tenant: Tenant;
  billings: Billing[];
  rentings: Renting[];
};

export function renderStatementHTML(stmt: StatementWithRelations): string {
  const billingTotal = stmt.billings.reduce((sum, b) => sum + num(b.qty) * num(b.unitRate), 0);
  const rentingBalance = stmt.rentings.reduce((sum, r) => sum + (num(r.paymentReceived) - num(r.openingBalance)), 0);
  const totalDue = num(stmt.property.monthlyRent) + billingTotal - rentingBalance;

  const elec = stmt.billings.find((b) => b.title.includes('電') || b.title.toLowerCase().includes('electric'));
  const water = stmt.billings.find((b) => b.title.includes('水') || b.title.toLowerCase().includes('water'));

  const billingRow = (b: (typeof stmt.billings)[0]) => `
    <tr>
      <td>${num(b.lastReading)}</td>
      <td>${new Date(b.issueDate).toLocaleDateString('en-GB')}</td>
      <td>${num(b.thisReading)}</td>
      <td>${new Date(b.issueDate).toLocaleDateString('en-GB')}</td>
      <td>${num(b.qty)}</td>
      <td>HK$${num(b.unitRate).toFixed(2)} x ${num(b.qty)} = $${(num(b.qty) * num(b.unitRate)).toFixed(2)}</td>
    </tr>`;

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
    <tr><th>地址 Address</th><td>${stmt.property.addressChinese}<br>${stmt.property.addressEnglish}</td></tr>
  </table>

  ${elec ? `
  <div class="section-title">本月電費金額 Monthly Electricity Fee</div>
  <table>
    <thead>
      <tr>
        <th>上月電費度數 Last Reading</th>
        <th>日期 Date</th>
        <th>本月電費度數 Electricity Reading</th>
        <th>日期 Date</th>
        <th>耗電度數 Total Used</th>
        <th>合計 Subtotal</th>
      </tr>
    </thead>
    <tbody>${billingRow(elec)}</tbody>
  </table>
  ` : ''}

  ${water ? `
  <div class="section-title">本月水費金額 Monthly Water Fee</div>
  <table>
    <thead>
      <tr>
        <th>上月水費度數 Last Reading</th>
        <th>日期 Date</th>
        <th>本月水費度數 Water Reading</th>
        <th>日期 Date</th>
        <th>耗水度數 Total Used</th>
        <th>合計 Subtotal</th>
      </tr>
    </thead>
    <tbody>${billingRow(water)}</tbody>
  </table>
  ` : ''}

  ${!elec && !water && stmt.billings.length > 0 ? stmt.billings.sort((a,b)=>a.placement-b.placement).map((b) => `
  <div class="section-title">${b.title}</div>
  <table>
    <thead>
      <tr>
        <th>上月度數 Last Reading</th>
        <th>日期 Date</th>
        <th>今月度數 This Reading</th>
        <th>日期 Date</th>
        <th>用量 Total Used</th>
        <th>合計 Subtotal</th>
      </tr>
    </thead>
    <tbody>${billingRow(b)}</tbody>
  </table>
  `).join('') : ''}

  <div class="section-title">本月租金 Monthly Rent</div>
  <p>HK$${num(stmt.property.monthlyRent).toLocaleString()}</p>

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

  <div class="total">合計 Total: HK$${(num(stmt.property.monthlyRent) + billingTotal).toFixed(2)}${rentingBalance !== 0 ? ` - $${rentingBalance.toFixed(2)}` : ''} = HK$${totalDue.toFixed(2)}</div>
  <div class="note">總數金額 = 本月租金+電費+水費-上月結餘<br>Total Amount = Monthly Rent + Electricity Fee + Water Fee - Previous Balance</div>
</body>
</html>`;
}
