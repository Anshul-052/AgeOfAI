import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSession, credentialsMatch } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : null;
    if (!credentialsMatch(password, expected)) {
      return NextResponse.json({ error: 'Incorrect admin password.' }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(expected), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 });
  }
}
