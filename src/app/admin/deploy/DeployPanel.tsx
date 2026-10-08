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
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState<string | null>(null);

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

  const busy = apps.some((app) => app.deploying) || pushing !== null;

  useEffect(() => {
    if (!apps.some((app) => app.deploying)) return;
    const timer = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(timer);
  }, [apps, load]);

  async function push(app: DeployAppStatus) {
    const ok = window.confirm(`確定推上「${app.name}」的最新版本？部署期間網站會短暫重啟。`);
    if (!ok) return;
    setPushing(app.id);
    setError('');
    const res = await fetch(withBasePath('/api/admin/deploy'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: app.id }),
    });
    const data = await res.json().catch(() => ({}));
    setPushing(null);
    if (!res.ok) {
      setError(data.error || '推上失敗');
      return;
    }
    await load();
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>讀取版本…</p>;

  return (
    <div>
      {error && (
        <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        {apps.map((app) => (
          <section key={app.id} className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{app.name}</h2>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!app.available || busy}
                onClick={() => void push(app)}
              >
                {app.deploying || pushing === app.id ? '推上中…' : '推上'}
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.5rem 0 0.75rem' }}>
              分支 {app.branch}
              {app.head ? ` · 運行中 ${app.head}` : ''}
              {app.behind ? ` · 遠端還有 ${app.behind} 個新版本` : ''}
              {app.ahead ? ` · 本地多 ${app.ahead} 個版本` : ''}
              {app.behind === 0 && app.ahead === 0 ? ' · 已是最新' : ''}
            </p>
            {app.dirty.length > 0 && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                有未提交修改：{app.dirty.join('、')}。推上若不能快進會停下來。
              </p>
            )}
            {app.fetchError && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {app.fetchError}
              </p>
            )}
            {app.needsGithubKey && app.publicKey && (
              <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                {app.publicKey}
              </pre>
            )}
            <table className="table">
              <thead>
                <tr>
                  <th>版本</th>
                  <th>說明</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                {app.commits.map((commit) => (
                  <tr key={commit.hash}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {commit.short}
                      {commit.current ? ' 運行中' : ''}
                    </td>
                    <td>{commit.subject}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatWhen(commit.date)}</td>
                  </tr>
                ))}
                {app.commits.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--muted)' }}>沒有版本紀錄</td>
                  </tr>
                )}
              </tbody>
            </table>
            {app.log && (
              <pre style={{ marginTop: '0.75rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: '220px', overflow: 'auto', background: '#f9fafb', padding: '0.5rem', borderRadius: '6px' }}>
                {app.log}
              </pre>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
