# 版本管理

Admin page: `/rental/admin/deploy`. Layout matches the LightX PC panel (`http://127.0.0.1:3099/`): a Versions rail on the left, and Put up / Restart / Refresh with a black log in the center.

This page is only for RentalEasy on the VPS. LEVO stays separate. The server uses its saved git key. The page does not ask for a token.

- **Put up** — check out `main`, pull, install including TypeScript, build, and restart. Install keeps dev packages because the button runs on the production process; otherwise Next cannot resolve `@/` and will rewrite `package.json`.
- **Restart** — restart only, so env changes apply.
- **Put up again** — check out that commit, build, and restart. The running commit has no delete. Git commits are kept.

Log: `/tmp/deploy-rental.log`.
