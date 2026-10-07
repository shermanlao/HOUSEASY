import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessProperty } from '@/lib/access';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const propertyId = formData.get('propertyId') as string;
    const name = (formData.get('name') as string)?.trim();
    const monthlyRent = parseFloat(formData.get('monthlyRent') as string);

    if (!propertyId || !name || isNaN(monthlyRent)) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    if (!(await canAccessProperty(propertyId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    const room = await prisma.room.create({
      data: { propertyId, name, monthlyRent },
    });
    return Response.json({ success: true, id: room.id });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: '新增失敗' }, { status: 500 });
  }
}
