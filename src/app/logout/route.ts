import { clearSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await clearSession();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/login', url.origin));
}
