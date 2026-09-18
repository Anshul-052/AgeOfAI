"use client";

import { useState } from "react";

interface DispatchNewsletterButtonProps {
  issueId: string;
  issueNumber: number;
}

export default function DispatchNewsletterButton({ issueId, issueNumber }: DispatchNewsletterButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleDispatch = async () => {
    if (!confirm(`Send Issue #${issueNumber} broadsheet newsletter to active subscribers?`)) return;

    setSending(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/dispatch-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed.');

      setMessage(data.message || `Dispatched to ${data.dispatchedCount} subscribers.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Dispatch failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDispatch}
        disabled={sending}
        className="bg-emerald-600 text-white text-[11px] font-label-caps uppercase px-3 py-1 rounded hover:bg-emerald-700 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Newsletter'}
      </button>
      {message && <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">{message}</p>}
    </div>
  );
}
