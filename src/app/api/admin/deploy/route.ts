import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDeployStatus, parseDeployApp, startDeploy } from '@/lib/deploy-apps';

function authError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }
  }
  return null;
}

export async function GET() {
  try {
    await requireAdmin();
    const apps = await getDeployStatus();
    return Response.json({ apps });
  } catch (err: unknown) {
    const denied = authError(err);
    if (denied) return denied;
    console.error(err);
    return Response.json({ error: '讀取版本失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const app = parseDeployApp(body.app);
    if (!app) return Response.json({ error: '未知的程式' }, { status: 400 });
    const result = startDeploy(app);
    if (result.error) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ started: true });
  } catch (err: unknown) {
    const denied = authError(err);
    if (denied) return denied;
    console.error(err);
    return Response.json({ error: '部署失敗' }, { status: 500 });
  }
}
