'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function AddUserForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch(withBasePath('/api/admin/users'), {
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
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
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
      <div className="form-group">
        <label htmlFor="email">電郵</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="form-group">
        <label htmlFor="name">姓名</label>
        <input id="name" name="name" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="password">密碼</label>
        <input id="password" name="password" type="password" required minLength={6} />
      </div>
      <button type="submit" className="btn btn-primary">
        新增業主
      </button>
    </form>
  );
}
