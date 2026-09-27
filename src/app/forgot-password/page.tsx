'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { friendlyAuthError } from '@/lib/authMessages';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', '/reset-password');
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callback.toString(),
      });
      if (error) throw error;
      setSent(true);
      setMessage('If an AgeOfAI account uses that email, a secure reset link is on its way. Check your inbox and spam folder.');
    } catch (cause) {
      setMessage(friendlyAuthError(cause, 'recovery'));
    } finally {
      setBusy(false);
    }
  };

  return <main className="min-h-[65vh] flex items-center justify-center px-5 py-12"><section className="w-full max-w-md border border-outline-variant bg-surface p-7 rounded-lg shadow-lg">
    <p className="font-label-caps uppercase text-xs text-primary font-bold tracking-widest">Reader account</p>
    <h1 className="font-headline-xl text-3xl mt-2">Reset your password</h1>
    <p className="text-sm text-on-surface-variant mt-2 mb-6">Enter the email you use for AgeOfAI. We will send you a secure link to choose a new password.</p>
    {searchParams.get('error') === 'recovery' && !message && <p role="alert" className="mb-4 text-sm border border-outline-variant p-3 rounded">That reset link could not be opened. It may have expired or already been used. Request one fresh link below, then open only the newest email.</p>}
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">Email<input type="email" autoComplete="email" required disabled={sent} value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full bg-background border border-outline-variant rounded px-3 py-2.5 font-normal disabled:opacity-60" /></label>
      {message && <p role="status" className="text-sm border border-outline-variant p-3 rounded">{message}</p>}
      {!sent && <button disabled={busy} className="w-full bg-primary text-on-primary rounded px-4 py-2.5 font-bold disabled:opacity-50">{busy ? 'Sending...' : 'Send reset link'}</button>}
    </form>
    <Link href="/login" className="inline-block mt-5 text-sm underline underline-offset-4">Back to sign in</Link>
  </section></main>;
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<main className="min-h-[65vh] flex items-center justify-center px-5 py-12"><p>Loading password recovery...</p></main>}><ForgotPasswordForm /></Suspense>;
}
