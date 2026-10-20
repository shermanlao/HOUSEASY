import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessProperty, canAccessRoom } from '@/lib/access';
import { parseOptionalMonthlyRent } from '@/lib/rent';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const propertyId = formData.get('propertyId') as string;
    const name = (formData.get('name') as string)?.trim();
    const monthlyRent = parseOptionalMonthlyRent(formData.get('monthlyRent'));

    if (!propertyId || !name) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }
    if (!monthlyRent.ok) {
      return Response.json({ error: '月租必須為 0 或以上' }, { status: 400 });
    }

    if (!(await canAccessProperty(propertyId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    const room = await prisma.room.create({
      data: { propertyId, name, monthlyRent: monthlyRent.value },
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const monthlyRent = parseOptionalMonthlyRent(formData.get('monthlyRent'));

    if (!id || !name) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }
    if (!monthlyRent.ok) {
      return Response.json({ error: '月租必須為 0 或以上' }, { status: 400 });
    }
    if (!(await canAccessRoom(id, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.room.update({
      where: { id },
      data: { name, monthlyRent: monthlyRent.value },
    });
    return Response.json({ success: true, id });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: '更新失敗' }, { status: 500 });
  }
}
