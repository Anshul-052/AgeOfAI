import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

function safeDestination(value: string | null, type: EmailOtpType | null) {
  if (type === 'recovery') return '/reset-password';
  return value?.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') && !value.startsWith('/auth/')
    ? value
    : '/read';
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const destination = safeDestination(url.searchParams.get('next'), type);
  const config = getSupabasePublicConfig();

  if (tokenHash && type && config) {
    const response = NextResponse.redirect(new URL(destination, url.origin));
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values, headers) => {
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers || {}).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return response;
  }

  const failure = type === 'recovery' ? '/forgot-password?error=recovery' : '/login?error=confirmation';
  return NextResponse.redirect(new URL(failure, url.origin));
}
