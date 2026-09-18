'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function AddOwnerForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value;
    if (!email) return;
    const res = await fetch(withBasePath('/api/properties/owners'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '新增失敗');
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>新增業主到此物業</h3>
      {error && (
        <div style={{ padding: '0.5rem', marginBottom: '0.5rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>業主電郵</label>
          <input name="email" type="email" required placeholder="owner@example.com" />
        </div>
        <button type="submit" className="btn btn-primary">新增業主</button>
      </div>
    </form>
  );
}
