import { NextRequest } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json(
        { error: '請輸入電郵和密碼' },
        { status: 400 }
      );
    }
    const user = await verifyPassword(email, password);
    if (!user) {
      return Response.json(
        { error: '電郵或密碼錯誤' },
        { status: 401 }
      );
    }
    await createSession(user);
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: '登入失敗' },
      { status: 500 }
    );
  }
}
