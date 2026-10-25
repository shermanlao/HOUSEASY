'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';
import { inferChargeMode, type ChargeMode } from '@/lib/billing';
import { formatMonthlyRent } from '@/lib/rent';

type RoomOption = {
  id: string;
  name: string;
  propertyId: string;
  propertyName?: string;
  monthlyRent: number | null;
  tenants: { id: string; nameChinese: string; nameEnglish: string; isActive?: boolean }[];
};

type BillingInput = {
  title: string;
  qty: number;
  unitRate: number;
  lastReading: number;
  thisReading: number;
  issueDate: string;
};

type BillingRow = BillingInput & {
  key: string;
  mode: ChargeMode;
};

function rowKey() {
  return crypto.randomUUID();
}

function toBillingRow(b: BillingInput, mode?: ChargeMode): BillingRow {
  return {
    key: rowKey(),
    mode: mode ?? inferChargeMode(b.lastReading, b.thisReading, b.qty),
    title: b.title,
    qty: b.qty,
    unitRate: b.unitRate,
    lastReading: b.lastReading,
    thisReading: b.thisReading,
    issueDate: b.issueDate,
  };
}

export function CreateStatementForm({
  rooms,
  defaultRoomId,
  returnTo,
  statement,
}: {
  rooms: RoomOption[];
  defaultRoomId?: string;
  returnTo?: string;
  statement?: {
    id: string;
    roomId: string;
    tenantId: string;
    periodStart: string;
    periodEnd: string;
    billings: BillingInput[];
    renting: { lastPaymentDate: string; openingBalance: number; paymentReceived: number };
  };
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const editing = Boolean(statement);
  const [roomId, setRoomId] = useState(statement?.roomId || defaultRoomId || rooms[0]?.id || '');
  const [tenantId, setTenantId] = useState(statement?.tenantId || '');
  const [billings, setBillings] = useState<BillingRow[]>(
    statement
      ? statement.billings.map((b) => toBillingRow(b))
      : [
          toBillingRow({ title: '電費', qty: 0, unitRate: 1.8, lastReading: 0, thisReading: 0, issueDate: '' }, 'reading'),
          toBillingRow({ title: '水費', qty: 0, unitRate: 16, lastReading: 0, thisReading: 0, issueDate: '' }, 'reading'),
        ]
  );
  const [renting, setRenting] = useState(
    statement?.renting || {
      lastPaymentDate: '',
      openingBalance: 0,
      paymentReceived: 0,
    }
  );
  const [includeRenting, setIncludeRenting] = useState(Boolean(statement?.renting.lastPaymentDate));

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId]
  );

  function updateBilling(index: number, patch: Partial<BillingRow>) {
    setBillings((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const periodStart = (form.querySelector('[name="periodStart"]') as HTMLInputElement)?.value;
    const periodEnd = (form.querySelector('[name="periodEnd"]') as HTMLInputElement)?.value;

    if (!roomId || !tenantId || !periodStart || !periodEnd) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (includeRenting && !renting.lastPaymentDate) {
      setError('請填寫上次繳款日期，或取消勾選上次繳款');
      return;
    }

    const activeBillings = billings.filter(
      (b) => b.title.trim() || b.qty || b.unitRate || b.lastReading || b.thisReading || b.issueDate
    );
    for (const b of activeBillings) {
      if (!b.title.trim()) {
        setError('請填寫收費項目名稱');
        return;
      }
      if (b.mode === 'reading' && b.thisReading < b.lastReading) {
        setError(`「${b.title.trim()}」今月度數不可小於上月度數`);
        return;
      }
    }

    const billingsData = activeBillings.map((b, i) => {
      if (b.mode === 'qty') {
        return {
          issueDate: b.issueDate || periodEnd,
          title: b.title.trim(),
          qty: b.qty,
          unitRate: b.unitRate,
          lastReading: 0,
          thisReading: 0,
          placement: i + 1,
        };
      }
      return {
        issueDate: b.issueDate || periodEnd,
        title: b.title.trim(),
        qty: b.thisReading - b.lastReading,
        unitRate: b.unitRate,
        lastReading: b.lastReading,
        thisReading: b.thisReading,
        placement: i + 1,
      };
    });

    const res = await fetch(withBasePath('/api/statements'), {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(statement ? { id: statement.id } : {}),
        roomId,
        tenantId,
        periodStart,
        periodEnd,
        billings: billingsData,
        rentings:
          includeRenting && renting.lastPaymentDate
            ? [{ ...renting, lastPaymentDate: renting.lastPaymentDate, placement: 1 }]
            : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || (editing ? '更新失敗' : '新增失敗'));
      return;
    }
    router.push(returnTo || (statement ? `/tenancy/${statement.id}` : `/properties/${selectedRoom?.propertyId || ''}/statements`));
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
        <label>房間 *</label>
        <select
          name="roomId"
          required
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setTenantId('');
          }}
        >
          <option value="">請選擇</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.propertyName ? `${r.propertyName} / ${r.name}` : r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>租客 *</label>
        <select
          name="tenantId"
          required
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        >
          <option value="">請選擇</option>
          {(selectedRoom?.tenants || []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameChinese} {t.nameEnglish}{t.isActive === false ? '（已遷出）' : ''}
            </option>
          ))}
        </select>
      </div>
      {selectedRoom && (
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          月租：{formatMonthlyRent(selectedRoom.monthlyRent)}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>開始日期 *</label>
          <input name="periodStart" type="date" required defaultValue={statement?.periodStart || ''} />
        </div>
        <div className="form-group">
          <label>結束日期 *</label>
          <input name="periodEnd" type="date" required defaultValue={statement?.periodEnd || ''} />
        </div>
      </div>

      <h3 style={{ margin: '1.5rem 0 0.5rem' }}>收費項目</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        選填。每一項使用度數（上月度數及今月度數）或數量，可全部移除。
      </p>
      {billings.length === 0 && (
        <p style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}>此租單沒有收費項目</p>
      )}
      {billings.map((b, i) => {
        const usage = b.thisReading - b.lastReading;
        return (
          <div
            key={b.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 0.85fr 1fr 1fr 0.75fr 1.15fr auto',
              gap: '0.5rem',
              alignItems: 'end',
              marginBottom: '0.5rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>項目</label>
              <input value={b.title} onChange={(e) => updateBilling(i, { title: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>計算</label>
              <select
                value={b.mode}
                onChange={(e) => {
                  const mode = e.target.value as ChargeMode;
                  if (mode === 'qty' && b.thisReading >= b.lastReading && (b.lastReading !== 0 || b.thisReading !== 0)) {
                    updateBilling(i, { mode, qty: b.thisReading - b.lastReading });
                    return;
                  }
                  updateBilling(i, { mode });
                }}
              >
                <option value="reading">度數</option>
                <option value="qty">數量</option>
              </select>
            </div>
            {b.mode === 'reading' ? (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>上月度數</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={b.lastReading || ''}
                    onChange={(e) => updateBilling(i, { lastReading: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>今月度數</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={b.thisReading || ''}
                    onChange={(e) => updateBilling(i, { thisReading: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            ) : (
              <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                <label>數量</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={b.qty || ''}
                  onChange={(e) => updateBilling(i, { qty: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>單價</label>
              <input
                type="number"
                step="0.01"
                value={b.unitRate || ''}
                onChange={(e) => updateBilling(i, { unitRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>日期</label>
              <input
                type="date"
                value={b.issueDate}
                onChange={(e) => updateBilling(i, { issueDate: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setBillings((rows) => rows.filter((row) => row.key !== b.key))}
            >
              移除
            </button>
            {b.mode === 'reading' && (
              <span style={{ gridColumn: '3 / 5', marginTop: '-0.15rem', marginBottom: '0.35rem', fontSize: '0.75rem', color: usage < 0 ? 'var(--error)' : 'var(--muted)' }}>
                {usage < 0 ? '今月度數不可小於上月度數' : `用量 ${usage}`}
              </span>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginBottom: '0.5rem' }}
        onClick={() =>
          setBillings((rows) => [
            ...rows,
            toBillingRow({ title: '', qty: 0, unitRate: 0, lastReading: 0, thisReading: 0, issueDate: '' }, 'qty'),
          ])
        }
      >
        新增項目
      </button>

      <h3 style={{ margin: '1rem 0 0.5rem' }}>上次繳款</h3>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
        <input
          type="checkbox"
          checked={includeRenting}
          onChange={(e) => setIncludeRenting(e.target.checked)}
          style={{ width: 'auto' }}
        />
        選填
      </label>
      {includeRenting && (
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
      )}

      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        {editing ? '儲存' : '新增租單'}
      </button>
    </form>
  );
}
