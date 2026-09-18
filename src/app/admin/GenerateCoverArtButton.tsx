"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateCoverArtButtonProps {
  issueId: string;
  hasCover: boolean;
}

export default function GenerateCoverArtButton({ issueId, hasCover }: GenerateCoverArtButtonProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/issues/cover-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cover art generation failed.');

      setMessage('Cover art generated!');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="border border-amber-500/50 text-amber-700 dark:text-amber-300 text-[11px] font-label-caps uppercase px-3 py-1 rounded hover:bg-amber-500/10 disabled:opacity-50"
      >
        {generating ? 'Generating Art...' : hasCover ? '🎨 Regenerate Cover Art' : '🎨 Generate Cover Art'}
      </button>
      {message && <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">{message}</p>}
    </div>
  );
}
