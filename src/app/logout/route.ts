import { clearSession } from '@/lib/auth';
import { withBasePath } from '@/lib/base-path';
import { NextResponse } from 'next/server';

function isPrefetch(request: Request): boolean {
  const purpose = request.headers.get('Purpose') || request.headers.get('Sec-Purpose');
  if (purpose === 'prefetch') return true;
  if (request.headers.get('Next-Router-Prefetch') === '1') return true;
  if (request.headers.get('X-Middleware-Prefetch') === '1') return true;
  return false;
}

/** Prefer LogoutButton (POST). GET ignores prefetch so accidental Link prefetch cannot log users out. */
export async function GET(request: Request) {
  if (isPrefetch(request)) {
    return new NextResponse(null, { status: 204 });
  }
  await clearSession();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(withBasePath('/login'), url.origin));
}
