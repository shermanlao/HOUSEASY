'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function DeleteTenantButton({ tenantId, name }: { tenantId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function remove() {
    setError('');
    const ok = window.confirm(`確定刪除租客 ${name}？此操作無法復原，相關租單也會一併刪除。`);
    if (!ok) return;
    setPending(true);
    const res = await fetch(withBasePath('/api/tenants'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenantId }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || '刪除失敗');
      return;
    }
    router.refresh();
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        type="button"
        className="btn btn-danger"
        style={{ padding: '0.25rem 0.6rem' }}
        disabled={pending}
        onClick={remove}
      >
        {pending ? '刪除中…' : '刪除'}
      </button>
      {error && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</span>}
    </span>
  );
}
