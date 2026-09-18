"use client";

import { useState } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');

      setStatus('success');
      setMessage('Subscribed! You will receive weekly broadsheet issues.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Subscription failed');
    }
  };

  return (
    <div className="p-4 border border-outline-variant bg-surface-variant/20 rounded">
      <h3 className="font-headline-md text-sm uppercase tracking-wider mb-1">Weekly Broadsheet Newsletter</h3>
      <p className="text-xs text-on-surface-variant mb-3">
        Get the AI magazine compiled for CS students delivered to your inbox every Sunday.
      </p>

      {status === 'success' ? (
        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded">
          ✓ {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="student@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-outline bg-background text-on-surface rounded focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-primary text-on-primary text-xs font-label-caps uppercase px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <div className="text-xs text-red-500 mt-1">{message}</div>
      )}
    </div>
  );
}
