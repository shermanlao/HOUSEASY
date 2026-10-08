import { execFile, execFileSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

export type DeployAppId = 'rental' | 'levo';

type AppSpec = {
  id: DeployAppId;
  name: string;
  dir: string;
  branch: string;
  usesGithubKey: boolean;
};

const APPS: Record<DeployAppId, AppSpec> = {
  rental: {
    id: 'rental',
    name: '租務易 RentalEasy',
    dir: '/var/www/houseasy-app',
    branch: 'main',
    usesGithubKey: false,
  },
  levo: {
    id: 'levo',
    name: 'LEVO',
    dir: '/var/www/levo',
    branch: 'main',
    usesGithubKey: true,
  },
};

const GITHUB_KEY = '/root/.ssh/github_levo';

export type DeployCommit = {
  hash: string;
  short: string;
  author: string;
  date: string;
  subject: string;
  current: boolean;
};

export type DeployAppStatus = {
  id: DeployAppId;
  name: string;
  branch: string;
  available: boolean;
  head: string;
  ahead: number | null;
  behind: number | null;
  dirty: string[];
  fetchError: string | null;
  publicKey: string | null;
  needsGithubKey: boolean;
  deploying: boolean;
  log: string;
  commits: DeployCommit[];
};

function isAppId(value: string): value is DeployAppId {
  return value === 'rental' || value === 'levo';
}

export function parseDeployApp(value: unknown): DeployAppId | null {
  return typeof value === 'string' && isAppId(value) ? value : null;
}

function gitEnv(app: AppSpec): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (app.usesGithubKey && fs.existsSync(GITHUB_KEY)) {
    env.GIT_SSH_COMMAND = `ssh -i ${GITHUB_KEY} -o IdentitiesOnly=yes -o BatchMode=yes`;
  }
  return env;
}

async function git(app: AppSpec, args: string[], timeout = 20000): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', app.dir, ...args], {
    timeout,
    env: gitEnv(app),
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

function ensureGithubKey(): string | null {
  if (process.platform !== 'linux') return null;
  try {
    fs.mkdirSync('/root/.ssh', { recursive: true, mode: 0o700 });
    if (!fs.existsSync(GITHUB_KEY)) {
      execFileSyncKeygen();
    }
    const pub = `${GITHUB_KEY}.pub`;
    return fs.existsSync(pub) ? fs.readFileSync(pub, 'utf8').trim() : null;
  } catch {
    return null;
  }
}

function execFileSyncKeygen() {
  execFileSync(
    'ssh-keygen',
    ['-t', 'ed25519', '-f', GITHUB_KEY, '-N', '', '-C', 'houseasy-vps-levo-deploy'],
    { stdio: 'ignore' }
  );
  fs.chmodSync(GITHUB_KEY, 0o600);
}

function errorText(err: unknown): string {
  if (err && typeof err === 'object' && 'stderr' in err) {
    const stderr = String((err as { stderr?: unknown }).stderr || '').trim();
    if (stderr) return stderr;
  }
  return err instanceof Error ? err.message : '讀取版本失敗';
}

function lockPath(id: DeployAppId) {
  return `/tmp/deploy-${id}.pid`;
}

function logPath(id: DeployAppId) {
  return `/tmp/deploy-${id}.log`;
}

