'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Property = {
  id: string;
  monthlyRent: { toString: () => string };
  tenants: { id: string; nameChinese: string; nameEnglish: string }[];
};

export function CreateStatementForm({ property }: { property: Property }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [billings, setBillings] = useState([
    { title: '電費', qty: 0, unitRate: 1.8, lastReading: 0, thisReading: 0, issueDate: '' },
    { title: '水費', qty: 0, unitRate: 16, lastReading: 0, thisReading: 0, issueDate: '' },
  ]);
  const [renting, setRenting] = useState({
    lastPaymentDate: '',
    openingBalance: 0,
    paymentReceived: 0,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const tenantId = (form.querySelector('[name="tenantId"]') as HTMLSelectElement)?.value;
    const periodStart = (form.querySelector('[name="periodStart"]') as HTMLInputElement)?.value;
    const periodEnd = (form.querySelector('[name="periodEnd"]') as HTMLInputElement)?.value;

    if (!tenantId || !periodStart || !periodEnd) {
      setError('請填寫所有必填欄位');
      return;
    }

    const billingsData = billings.map((b, i) => {
      const qty = b.thisReading - b.lastReading;
      return {
        issueDate: b.issueDate || periodEnd,
        title: b.title,
        qty: qty >= 0 ? qty : 0,
        unitRate: b.unitRate,
        lastReading: b.lastReading,
        thisReading: b.thisReading,
        placement: i + 1,
      };
    });

    const res = await fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: property.id,
        tenantId,
        periodStart,
        periodEnd,
        billings: billingsData,
        rentings: renting.lastPaymentDate
          ? [{ ...renting, lastPaymentDate: renting.lastPaymentDate, placement: 1 }]
          : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '新增失敗');
      return;
    }
    router.push(`/properties/${property.id}/statements`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      <div className="form-group">
        <label>租客 *</label>
        <select name="tenantId" required>
          <option value="">請選擇</option>
          {property.tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameChinese} {t.nameEnglish}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>開始日期 *</label>
          <input name="periodStart" type="date" required />
        </div>
        <div className="form-group">
          <label>結束日期 *</label>
          <input name="periodEnd" type="date" required />
        </div>
      </div>

      <h3 style={{ margin: '1.5rem 0 0.5rem' }}>收費項目</h3>
      {billings.map((b, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>項目</label>
            <input
              value={b.title}
              onChange={(e) => {
                const next = [...billings];
                next[i].title = e.target.value;
                setBillings(next);
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>上月度數</label>
            <input
              type="number"
              step="0.01"
              value={b.lastReading || ''}
              onChange={(e) => {
                const next = [...billings];
                next[i].lastReading = parseFloat(e.target.value) || 0;
                setBillings(next);
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>今月度數</label>
            <input
              type="number"
              step="0.01"
              value={b.thisReading || ''}
              onChange={(e) => {
                const next = [...billings];
                next[i].thisReading = parseFloat(e.target.value) || 0;
                setBillings(next);
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>單價</label>
            <input
              type="number"
              step="0.01"
              value={b.unitRate || ''}
              onChange={(e) => {
                const next = [...billings];
                next[i].unitRate = parseFloat(e.target.value) || 0;
                setBillings(next);
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>日期</label>
            <input
              type="date"
              value={b.issueDate}
              onChange={(e) => {
                const next = [...billings];
                next[i].issueDate = e.target.value;
                setBillings(next);
              }}
            />
          </div>
        </div>
      ))}

      <h3 style={{ margin: '1rem 0 0.5rem' }}>上次繳款（選填）</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="form-group">
          <label>繳款日期</label>
          <input
            type="date"
            value={renting.lastPaymentDate}
            onChange={(e) => setRenting({ ...renting, lastPaymentDate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>應繳金額</label>
          <input
            type="number"
            step="0.01"
            value={renting.openingBalance || ''}
            onChange={(e) => setRenting({ ...renting, openingBalance: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label>實收金額</label>
          <input
            type="number"
            step="0.01"
            value={renting.paymentReceived || ''}
            onChange={(e) => setRenting({ ...renting, paymentReceived: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        新增租單
      </button>
    </form>
  );
}
