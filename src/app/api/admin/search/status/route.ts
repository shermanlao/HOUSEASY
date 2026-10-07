import { requireAdmin } from '@/lib/auth';
import { fetchSearchStatus, searchAdminConfigured } from '@/lib/search-admin';

export async function GET() {
  try {
    await requireAdmin();
    if (!searchAdminConfigured()) {
      return Response.json({ error: 'SEARCH_ADMIN_TOKEN 未設定' }, { status: 503 });
    }
    const data = await fetchSearchStatus();
    return Response.json(data);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return Response.json({ error: '請先登入' }, { status: 401 });
      }
      if (err.message === 'FORBIDDEN') {
        return Response.json({ error: '權限不足' }, { status: 403 });
      }
      return Response.json({ error: err.message }, { status: 502 });
    }
    return Response.json({ error: '讀取失敗' }, { status: 500 });
  }
}
