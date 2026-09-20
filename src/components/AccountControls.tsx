'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AccountControls({ email }: { email?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!email) return <Link href="/login">Sign in</Link>;
  return <span className="inline-flex items-center gap-2"><span className="max-w-36 truncate" title={email}>{email}</span><button type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }} className="underline disabled:opacity-50">Sign out</button></span>;
}
