# 租單／收據列印與 PDF

Paths:

- `/rental/statements/[id]/print` — 租單
- `/rental/receipts/[id]/print` — 收據

The page is a standalone HTML document (new tab). A top toolbar (hidden when printing) has:

- **列印** — browser print dialog
- **下載 PDF** — saves an A4 PDF of the same document (`html2pdf.js`)

Filenames: `租單-{租客}-{期初}.pdf` / `收據-{租客}-{繳款日}.pdf`.
