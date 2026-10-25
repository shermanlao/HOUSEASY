# Admin user management

Owner page: `/rental/account` (owner only). The nav shows **用戶管理** after an owner logs in. The list contains only that owner. **編輯** opens `/rental/account/edit` (email, name, optional new password). Role stays 業主. Owners cannot create or delete users. Save goes through `PATCH /api/account` and refreshes the session cookie.

Admin page: `/rental/admin/users` (admin only).

- **新增業主** — create OWNER via `POST /api/admin/users`
- **用戶列表** — click a row to open an edit dialog; save via `PATCH /api/admin/users`
- **刪除** — button on each row; `DELETE /api/admin/users`. The signed-in account and the last remaining admin cannot be deleted. Property-owner links for that user are removed with the account.

Editable fields: email, name, role (`ADMIN` | `OWNER`), optional new password (leave blank to keep), and **簽署**.

## 簽署

The list **簽署** column shows `已設定` or `—` (the PNG bytes are not loaded in the list).

In the edit dialog:

- **上傳圖片** — PNG / JPEG / WebP, converted to PNG
- **上傳 PDF** — browser renders page 1 only (`pdfjs-dist` from CDN); the PDF file is not stored
- **畫板** — draw on screen; **重畫** clears the pad
- **清除簽署** — removes the stored signature

Save sends optional `signaturePng` (base64 PNG) or `clearSignature: true`. Preview uses `GET /api/admin/users?id=` (`image/png`). Max size about 1.5MB. Stored as `User.signaturePng`. Owner signatures print on that owner's property 租單 PDFs.
