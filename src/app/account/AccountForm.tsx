'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function AccountForm({
  user,
}: {
  user: { email: string; name: string };
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = (formData.get('password') as string) || '';
    const res = await fetch(withBasePath('/api/account'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        name: formData.get('name'),
        password: password || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || '更新失敗');
      return;
    }
    router.push('/account');
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
        <input id="email" name="email" type="email" required defaultValue={user.email} />
      </div>
      <div className="form-group">
        <label htmlFor="name">姓名</label>
        <input id="name" name="name" type="text" required defaultValue={user.name} />
      </div>
      <div className="form-group">
        <label htmlFor="role">角色</label>
        <input id="role" value="業主" readOnly />
      </div>
      <div className="form-group">
        <label htmlFor="password">新密碼（留空則不更改）</label>
        <input id="password" name="password" type="password" minLength={6} autoComplete="new-password" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? '儲存中…' : '儲存'}
      </button>
    </form>
  );
}
