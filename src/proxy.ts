import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminSessionMatches, credentialsMatch, readAdminCredential } from '@/lib/adminAuth';

function isProtectedRequest(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/admin/login' || path === '/api/admin/login') return false;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  if (path === '/api/admin' || path.startsWith('/api/admin/')) return true;
  if (path === '/api/ai-draft') return true;

  const isWrite = request.method !== 'GET' && request.method !== 'HEAD';
  return isWrite && (
    path === '/api/issues' || path.startsWith('/api/issues/') ||
    path === '/api/stories' || path.startsWith('/api/stories/')
  );
}

export async function proxy(request: NextRequest) {
  if (!isProtectedRequest(request)) return NextResponse.next();

  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const provided = readAdminCredential(request.headers.get('authorization'));
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (credentialsMatch(provided, expected) || await adminSessionMatches(session, expected)) return NextResponse.next();

  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    const login = new URL('/admin/login', request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.json({ error: 'Admin authorization required' }, { status: 401 });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/ai-draft',
    '/api/issues/:path*',
    '/api/stories/:path*'
  ]
};
