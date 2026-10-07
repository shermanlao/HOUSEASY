'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function CreateRoomForm({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('propertyId', propertyId);
    const res = await fetch(withBasePath('/api/rooms'), {
      method: 'POST',
      body: formData,
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
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      {error && (
        <div
          style={{
            padding: '0.5rem',
            marginBottom: '0.5rem',
            background: '#fef2f2',
            color: 'var(--error)',
            borderRadius: '6px',
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
          <label htmlFor="roomName">房間名稱</label>
          <input id="roomName" name="name" type="text" placeholder="例如：(C)房" required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
          <label htmlFor="monthlyRent">月租（港元）</label>
          <input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          新增房間
        </button>
      </div>
    </form>
  );
}
