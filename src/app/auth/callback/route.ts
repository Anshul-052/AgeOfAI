import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

function safeDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') && !value.startsWith('/auth/') ? value : '/';
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const config = getSupabasePublicConfig();
  if (code && config) {
    const response = NextResponse.redirect(new URL(safeDestination(url.searchParams.get('next')), url.origin));
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values, headers) => {
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers || {}).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', url.origin));
}
