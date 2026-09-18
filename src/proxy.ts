import { NextRequest, NextResponse } from 'next/server';
import { credentialsMatch, readAdminCredential } from '@/lib/adminAuth';

function isProtectedRequest(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  if (path === '/api/admin' || path.startsWith('/api/admin/')) return true;
  if (path === '/api/ai-draft') return true;

  const isWrite = request.method !== 'GET' && request.method !== 'HEAD';
  return isWrite && (
    path === '/api/issues' || path.startsWith('/api/issues/') ||
    path === '/api/stories' || path.startsWith('/api/stories/')
  );
}

export function proxy(request: NextRequest) {
  if (!isProtectedRequest(request)) return NextResponse.next();

  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const provided = readAdminCredential(request.headers.get('authorization'));
  if (credentialsMatch(provided, expected)) return NextResponse.next();

  return NextResponse.json(
    { error: 'Admin authorization required' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="AgeOfAI admin", charset="UTF-8"' }
    }
  );
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
