'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function TenantActiveButton({ tenantId, active }: { tenantId: string; active: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    setError('');
    const formData = new FormData();
    formData.set('intent', 'active');
    formData.set('id', tenantId);
    formData.set('isActive', active ? 'false' : 'true');
    const res = await fetch(withBasePath('/api/tenants'), { method: 'PATCH', body: formData });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || '更新失敗');
      return;
    }
    router.refresh();
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ padding: '0.25rem 0.6rem' }}
        disabled={pending}
        onClick={toggle}
      >
        {active ? '遷出' : '遷入'}
      </button>
      {error && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</span>}
    </span>
  );
}
