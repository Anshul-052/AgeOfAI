'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.');
      router.replace('/admin');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12">
      <section className="w-full max-w-md border border-outline-variant bg-surface p-7 rounded-lg shadow-lg">
        <p className="font-label-caps uppercase text-xs text-primary font-bold tracking-widest">Private editorial access</p>
        <h1 className="font-headline-xl text-3xl mt-2 mb-2">AgeOfAI Admin</h1>
        <p className="text-sm text-on-surface-variant mb-6">Enter the admin password configured in Vercel to review and publish draft issues.</p>
        <form onSubmit={signIn} className="space-y-4">
          <label className="block text-sm font-bold" htmlFor="admin-password">Admin password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="w-full bg-background border border-outline-variant rounded px-3 py-2.5"
          />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-primary text-on-primary rounded px-4 py-2.5 font-bold disabled:opacity-50">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
