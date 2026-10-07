function escapeJs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

/** Toolbar + PDF download on standalone print HTML (hidden when printing). */
export function withPrintChrome(html: string, filename: string): string {
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
  const chrome = `
<style>
  .print-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem 1rem;
    margin: -24px -24px 24px;
    background: #fafafa;
    border-bottom: 1px solid #e5e7eb;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif;
  }
  .print-toolbar .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }
  .print-toolbar .btn-primary { background: #2563eb; color: #fff; }
  .print-toolbar .btn-primary:hover { background: #1d4ed8; }
  .print-toolbar .btn-secondary { background: #e5e7eb; color: #1a1a1a; }
  .print-toolbar .btn-secondary:hover { background: #d1d5db; }
  .print-toolbar .btn:disabled { opacity: 0.55; cursor: not-allowed; }
  @media print {
    .print-toolbar { display: none !important; }
    body { padding: 0; max-width: none; }
  }
</style>
`;

  const toolbar = `
<div class="print-toolbar">
  <button type="button" class="btn btn-primary" onclick="window.print()">列印</button>
  <button type="button" class="btn btn-secondary" id="download-pdf">下載 PDF</button>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"></script>
<script>
(function () {
  var btn = document.getElementById('download-pdf');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }
    var toolbar = document.querySelector('.print-toolbar');
    btn.disabled = true;
    btn.textContent = '產生中…';
    if (toolbar) toolbar.style.display = 'none';
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: '${escapeJs(safeName)}',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(document.body)
      .save()
      .then(function () {
        if (toolbar) toolbar.style.display = '';
        btn.disabled = false;
        btn.textContent = '下載 PDF';
      })
      .catch(function () {
        if (toolbar) toolbar.style.display = '';
        btn.disabled = false;
        btn.textContent = '下載 PDF';
        window.print();
      });
  });
})();
</script>
`;

  let out = html.replace('</head>', `${chrome}</head>`);
  if (out.includes('<body>')) {
    out = out.replace('<body>', `<body>${toolbar}`);
  } else {
    out = out.replace(/<body[^>]*>/, (open) => `${open}${toolbar}`);
  }
  return out;
}

export function statementPdfFilename(periodStart: Date, tenantName: string): string {
  const day = new Date(periodStart).toISOString().slice(0, 10);
  const name = tenantName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'tenant';
  return `租單-${name}-${day}.pdf`;
}

export function receiptPdfFilename(paymentDate: Date, tenantName: string): string {
  const day = new Date(paymentDate).toISOString().slice(0, 10);
  const name = tenantName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'tenant';
  return `收據-${name}-${day}.pdf`;
}
