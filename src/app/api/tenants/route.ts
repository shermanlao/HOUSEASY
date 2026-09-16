import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const propertyId = formData.get('propertyId') as string;
    const nameChinese = formData.get('nameChinese') as string;
    const nameEnglish = formData.get('nameEnglish') as string;
    const phone = formData.get('phone') as string;
    const passportOrHkid = (formData.get('passportOrHkid') as string) || undefined;

    if (!propertyId || !nameChinese || !nameEnglish || !phone) {
      return Response.json(
        { error: '請填寫必填欄位' },
        { status: 400 }
      );
    }

    const owned = await prisma.propertyOwner.findFirst({
      where: { propertyId, userId: session.id },
    });
    if (!owned && session.role !== 'ADMIN') {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.tenant.create({
      data: { propertyId, nameChinese, nameEnglish, phone, passportOrHkid },
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
