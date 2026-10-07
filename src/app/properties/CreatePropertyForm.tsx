'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function CreatePropertyForm({
  property,
}: {
  property?: { id: string; name: string; addressChinese: string; addressEnglish: string };
} = {}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const editing = Boolean(property);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (property) formData.set('id', property.id);
    const res = await fetch(withBasePath('/api/properties'), {
      method: editing ? 'PATCH' : 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || (editing ? '更新失敗' : '新增失敗'));
      return;
    }
    router.push(`/properties/${data.id || property?.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
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
        <label htmlFor="name">物業名稱</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="例如：金勳大樓15樓07室"
          defaultValue={property?.name || ''}
        />
      </div>
      <div className="form-group">
        <label htmlFor="addressChinese">地址（中文）</label>
        <input
          id="addressChinese"
          name="addressChinese"
          type="text"
          required
          defaultValue={property?.addressChinese || ''}
        />
      </div>
      <div className="form-group">
        <label htmlFor="addressEnglish">地址（英文）</label>
        <input
          id="addressEnglish"
          name="addressEnglish"
          type="text"
          required
          defaultValue={property?.addressEnglish || ''}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {editing ? '儲存' : '新增物業'}
      </button>
    </form>
  );
}
