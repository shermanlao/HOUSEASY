import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { deleteUser, getUserSignaturePng, updateUser } from '@/actions/admin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return Response.json({ error: '缺少用戶' }, { status: 400 });
    }
    const png = await getUserSignaturePng(id);
    if (!png) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(Uint8Array.from(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store',
      },
    });
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
    return Response.json({ error: '讀取失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    if (!email || !name || !password) {
      return Response.json(
        { error: '請填寫所有欄位' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: '此電郵已存在' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, passwordHash, role: 'OWNER' },
    });
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
    return Response.json({ error: '新增失敗' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const result = await updateUser({
      id: body.id,
      email: body.email,
      name: body.name,
      role: body.role,
      password: body.password || undefined,
      signaturePng: typeof body.signaturePng === 'string' ? body.signaturePng : undefined,
      clearSignature: body.clearSignature === true,
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

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const result = await deleteUser(body.id);
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
    return Response.json({ error: '刪除失敗' }, { status: 500 });
  }
}
