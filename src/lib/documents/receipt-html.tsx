import type { Receipt, Statement, Property, Tenant } from '@prisma/client';

function num(n: unknown): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'object' && n !== null && 'toString' in n) return parseFloat((n as { toString: () => string }).toString()) || 0;
  return 0;
}

type ReceiptWithRelations = Receipt & {
  statement: Statement & {
    property: Property;
    tenant: Tenant;
  };
};

export function renderReceiptHTML(receipt: ReceiptWithRelations): string {
  const s = receipt.statement;
  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>收據 Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 24px; font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; width: 140px; }
    .total { font-weight: 600; font-size: 1.2rem; margin-top: 24px; text-align: center; }
  </style>
</head>
<body>
  <h1>收據 Receipt</h1>

  <table>
    <tr><th>姓名 Name</th><td>${s.tenant.nameChinese} ${s.tenant.nameEnglish}</td></tr>
    <tr><th>地址 Address</th><td>${s.property.addressChinese}<br>${s.property.addressEnglish}</td></tr>
    <tr><th>租金期數 Period</th><td>${new Date(s.periodStart).toLocaleDateString('zh-Hant')} 至 ${new Date(s.periodEnd).toLocaleDateString('zh-Hant')}</td></tr>
    <tr><th>繳款日期 Payment Date</th><td>${new Date(receipt.paymentDate).toLocaleDateString('zh-Hant')}</td></tr>
    <tr><th>收款金額 Amount Received</th><td>HK$${num(receipt.amountReceived).toFixed(2)}</td></tr>
  </table>

  <div class="total">HK$${num(receipt.amountReceived).toFixed(2)}</div>
</body>
</html>`;
}
