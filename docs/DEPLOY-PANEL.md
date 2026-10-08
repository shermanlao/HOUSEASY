# 版本管理

Admin page: `/rental/admin/deploy`.

One page, two apps:

- **租務易** — git history of `/var/www/houseasy-app` (remote is the VPS bare repo `/var/git/houseasy.git`). **推上** runs `git pull --ff-only`, install, Prisma migrate, build, and `pm2 restart houseasy-rental`. No token prompt.
- **LEVO** — git history of `/var/www/levo` (`git@github.com:shermanlao/LEVO.git`). **推上** pulls `main`, builds frontend and backend, then restarts `levo-web` and `levo-api`.

The server keeps a deploy key at `/root/.ssh/github_levo`. The first time GitHub rejects it, the page shows that public key. Add it once under the LEVO repo Deploy keys. Later pushes do not ask for a token.

Deploy output is appended to `/tmp/deploy-rental.log` and `/tmp/deploy-levo.log`. A second push is refused while that app is still deploying.
