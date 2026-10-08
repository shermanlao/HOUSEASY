---
name: push-vps
description: Commit current RentalEasy work, push main to the houseasy VPS, then build and restart the rental app. Use only when the user invokes /push-vps.
disable-model-invocation: true
---

# Push to Git and VPS

Deploy RentalEasy only. Do not change levolight.com or restart `houseasy-search`.

## Git

Work in this repo. UNC ownership requires `git -c safe.directory=*` on every git command. Do not change git config. Do not force-push. Do not skip hooks.

1. `git status`, `git diff`, and `git log -8 --oneline`.
2. Commit the pending work that belongs in this deploy. Leave out secrets (`.env`, credentials). One commit per concern when the diff mixes unrelated features.
3. Commit messages match recent history: one short sentence on why. On PowerShell, pass the message with a here-string, not a bash heredoc.
4. Push:

```powershell
$env:GIT_SSH_COMMAND = 'ssh -i "C:/Users/user/.ssh/id_ed25519_levo" -o BatchMode=yes'
git -c safe.directory=* push houseasy-vps main
```

If there is nothing to commit, still push when the branch is ahead. If it is already up to date, say so and do not rebuild unless the user asked to redeploy anyway.

## VPS

```powershell
ssh -i "C:/Users/user/.ssh/id_ed25519_levo" -o BatchMode=yes root@187.7.21.12 "cd /var/www/houseasy-app && git pull && npm install && npx prisma migrate deploy && npm run build && pm2 restart houseasy-rental && pm2 status houseasy-rental"
```

Allow several minutes for the build. If the build fails, fix the cause, commit, push, and run the VPS step again. Do not restart PM2 on a failed build.

## Check

`curl.exe -sI https://houseasy.io/rental/login` should be `200`. An edit or account URL without a session cookie may return 500 with `UNAUTHORIZED`; that is the existing login gate, not a failed deploy.

Tell the user the commit range, that `houseasy-rental` is online, and that the search app was left running.
