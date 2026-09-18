import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withBasePath } from '@/lib/base-path';

const publicPaths = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('rentaleasy_session');
  const path = pathname.startsWith('/rental') ? pathname.slice('/rental'.length) || '/' : pathname;

  if (publicPaths.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL(withBasePath('/login'), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
