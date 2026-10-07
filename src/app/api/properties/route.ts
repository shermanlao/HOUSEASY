import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { canAccessProperty } from '@/lib/access';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const name = (formData.get('name') as string) || '';
    const addressChinese = formData.get('addressChinese') as string;
    const addressEnglish = formData.get('addressEnglish') as string;

    if (!addressChinese || !addressEnglish) {
      return Response.json(
        { error: '請填寫所有欄位' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        name,
        addressChinese,
        addressEnglish,
        owners: {
          create: { userId: session.id },
        },
      },
    });
    return Response.json({ success: true, id: property.id });
  } catch (err) {
    console.error(err);
    return Response.json({ error: '新增失敗' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string) || '';
    const addressChinese = formData.get('addressChinese') as string;
    const addressEnglish = formData.get('addressEnglish') as string;

    if (!id || !addressChinese || !addressEnglish) {
      return Response.json({ error: '請填寫所有欄位' }, { status: 400 });
    }
    if (!(await canAccessProperty(id, session))) {
      return Response.json({ error: '權限不足' }, { status: 403 });
    }

    await prisma.property.update({
      where: { id },
      data: { name, addressChinese, addressEnglish },
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
