'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export function AddReceiptForm({
  statementId,
  receipt,
}: {
  statementId: string;
  receipt?: { id: string; paymentDate: string; amountReceived: number };
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const editing = Boolean(receipt);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('statementId', statementId);
    if (receipt) formData.set('id', receipt.id);
    const res = await fetch(withBasePath('/api/receipts'), {
      method: editing ? 'PATCH' : 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || (editing ? '更新失敗' : '新增失敗'));
      return;
    }
    if (editing) {
      router.push(`/tenancy/${statementId}/receipts`);
    } else {
      form.reset();
    }
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
        <input name="paymentDate" type="date" required defaultValue={receipt?.paymentDate || ''} />
      </div>
      <div className="form-group">
        <label>收款金額 *</label>
        <input
          name="amountReceived"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={receipt ? String(receipt.amountReceived) : ''}
        />
      </div>
      <button type="submit" className="btn btn-primary">{editing ? '儲存' : '新增收據'}</button>
    </form>
  );
}
