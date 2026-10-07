'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function AddTenantForm({
  roomId,
}: {
  roomId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('roomId', roomId);
    const res = await fetch(withBasePath('/api/tenants'), {
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
        <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
          <label>姓名（中文）</label>
          <input name="nameChinese" type="text" required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
          <label>姓名（英文）</label>
          <input name="nameEnglish" type="text" required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '100px' }}>
          <label>電話</label>
          <input name="phone" type="text" required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
          <label>護照/身份證</label>
          <input name="passportOrHkid" type="text" />
        </div>
        <button type="submit" className="btn btn-primary">
          新增租客
        </button>
      </div>
    </form>
  );
}
