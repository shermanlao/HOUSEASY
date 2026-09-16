import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { propertyId, email } = await request.json();
    if (!propertyId || !email) {
      return Response.json({ error: '請提供物業ID和電郵' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email, role: 'OWNER' },
    });
    if (!user) {
      return Response.json({ error: '找不到該業主用戶' }, { status: 404 });
    }

    const existing = await prisma.propertyOwner.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } },
    });
    if (existing) {
      return Response.json({ error: '該業主已是此物業的業主' }, { status: 400 });
    }

    await prisma.propertyOwner.create({
      data: { userId: user.id, propertyId },
    });
    return Response.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return Response.json({ error: '請先登入' }, { status: 401 });
      if (err.message === 'FORBIDDEN') return Response.json({ error: '權限不足' }, { status: 403 });
    }
    console.error(err);
    return Response.json({ error: '新增失敗' }, { status: 500 });
  }
}
