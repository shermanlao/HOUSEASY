'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddReceiptForm({ statementId }: { statementId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('statementId', statementId);
    const res = await fetch('/api/receipts', {
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
        <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      <div className="form-group">
        <label>繳款日期 *</label>
        <input name="paymentDate" type="date" required />
      </div>
      <div className="form-group">
        <label>收款金額 *</label>
        <input name="amountReceived" type="number" step="0.01" min="0" required />
      </div>
      <button type="submit" className="btn btn-primary">新增收據</button>
    </form>
  );
}
