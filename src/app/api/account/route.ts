import { NextRequest } from 'next/server';
import { updateOwnAccount } from '@/actions/account';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateOwnAccount({
      email: body.email,
      name: body.name,
      password: body.password || undefined,
    });
    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return Response.json({ error: '請先登入' }, { status: 401 });
      }
      if (err.message === 'FORBIDDEN') {
        return Response.json({ error: '權限不足' }, { status: 403 });
      }
    }
    console.error(err);
    return Response.json({ error: '更新失敗' }, { status: 500 });
  }
}
