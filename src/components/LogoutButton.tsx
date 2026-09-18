'use client';

import { logout } from '@/actions/auth';

/** Use a form POST so Next.js Link prefetch cannot clear the session. */
export function LogoutButton() {
  return (
    <form action={logout} style={{ display: 'inline' }}>
      <button
        type="submit"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--primary)',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        登出
      </button>
    </form>
  );
}
