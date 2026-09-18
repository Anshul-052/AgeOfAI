"use client";

import { useState } from 'react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  storyCrux: string;
  domain?: string;
}

export default function ExplainModal({ isOpen, onClose, storyTitle, storyCrux, domain }: ExplainModalProps) {
  const [question, setQuestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<number | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sampleQuestions = [
    "Explain the core technical innovation mentioned in this story.",
    "How does this concept compare to traditional architectures?",
    "What are the mathematical or algorithmic bottlenecks solved here?",
    "Can you provide a simple code example or pseudocode?"
  ];

  const handleAsk = async (queryText?: string) => {
    const activeQuery = queryText || question;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError('');
    setExplanation('');
    setTokenNotice(null);

    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyTitle,
          storyCrux,
          question: activeQuery,
          domain: domain
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Explanation request failed.');

      setExplanation(data.explanation);
      if (data.usage?.totalTokens) {
        setTokenNotice(data.usage.totalTokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Explanation request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-primary max-w-2xl w-full p-6 rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start border-b border-outline-variant pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-label-caps bg-primary/10 text-primary px-2 py-0.5 rounded">
                🎓 CS Student AI Tutor
              </span>
              {tokenNotice && (
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  ⚡ {tokenNotice} tokens
                </span>
              )}
            </div>
            <h2 className="font-headline-xl text-xl uppercase mt-1">Ask the Engineer</h2>
            <p className="text-xs text-on-surface-variant line-clamp-1">Context: {storyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-label-caps uppercase mb-2">Suggested Quick Questions</label>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                className="text-xs border border-outline-variant px-2.5 py-1 rounded hover:bg-surface-variant text-left transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-outline p-2 text-sm bg-background rounded focus:outline-none focus:border-primary"
            placeholder="Ask a technical question (e.g. FlashAttention, RAG, MoE)..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="bg-primary text-on-primary px-4 py-2 text-xs font-label-caps uppercase rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Explaining..." : "Ask"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-700 dark:text-red-300 p-3 mb-4 rounded text-xs">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 bg-surface-variant/20 border border-outline-variant rounded font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {loading ? (
            <div className="py-8 text-center text-on-surface-variant font-mono animate-pulse">
              Generating engineering breakdown with Gemini...
            </div>
          ) : explanation ? (
            <div className="space-y-2">
              {explanation}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant text-xs">
              Select a quick question above or enter any computer science topic to get an engineering breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
