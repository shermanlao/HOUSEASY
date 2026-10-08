# 租單／收據列印與 PDF

Paths:

- `/rental/statements/[id]/print` — 租單
- `/rental/receipts/[id]/print` — 收據

The page is a standalone HTML document (new tab). The tab uses the same house icon as the app (`/rental/favicon.ico`). A top toolbar (hidden when printing) has:

- **列印** — browser print dialog
- **下載 PDF** — saves an A4 PDF of the same document (`html2pdf.js`)

Filenames: `租單-{租客}-{期初}.pdf` / `收據-{租客}-{繳款日}.pdf`.

租單上的收費項目逐項列出。度數項目印上月／今月度數與用量；數量項目印 QTY、日期與小計。沒有收費項目時略過該段。