function deploying(id: DeployAppId): boolean {
  const file = lockPath(id);
  if (!fs.existsSync(file)) return false;
  const pid = Number(fs.readFileSync(file, 'utf8').trim());
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLog(id: DeployAppId): string {
  const file = logPath(id);
  if (!fs.existsSync(file)) return '';
  const text = fs.readFileSync(file, 'utf8');
  return text.length > 8000 ? text.slice(-8000) : text;
}

export async function getDeployStatus(): Promise<DeployAppStatus[]> {
  const out: DeployAppStatus[] = [];
  for (const app of Object.values(APPS)) {
    out.push(await readApp(app));
  }
  return out;
}

async function readApp(app: AppSpec): Promise<DeployAppStatus> {
  const base: DeployAppStatus = {
    id: app.id,
    name: app.name,
    branch: app.branch,
    available: false,
    head: '',
    ahead: null,
    behind: null,
    dirty: [],
    fetchError: null,
    publicKey: app.usesGithubKey ? ensureGithubKey() : null,
    needsGithubKey: false,
    deploying: deploying(app.id),
    log: readLog(app.id),
    commits: [],
  };
  if (!fs.existsSync(path.join(app.dir, '.git'))) {
    base.fetchError = '此環境沒有這個程式的 git 目錄';
    return base;
  }
  base.available = true;
  try {
    base.head = await git(app, ['rev-parse', '--short', 'HEAD']);
    const raw = await git(app, [
      'log',
      '-5',
      '--pretty=format:%H%x1f%h%x1f%an%x1f%ad%x1f%s',
      '--date=iso-strict',
    ]);
    base.commits = raw
      ? raw.split('\n').map((line) => {
          const [hash, short, author, date, subject] = line.split('\x1f');
          return {
            hash,
            short,
            author,
            date,
            subject,
            current: short === base.head,
          };
        })
      : [];
    const dirty = await git(app, ['diff', '--name-only']);
    base.dirty = dirty ? dirty.split('\n').filter(Boolean) : [];
  } catch (err) {
    base.fetchError = errorText(err);
    return base;
  }

  try {
    await git(app, ['fetch', 'origin', app.branch], 25000);
    const counts = await git(app, ['rev-list', '--left-right', '--count', `HEAD...origin/${app.branch}`]);
    const [ahead, behind] = counts.split(/\s+/).map((n) => Number(n) || 0);
    base.ahead = ahead;
    base.behind = behind;
  } catch (err) {
    const message = errorText(err);
    const denied = message.includes('Permission denied') || message.includes('publickey');
    base.needsGithubKey = denied;
    base.fetchError = denied
      ? 'GitHub 尚未信任這台伺服器的金鑰。請把下方公鑰加到 LEVO 倉庫的 Deploy keys（只需做一次），之後推上不用再輸入 token。'
      : message;
  }
  return base;
}

export type DeployAction = 'build' | 'up' | 'restart' | 'version';

function scriptFor(app: AppSpec, action: DeployAction, version?: string): string {
  const log = `/tmp/deploy-${app.id}.log`;
  const head = `#!/bin/bash
set -euo pipefail
exec >> ${log} 2>&1
echo "---- $(date -Is) ${action} ${app.name} ----"
`;
  if (app.id === 'rental') {
    if (action === 'restart' || action === 'up') {
      return `${head}
cd /var/www/houseasy-app
pm2 restart houseasy-rental
echo "---- $(date -Is) done ----"
`;
    }
    if (action === 'version') {
      return `${head}
cd /var/www/houseasy-app
git checkout ${version}
npm install
npx prisma migrate deploy
npm run build
pm2 restart houseasy-rental
echo "---- $(date -Is) done ${version} ----"
`;
    }
    return `${head}
cd /var/www/houseasy-app
git checkout main
git pull --ff-only origin main
npm install
npx prisma migrate deploy
npm run build
echo "---- $(date -Is) build done ----"
`;
  }
  const gitSsh = `export GIT_SSH_COMMAND='ssh -i ${GITHUB_KEY} -o IdentitiesOnly=yes -o BatchMode=yes'`;
  if (action === 'restart' || action === 'up') {
    return `${head}
${gitSsh}
systemctl restart levo-web levo-api
echo "---- $(date -Is) done ----"
`;
  }
  if (action === 'version') {
    return `${head}
${gitSsh}
cd /var/www/levo
git checkout ${version}
npm run build:frontend
npm run build:backend
chown -R levo:levo /var/www/levo
systemctl restart levo-web levo-api
echo "---- $(date -Is) done ${version} ----"
`;
  }
  return `${head}
${gitSsh}
cd /var/www/levo
git checkout main
git pull --ff-only origin main
npm run build:frontend
npm run build:backend
chown -R levo:levo /var/www/levo
echo "---- $(date -Is) build done ----"
`;
}

export function startDeploy(id: DeployAppId, action: DeployAction, version?: string): { error?: string } {
  const app = APPS[id];
  if (!fs.existsSync(path.join(app.dir, '.git'))) {
    return { error: '此環境不能部署' };
  }
  if (deploying(id)) {
    return { error: '這個程式正在執行' };
  }
  if (action === 'version') {
    if (!version || !/^[0-9a-f]{7,40}$/i.test(version)) return { error: '版本無效' };
  }
  const script = `/tmp/deploy-${id}.sh`;
  fs.writeFileSync(script, scriptFor(app, action, version), { mode: 0o700 });
  fs.writeFileSync(logPath(id), '');
  const child = spawn('bash', [script], { detached: true, stdio: 'ignore' });
  if (!child.pid) return { error: '無法開始' };
  fs.writeFileSync(lockPath(id), String(child.pid));
  child.unref();
  return {};
}
