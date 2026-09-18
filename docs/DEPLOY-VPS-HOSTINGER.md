# Deploy houseasy.io on Hostinger VPS (dual app)

Separate site from levolight.com on the same VPS (`187.7.21.12`).

## Architecture

| Path / URL | App | Process | Port |
|------------|-----|---------|------|
| `/`, `/listings`, `/market-data`, … | PropertySearching | PM2 `houseasy-search` | `127.0.0.1:3001` |
| `/rental`, `/rental/login`, … | RentalEasy (`basePath: /rental`) | PM2 `houseasy-rental` | `127.0.0.1:3002` |

- Search app path: `/var/www/houseasy-search`
- Rental app path: `/var/www/houseasy-app`
- Bare git (rental): `/var/git/houseasy.git`
- Bare git (search): `/var/git/houseasy-search.git`
- Do **not** change levolight.com (`/etc/nginx/sites-available/levo`, port `3000`)

## Environment

### RentalEasy (`/var/www/houseasy-app/.env`)

```env
DATABASE_URL="postgresql://houseasy:PASSWORD@127.0.0.1:5432/houseasy?schema=public"
JWT_SECRET="long-random-string"
COOKIE_SECURE="true"
PORT=3002
HOSTNAME=127.0.0.1
NODE_ENV=production
```

`COOKIE_SECURE` must be `true` with HTTPS enabled so login session cookies are accepted by the browser.

### PropertySearching (`/var/www/houseasy-search/.env`)

```env
DATABASE_URL="file:./prod.db"
PORT=3001
HOSTNAME=127.0.0.1
NODE_ENV=production
```

## Nginx (HTTPS)

HTTP (80) redirects to HTTPS; ACME challenges remain at `/.well-known/acme-challenge/`.  
Certificate: Let's Encrypt (`/etc/letsencrypt/live/houseasy.io/`), auto-renew via Certbot.

On the **443** server block, `/rental` must be declared before `/`:

```nginx
location /rental { proxy_pass http://127.0.0.1:3002; ... }
location / { proxy_pass http://127.0.0.1:3001; ... }
```

Backup before edits:

```bash
cp /etc/nginx/sites-available/houseasy.io /etc/nginx/sites-available/houseasy.io.bak.$(date +%Y%m%d-%H%M%S)
nginx -t && systemctl reload nginx
```

## Deploy / update RentalEasy

```powershell
$env:GIT_SSH_COMMAND = 'ssh -i "C:/Users/user/.ssh/id_ed25519_levo" -o BatchMode=yes'
git -c safe.directory=* push houseasy-vps main
```

On VPS:

```bash
cd /var/www/houseasy-app
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart houseasy-rental
```

## Deploy / update PropertySearching

```powershell
$env:GIT_SSH_COMMAND = 'ssh -i "C:/Users/user/.ssh/id_ed25519_levo" -o BatchMode=yes'
git push houseasy-search-vps main
```

On VPS:

```bash
cd /var/www/houseasy-search
git pull
npm install
npx prisma db push
npm run build
pm2 restart houseasy-search
```

## Verify

```bash
curl -sI https://houseasy.io/
curl -sI https://houseasy.io/rental/login
curl -sI http://houseasy.io/   # expect 301 → https
curl -sI -H 'Host: levolight.com' http://127.0.0.1/
```
