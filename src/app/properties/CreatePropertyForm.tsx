'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreatePropertyForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch('/api/properties', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '新增失敗');
      return;
    }
    form.reset();
    router.push(`/properties/${data.id}`);
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
        <input id="name" name="name" type="text" placeholder="例如：金勳大樓15樓07室" />
      </div>
      <div className="form-group">
        <label htmlFor="addressChinese">地址（中文）</label>
        <input id="addressChinese" name="addressChinese" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="addressEnglish">地址（英文）</label>
        <input id="addressEnglish" name="addressEnglish" type="text" required />
      </div>
      <div className="form-group">
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
        新增物業
      </button>
    </form>
  );
}
