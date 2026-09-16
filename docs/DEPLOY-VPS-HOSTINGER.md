# Deploy houseasy.io on Hostinger VPS

Separate site from levolight.com on the same VPS (`187.7.21.12`).

## Stack

- App path (git working tree): `/var/www/houseasy-app`
- Bare git remote on VPS: `/var/git/houseasy.git`
- Process: PM2 app name `houseasy`, bind `127.0.0.1:3001`
- Database: PostgreSQL database `houseasy` (local to VPS)
- Nginx: `/etc/nginx/sites-available/houseasy.io` → proxy to `:3001`
- Do **not** change levolight.com (`/etc/nginx/sites-available/levo`, port `3000`)

## Environment (server `.env`, not in git)

```env
DATABASE_URL="postgresql://houseasy:PASSWORD@127.0.0.1:5432/houseasy?schema=public"
JWT_SECRET="long-random-string"
PORT=3001
HOSTNAME=127.0.0.1
```

`JWT_SECRET` signs login sessions. Anyone with this value can forge sessions — keep it private and long/random.

## Deploy / update

```bash
# From your PC (with SSH key):
git push houseasy-vps main

# On VPS:
cd /var/www/houseasy-app
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart houseasy
```

## Nginx

HTTP only until confirmed working; then add Certbot for houseasy.io.

Backup before edits:

```bash
cp /etc/nginx/sites-available/houseasy.io /etc/nginx/sites-available/houseasy.io.bak.$(date +%Y%m%d-%H%M%S)
nginx -t && systemctl reload nginx
```

## Verify

```bash
curl -sI -H 'Host: houseasy.io' http://127.0.0.1/
curl -sI -H 'Host: levolight.com' http://127.0.0.1/
```
