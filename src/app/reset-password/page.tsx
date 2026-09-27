'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'complete';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<RecoveryState>('checking');

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (active) setState(!error && data.user ? 'ready' : 'invalid');
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (password.length < 8) {
      setMessage('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmation) {
      setMessage('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
      setState('complete');
      setMessage('Your password has been updated. You can now sign in with the new password.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'We could not update your password. Please request a new reset link.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="min-h-[65vh] flex items-center justify-center px-5 py-12"><section className="w-full max-w-md border border-outline-variant bg-surface p-7 rounded-lg shadow-lg">
    <p className="font-label-caps uppercase text-xs text-primary font-bold tracking-widest">Secure recovery</p>
    <h1 className="font-headline-xl text-3xl mt-2">Choose a new password</h1>
    {state === 'checking' && <p role="status" className="text-sm text-on-surface-variant mt-4">Checking your reset link...</p>}
    {state === 'invalid' && <div className="mt-4"><p role="alert" className="text-sm border border-outline-variant p-3 rounded">This reset session is invalid or has expired.</p><Link href="/forgot-password" className="inline-block mt-5 text-sm font-semibold underline underline-offset-4">Request a new reset link</Link></div>}
    {(state === 'ready' || state === 'complete') && <>
      {state === 'ready' && <p className="text-sm text-on-surface-variant mt-2 mb-6">Use at least 8 characters. Choose a password you do not use on another site.</p>}
      <form onSubmit={submit} className="space-y-4">
        {state === 'ready' && <>
          <label className="block text-sm font-bold">New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full bg-background border border-outline-variant rounded px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-bold">Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 w-full bg-background border border-outline-variant rounded px-3 py-2.5 font-normal" /></label>
        </>}
        {message && <p role="status" className="text-sm border border-outline-variant p-3 rounded">{message}</p>}
        {state === 'ready' && <button disabled={busy} className="w-full bg-primary text-on-primary rounded px-4 py-2.5 font-bold disabled:opacity-50">{busy ? 'Updating...' : 'Update password'}</button>}
      </form>
      {state === 'complete' && <Link href="/login?next=/read" className="inline-block mt-5 text-sm font-semibold underline underline-offset-4">Sign in and start reading</Link>}
    </>}
  </section></main>;
}
