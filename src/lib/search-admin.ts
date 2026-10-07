const SEARCH_API_URL = (process.env.SEARCH_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const SEARCH_ADMIN_TOKEN = process.env.SEARCH_ADMIN_TOKEN?.trim() || '';

export type SearchSyncSource = 'all' | 'h28' | 'squarefoot' | 'centanet';

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${SEARCH_ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export function searchAdminConfigured(): boolean {
  return Boolean(SEARCH_ADMIN_TOKEN);
}

export async function fetchSearchStatus() {
  if (!SEARCH_ADMIN_TOKEN) {
    throw new Error('SEARCH_ADMIN_TOKEN 未設定');
  }
  const res = await fetch(`${SEARCH_API_URL}/api/admin/status`, {
    headers: headers(),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `搜尋服務回應 ${res.status}`);
  }
  return data;
}

export async function triggerSearchSync(source: SearchSyncSource) {
  if (!SEARCH_ADMIN_TOKEN) {
    throw new Error('SEARCH_ADMIN_TOKEN 未設定');
  }
  const res = await fetch(`${SEARCH_API_URL}/api/sync`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ source }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `同步失敗 ${res.status}`);
  }
  return data;
}
