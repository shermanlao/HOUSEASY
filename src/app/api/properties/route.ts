import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const name = (formData.get('name') as string) || '';
    const addressChinese = formData.get('addressChinese') as string;
    const addressEnglish = formData.get('addressEnglish') as string;
    const monthlyRent = parseFloat(formData.get('monthlyRent') as string);

    if (!addressChinese || !addressEnglish || isNaN(monthlyRent)) {
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
        monthlyRent,
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
