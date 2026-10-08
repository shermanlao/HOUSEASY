'use client';

import { useCallback, useEffect, useState } from 'react';
import { withBasePath } from '@/lib/base-path';
import type { DeployAppStatus } from '@/lib/deploy-apps';

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-Hant', { hour12: false });
}

export function DeployPanel() {
  const [apps, setApps] = useState<DeployAppStatus[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Idle. Click Put up to start.');
  const [ok, setOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(withBasePath('/api/admin/deploy'));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || '讀取失敗');
      return;
    }
    setError('');
    setApps(data.apps || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const app = apps[0];
  const busy = Boolean(app?.deploying);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => {
      void load();
    }, 1000);
    return () => clearInterval(timer);
  }, [busy, load]);

  useEffect(() => {
    if (!app) return;
    if (app.deploying) {
      setOk(true);
      setMessage(`${app.name} running…`);
      return;
    }
    if (app.log.includes('done')) {
      setOk(true);
      const version = app.log.match(/done ([0-9a-f]+)/i);
      setMessage(version ? `Done: ${version[1]}` : 'Done.');
    }
  }, [app]);

  async function run(action: 'up' | 'restart' | 'version', version?: string) {
    if (!app) return;
    setError('');
    setOk(true);
    setMessage(`${action} started…`);
    const res = await fetch(withBasePath('/api/admin/deploy'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: app.id, action, version }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOk(false);
      setMessage(data.error || '失敗');
      return;
    }
    await load();
  }

  if (loading) return <p>讀取版本…</p>;
  if (!app) return <p className="err">{error || '沒有程式'}</p>;

  return (
    <div className="vps-panel">
      <style>{`
        .vps-panel { display: flex; flex-direction: column; min-height: calc(100vh - 8rem); }
        .vps-panel .intro { flex-shrink: 0; }
        .vps-panel h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
        .vps-panel .layout {
          flex: 1; min-height: 0; display: grid; gap: 1rem; align-items: stretch;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .vps-panel .layout { grid-template-columns: minmax(2.5rem, auto) minmax(0, 1fr); }
          .vps-panel .layout.open { grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr); }
        }
        .vps-panel .panel {
          background: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 1rem;
          min-width: 0; min-height: 0; box-sizing: border-box;
        }
        .vps-panel .panel-main { display: flex; flex-direction: column; min-height: 28rem; height: 100%; }
        .vps-panel .rail { display: flex; flex-direction: column; gap: 0.75rem; overflow: auto; }
        .vps-panel .rail.collapsed .rail-body { display: none; }
        .vps-panel .rail-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .vps-panel .row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 0.75rem; }
        .vps-panel button {
          font-size: 0.875rem; padding: 0.5rem 0.75rem; border-radius: 0.375rem;
          border: 1px solid #d1d5db; background: #fff; cursor: pointer;
        }
        .vps-panel button.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
        .vps-panel button.danger { color: #b91c1c; }
        .vps-panel button:disabled { opacity: 0.5; cursor: not-allowed; }
        .vps-panel .bar { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin: 0 0 0.75rem; }
        .vps-panel .bar-run { display: none; height: 100%; width: 40%; background: #2563eb; animation: vps-slide 1.2s linear infinite; }
        .vps-panel .bar.on .bar-run { display: block; }
        @keyframes vps-slide { from { transform: translateX(-100%); } to { transform: translateX(280%); } }
        .vps-panel pre.log {
          flex: 1; min-height: 16rem; background: #111; color: #e5e7eb; padding: 0.75rem;
          overflow: auto; font-size: 0.75rem; white-space: pre-wrap; margin: 0;
        }
        .vps-panel .card { border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem; margin-bottom: 0.5rem; }
        .vps-panel .live { font-weight: 600; }
        .vps-panel .err { color: #b91c1c; }
        .vps-panel .ok { color: #047857; }
        .vps-panel p { font-size: 0.875rem; }
      `}</style>

      <div className="intro">
        <h1>VPS app versions</h1>
        <p>
          This page deploys RentalEasy on the server. It uses the saved git key, so Put up does not ask for a token.
          Newest 5 commits are listed. The running commit is never removed.
        </p>
      </div>

      <div className={`layout${versionsOpen ? ' open' : ''}`}>
        <div
          className={`panel rail${versionsOpen ? '' : ' collapsed'}`}
          onClick={() => {
            if (!versionsOpen) setVersionsOpen(true);
          }}
          role={versionsOpen ? undefined : 'button'}
        >
          <div className="rail-head">
            {versionsOpen ? <h2 style={{ margin: 0 }}>Versions</h2> : <strong>Versions</strong>}
            {versionsOpen && (
              <button type="button" onClick={() => setVersionsOpen(false)} title="Collapse Versions">
                «
              </button>
            )}
          </div>
          {versionsOpen && (
            <div className="rail-body">
              <p>Newest 5 kept. The running commit is never deleted.</p>
              {app.commits.length === 0 && <p>No commits yet.</p>}
              {app.commits.map((commit) => (
                <div className="card" key={commit.hash}>
                  <div className={commit.current ? 'live' : ''}>
                    {commit.short}
                    {commit.current ? ' (running)' : ''}
                  </div>
                  <div>{formatWhen(commit.date)}</div>
                  <div>{commit.subject}</div>
                  <div className="row">
                    <button
                      type="button"
                      disabled={busy || commit.current}
                      onClick={() => void run('version', commit.hash)}
                    >
                      Put up again
                    </button>
                    <button type="button" className="danger" disabled title="Git commits are kept">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel panel-main">
          <div className="row">
            <button type="button" className="primary" disabled={busy || !app.available} onClick={() => void run('up')}>
              {busy ? 'Working…' : 'Put up'}
            </button>
            <button type="button" disabled={busy || !app.available} onClick={() => void run('restart')}>
              Restart
            </button>
            <button type="button" disabled={busy} onClick={() => void load()}>
              Refresh list
            </button>
          </div>
          <p className={ok && !error ? 'ok' : 'err'}>{error || message}</p>
          {app.fetchError && <p className="err">{app.fetchError}</p>}
          <div className={`bar${busy ? ' on' : ''}`}><div className="bar-run" /></div>
          <pre className="log">{app.log || 'Waiting for a job…'}</pre>
        </div>
      </div>
    </div>
  );
}
