'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string | Date;
};

export function UsersList({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(user: AdminUserRow) {
    setListError('');
    const ok = window.confirm(`確定刪除用戶 ${user.name}（${user.email}）？此操作無法復原。`);
    if (!ok) return;
    setDeletingId(user.id);
    const res = await fetch(withBasePath('/api/admin/users'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    const data = await res.json();
    setDeletingId(null);
    if (!res.ok) {
      setListError(data.error || '刪除失敗');
      return;
    }
    if (editing?.id === user.id) setEditing(null);
    router.refresh();
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = (formData.get('password') as string) || '';
    const res = await fetch(withBasePath('/api/admin/users'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        email: formData.get('email'),
        name: formData.get('name'),
        role: formData.get('role'),
        password: password || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || '更新失敗');
      return;
    }
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      {listError && (
        <div
          style={{
            padding: '0.5rem',
            marginBottom: '0.75rem',
            background: '#fef2f2',
            color: 'var(--error)',
            borderRadius: '6px',
          }}
        >
          {listError}
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>電郵</th>
            <th>姓名</th>
            <th>角色</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr
                key={u.id}
                onClick={() => {
                  setError('');
                  setEditing(u);
                }}
                style={{ cursor: 'pointer' }}
                title="點擊編輯"
              >
                <td style={{ color: 'var(--primary)' }}>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role === 'ADMIN' ? '管理員' : '業主'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString('zh-Hant')}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.65rem' }}
                    disabled={isSelf || deletingId === u.id}
                    title={isSelf ? '不能刪除目前登入的帳號' : '刪除此用戶'}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(u);
                    }}
                  >
                    {deletingId === u.id ? '刪除中…' : '刪除'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          onClick={() => !saving && setEditing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', margin: 0 }}
          >
            <h2 id="edit-user-title" style={{ marginBottom: '1rem' }}>
              編輯用戶
            </h2>
            <form onSubmit={handleSave}>
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
                <label htmlFor="edit-email">電郵</label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editing.email}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-name">姓名</label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editing.name}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-role">角色</label>
                <select id="edit-role" name="role" defaultValue={editing.role} required>
                  <option value="OWNER">業主</option>
                  <option value="ADMIN">管理員</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-password">新密碼（留空則不更改）</label>
                <input
                  id="edit-password"
                  name="password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '儲存中…' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
