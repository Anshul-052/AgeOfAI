import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminSessionMatches, credentialsMatch, readAdminCredential } from '@/lib/adminAuth';
import { createServerClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

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

export function isAuthenticationPage(path: string) {
  return path === '/login' || path === '/admin/login' || path.startsWith('/auth/');
}

export async function proxy(request: NextRequest) {
  if (!isProtectedRequest(request)) {
    const path = request.nextUrl.pathname;
    const isPublicAuthPath = isAuthenticationPage(path);
    const isReaderPage = (request.method === 'GET' || request.method === 'HEAD') && !path.startsWith('/api/');
    const config = getSupabasePublicConfig();
    if (!config || !isReaderPage || isPublicAuthPath) return NextResponse.next();

    let response = NextResponse.next({ request });
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', path);
      return NextResponse.redirect(login);
    }
    if (path === '/login') return NextResponse.redirect(new URL('/', request.url));
    return response;
  }

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|social/).*)']
};
