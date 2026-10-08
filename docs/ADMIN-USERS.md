# Admin user management

Owner page: `/rental/account` (owner only). The nav shows **用戶管理** after an owner logs in. The list contains only that owner. **編輯** opens `/rental/account/edit` (email, name, optional new password). Role stays 業主. Owners cannot create or delete users. Save goes through `PATCH /api/account` and refreshes the session cookie.

Admin page: `/rental/admin/users` (admin only).

- **新增業主** — create OWNER via `POST /api/admin/users`
- **用戶列表** — click a row to open an edit dialog; save via `PATCH /api/admin/users`
- **刪除** — button on each row; `DELETE /api/admin/users`. The signed-in account and the last remaining admin cannot be deleted. Property-owner links for that user are removed with the account.

Editable fields: email, name, role (`ADMIN` | `OWNER`), optional new password (leave blank to keep).
