import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessRoom } from '@/lib/access';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const roomId = formData.get('roomId') as string;
    const nameChinese = formData.get('nameChinese') as string;
    const nameEnglish = formData.get('nameEnglish') as string;
    const phone = formData.get('phone') as string;
    const passportOrHkid = (formData.get('passportOrHkid') as string) || undefined;

    if (!roomId || !nameChinese || !nameEnglish || !phone) {
      return Response.json(
        { error: '請填寫必填欄位' },
        { status: 400 }
      );
    }

    if (!(await canAccessRoom(roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.tenant.create({
      data: { roomId, nameChinese, nameEnglish, phone, passportOrHkid },
    });
    return Response.json({ success: true });
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
    const nameChinese = formData.get('nameChinese') as string;
    const nameEnglish = formData.get('nameEnglish') as string;
    const phone = formData.get('phone') as string;
    const passportOrHkid = (formData.get('passportOrHkid') as string) || null;

    if (!id || !nameChinese || !nameEnglish || !phone) {
      return Response.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!tenant) return Response.json({ error: '租客不存在' }, { status: 404 });
    if (!(await canAccessRoom(tenant.roomId, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.tenant.update({
      where: { id },
      data: { nameChinese, nameEnglish, phone, passportOrHkid },
    });
    return Response.json({
      success: true,
      propertyId: tenant.room.propertyId,
      roomId: tenant.roomId,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: '更新失敗' }, { status: 500 });
  }
}
