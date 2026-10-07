# Admin user management

Page: `/rental/admin/users` (admin only).

- **新增業主** — create OWNER via `POST /api/admin/users`
- **用戶列表** — click a row to open an edit dialog; save via `PATCH /api/admin/users`
- **刪除** — button on each row; `DELETE /api/admin/users`. The signed-in account and the last remaining admin cannot be deleted. Property-owner links for that user are removed with the account.

Editable fields: email, name, role (`ADMIN` | `OWNER`), optional new password (leave blank to keep).
