# 租單／收據列印與 PDF

Paths:

- `/rental/tenancy/[id]/print` — 租單
- `/rental/receipts/[id]/print` — 收據

The page is a standalone HTML document (new tab). The tab uses the same house icon as the app (`/rental/favicon.ico`). A top toolbar (hidden when printing) has:

- **列印** — browser print dialog
- **下載 PDF** — saves an A4 PDF of the same document (`html2pdf.js`)

Filenames: `租單-{租客}-{期初}.pdf` / `收據-{租客}-{繳款日}.pdf`.

租單上的收費項目逐項列出。度數項目印上月／今月度數與用量；數量項目印 QTY、日期與小計。沒有收費項目時略過該段。

If the property has owners with a stored signature (`User.signaturePng`), a **業主簽署 / Landlord signature** block is printed after the total note. Each such owner’s PNG (~80px tall) and name is included as a data-URL image so **下載 PDF** captures it. Owners without a signature are omitted; receipts are unchanged. Set signatures on `/rental/admin/users`.
