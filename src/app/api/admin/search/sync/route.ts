import { requireAdmin } from '@/lib/auth';
import { searchAdminConfigured, triggerSearchSync, type SearchSyncSource } from '@/lib/search-admin';

export const maxDuration = 300;

const SOURCES: SearchSyncSource[] = ['all', 'h28', 'squarefoot', 'centanet'];

export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (!searchAdminConfigured()) {
      return Response.json({ error: 'SEARCH_ADMIN_TOKEN 未設定' }, { status: 503 });
    }
    const body = await request.json().catch(() => ({}));
    const source: SearchSyncSource = SOURCES.includes(body.source) ? body.source : 'all';
    const data = await triggerSearchSync(source);
    return Response.json(data);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return Response.json({ error: '請先登入' }, { status: 401 });
      }
      if (err.message === 'FORBIDDEN') {
        return Response.json({ error: '權限不足' }, { status: 403 });
      }
      const status = err.message.includes('already in progress') ? 409 : 502;
      return Response.json({ error: err.message }, { status });
    }
    return Response.json({ error: '同步失敗' }, { status: 500 });
  }
}
