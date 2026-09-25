'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

function requestedDestination() {
  const requested = new URLSearchParams(window.location.search).get('next') || '/';
  return requested.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/login') && !requested.startsWith('/auth/')
    ? requested
    : '/';
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === 'signup') {
        const destination = requestedDestination();
        const callback = new URL('/auth/callback', window.location.origin);
        callback.searchParams.set('next', destination);
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback.toString() } });
        if (error) throw error;
        setMessage('Account created. Check your email to confirm your address, then sign in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error('Sign-in completed without a reader session. Please try again.');
        // A full navigation guarantees that the next server request carries the
        // fresh Supabase cookies before the protected-page check runs.
        window.location.assign(requestedDestination());
      }
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Authentication failed.'); }
    finally { setBusy(false); }
  };

  return <main className="min-h-[65vh] flex items-center justify-center px-5 py-12"><section className="w-full max-w-md border border-outline-variant bg-surface p-7 rounded-lg shadow-lg">
    <p className="font-label-caps uppercase text-xs text-primary font-bold tracking-widest">Reader account</p>
    <h1 className="font-headline-xl text-3xl mt-2">{mode === 'login' ? 'Welcome back' : 'Join AgeOfAI'}</h1>
    <p className="text-sm text-on-surface-variant mt-2 mb-6">Sign in to read every issue, search the archive, and follow technology across domains.</p>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full bg-background border border-outline-variant rounded px-3 py-2.5 font-normal" /></label>
      <label className="block text-sm font-bold">Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full bg-background border border-outline-variant rounded px-3 py-2.5 font-normal" /></label>
      {message && <p role="status" className="text-sm border border-outline-variant p-3 rounded">{message}</p>}
      <button disabled={busy} className="w-full bg-primary text-on-primary rounded px-4 py-2.5 font-bold disabled:opacity-50">{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="mt-5 text-sm underline">{mode === 'login' ? 'Create a reader account' : 'Already have an account? Sign in'}</button>
  </section></main>;
}
