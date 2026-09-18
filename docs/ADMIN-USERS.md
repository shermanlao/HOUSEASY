# Admin user management

Page: `/rental/admin/users` (admin only).

- **新增業主** — create OWNER via `POST /api/admin/users`
- **用戶列表** — click a row to open an edit dialog; save via `PATCH /api/admin/users`

Editable fields: email, name, role (`ADMIN` | `OWNER`), optional new password (leave blank to keep).
