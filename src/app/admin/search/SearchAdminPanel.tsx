'use client';

import { useCallback, useEffect, useState } from 'react';
import { withBasePath } from '@/lib/base-path';

type SearchStatus = {
  syncing?: boolean;
  counts?: {
    sale: number;
    rent: number;
    h28: number;
    squarefoot: number;
    transactions: number;
    stocks: number;
  };
  sources?: { id: string; nameZh: string; lastSyncAt: string | null }[];
  logs?: {
    id: string;
    sourceId: string;
    status: string;
    message: string | null;
    itemCount: number;
    startedAt: string;
    endedAt: string | null;
  }[];
};

function formatTime(value: string | null | undefined) {
  if (!value) return '從未';
  return new Date(value).toLocaleString('zh-Hant', { hour12: false });
}

export function SearchAdminPanel() {
  const [status, setStatus] = useState<SearchStatus | null>(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch(withBasePath('/api/admin/search/status'));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || '讀取失敗');
      setStatus(null);
      return;
    }
    setStatus(data);
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

  async function runSync(source: string) {
    setError('');
    setWarning('');
    setSyncingSource(source);
    try {
      const res = await fetch(withBasePath('/api/admin/search/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '同步失敗');
        return;
      }
      if (Array.isArray(data.warnings) && data.warnings.length) {
        setWarning(data.warnings.join(' '));
      }
      await load();
    } finally {
      setSyncingSource(null);
    }
  }

  const busy = loading || Boolean(syncingSource) || Boolean(status?.syncing);
  const counts = status?.counts;

  return (
    <>
      {error && (
        <div
          style={{
            padding: '0.5rem',
            marginBottom: '1rem',
            background: '#fef2f2',
            color: 'var(--error)',
            borderRadius: '6px',
          }}
        >
          {error}
        </div>
      )}
      {warning && (
        <div
          style={{
            padding: '0.5rem',
            marginBottom: '1rem',
            background: '#fffbeb',
            color: '#92400e',
            borderRadius: '6px',
          }}
        >
          {warning}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>樓盤資料</h2>
        {loading && !status ? (
          <p style={{ color: 'var(--muted)' }}>載入中…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>售盤</th>
                <th>租盤</th>
                <th>28Hse</th>
                <th>Squarefoot</th>
                <th>成交</th>
                <th>庫存</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{counts?.sale ?? '-'}</td>
                <td>{counts?.rent ?? '-'}</td>
                <td>{counts?.h28 ?? '-'}</td>
                <td>{counts?.squarefoot ?? '-'}</td>
                <td>{counts?.transactions ?? '-'}</td>
                <td>{counts?.stocks ?? '-'}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>資料來源</h2>
        {status?.sources?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>來源</th>
                <th>上次同步</th>
              </tr>
            </thead>
            <tbody>
              {status.sources.map((s) => (
                <tr key={s.id}>
                  <td>{s.nameZh}</td>
                  <td>{formatTime(s.lastSyncAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--muted)' }}>尚無來源資料</p>
        )}
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '1rem 0' }}>
          同步可能需數分鐘。進行中時請勿關閉此頁。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runSync('h28')}>
            {syncingSource === 'h28' ? '同步中…' : '同步 28Hse'}
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runSync('squarefoot')}>
            {syncingSource === 'squarefoot' ? '同步中…' : '同步 Squarefoot'}
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runSync('centanet')}>
            {syncingSource === 'centanet' ? '同步中…' : '同步中原 Open Data'}
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => runSync('all')}>
            {syncingSource === 'all' ? '同步中…' : '立即全部同步'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>最近同步紀錄</h2>
        {status?.logs?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>來源</th>
                <th>狀態</th>
                <th>筆數</th>
                <th>開始</th>
                <th>結束</th>
                <th>訊息</th>
              </tr>
            </thead>
            <tbody>
              {status.logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.sourceId}</td>
                  <td>{l.status}</td>
                  <td>{l.itemCount}</td>
                  <td>{formatTime(l.startedAt)}</td>
                  <td>{formatTime(l.endedAt)}</td>
                  <td>{l.message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--muted)' }}>尚無同步紀錄</p>
        )}
      </div>
    </>
  );
}
