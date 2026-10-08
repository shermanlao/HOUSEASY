# 版本管理

Admin page: `/rental/admin/deploy`. Layout matches the LightX PC panel (`http://127.0.0.1:3099/`): a Versions rail on the left, and Build / Put up / Restart / Refresh with a black log in the center.

RentalEasy and LEVO share that page. Switch the app with the buttons above the actions. The server uses its saved git key. The page does not ask for a token.

- **Build** — check out `main`, pull, install, and build. Does not restart.
- **Put up** — restart the running process so the last build goes live.
- **Restart** — restart only, so env changes apply.
- **Put up again** — check out that commit, build, and restart. The running commit has no delete. Git commits are kept.

Logs: `/tmp/deploy-rental.log` and `/tmp/deploy-levo.log`.
