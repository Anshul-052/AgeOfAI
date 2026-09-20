"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import domains from '@/lib/domains.json';

interface Candidate {
  id: string;
  source: string;
  rawTitle: string;
  rawContent: string;
  sourceUrl: string;
  contentHash: string;
  status: string;
  draftJson: string | null;
  createdAt: string;
  suggestedDomain?: string;
}

export default function AdminInboxPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batching, setBatching] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<{ [id: string]: boolean }>({});
  const [reviewingCandidate, setReviewingCandidate] = useState<Candidate | null>(null);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    crux: '',
    domain: 'Research',
    severity: 'normal',
    tags: ''
  });
  const [approving, setApproving] = useState(false);
  const [issues, setIssues] = useState<{ id: string; volume: string; issueNumber: number; isPublished: boolean }[]>([]);
  const [issueId, setIssueId] = useState('');
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/admin/inbox');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      } else {
        throw new Error('Failed to load the editorial inbox.');
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load the editorial inbox. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial client-side data hydration is intentionally performed on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCandidates();
    fetch('/api/admin/issues').then(async res => {
      if (!res.ok) throw new Error('Failed to load issues.');
      const data = await res.json();
      setIssues(data.issues || []);
      setIssueId(data.issues?.[0]?.id || '');
    }).catch(() => setError('Failed to load issues. Please refresh before approving a story.'));
  }, []);

  const handleRunIngestion = async () => {
    setIngesting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/inbox', { method: 'POST' });
      if (!res.ok) throw new Error('Ingestion failed.');
      await fetchCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setIngesting(false);
    }
  };

  const handleDraft = async (id: string) => {
    setDraftingId(id);
    setError('');
    try {
      const res = await fetch('/api/admin/inbox/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drafting failed.');

      if (data.isCacheHit) {
        setCacheNotice(prev => ({ ...prev, [id]: true }));
      }

      await fetchCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Drafting failed');
    } finally {
      setDraftingId(null);
    }
  };

  const runBatch = async (action: 'draft' | 'add-to-issue') => {
    const eligible = selectedIds.filter(id => candidates.some(candidate => candidate.id === id && candidate.status === (action === 'draft' ? 'pending' : 'drafted')));
    if (!eligible.length) {
      setError(action === 'draft' ? 'Select at least one pending story.' : 'Select at least one drafted story.');
      return;
    }
    if (action === 'add-to-issue' && !issueId) {
      setError('Choose the draft issue that should receive these stories.');
      return;
    }
    setBatching(true);
    setError('');
    try {
      const response = await fetch('/api/admin/inbox/batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, candidateIds: eligible, issueId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Batch action failed.');
      if (action === 'add-to-issue') setSelectedIds(current => current.filter(id => !eligible.includes(id)));
      await fetchCandidates();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Batch action failed.');
      await fetchCandidates();
    } finally {
      setBatching(false);
    }
  };

  const openReviewModal = (candidate: Candidate) => {
    let parsedDraft = { crux: candidate.rawContent, domain: candidate.suggestedDomain || 'Research', severity: 'normal', tags: ['AI'] };
    if (candidate.draftJson) {
      try {
        parsedDraft = JSON.parse(candidate.draftJson);
      } catch {
        // use fallback
      }
    }

    setReviewingCandidate(candidate);
    setReviewForm({
      title: candidate.rawTitle,
      crux: parsedDraft.crux || candidate.rawContent,
      domain: parsedDraft.domain || candidate.suggestedDomain || 'Research',
      severity: parsedDraft.severity || 'normal',
      tags: Array.isArray(parsedDraft.tags) ? parsedDraft.tags.join(', ') : 'AI'
    });
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingCandidate) return;
    setApproving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/inbox/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: reviewingCandidate.id,
          issueId,
          ...reviewForm
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Approval failed.');
      }

      setReviewingCandidate(null);
      await fetchCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  return (
    <main className="max-w-screen-xl mx-auto px-edge-margin py-stack-lg min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs uppercase font-label-caps text-on-surface-variant hover:underline">Admin Dashboard</Link>
          </div>
          <h1 className="font-headline-xl text-headline-xl uppercase mt-1">Multi-Source Ingestion Inbox</h1>
          <p className="text-sm text-on-surface-variant">Automated candidate news stream from arXiv, HuggingFace, and GitHub AI.</p>
        </div>

        <button
          onClick={handleRunIngestion}
          disabled={ingesting}
          className="mt-4 sm:mt-0 bg-primary text-on-primary px-4 py-2 font-label-caps uppercase text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {ingesting ? "Fetching Sources..." : "Run Ingestion Now"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <section className="mb-6 border border-primary/30 bg-surface-variant/20 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="font-bold">Batch editorial desk</p>
              <p className="text-xs text-on-surface-variant mt-1">Select story checkboxes, draft pending items together, then add reviewed drafts to a private issue. The issue still requires your final publish approval.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-label-caps uppercase">
                Destination issue
                <select value={issueId} onChange={event => setIssueId(event.target.value)} className="block mt-1 border border-outline bg-background px-2 py-1.5 normal-case">
                  <option value="">Choose issue</option>
                  {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.volume} Issue {issue.issueNumber} ({issue.isPublished ? 'published' : 'draft'})</option>)}
                </select>
              </label>
              <button disabled={batching} onClick={() => runBatch('draft')} className="bg-primary text-on-primary px-3 py-2 text-xs font-bold disabled:opacity-50">Draft selected pending</button>
              <button disabled={batching} onClick={() => runBatch('add-to-issue')} className="bg-emerald-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-50">Add selected drafts</button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button type="button" className="underline" onClick={() => setSelectedIds(candidates.filter(candidate => candidate.status !== 'published').map(candidate => candidate.id))}>Select all available</button>
            <button type="button" className="underline" onClick={() => setSelectedIds([])}>Clear selection</button>
            <span>{selectedIds.length} selected</span>
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-12 text-center text-on-surface-variant font-mono">Loading ingested candidates...</div>
      ) : candidates.length === 0 ? (
        <div className="p-8 border border-dashed border-outline text-center">
          <p className="text-on-surface-variant mb-4">No candidate stories in the inbox yet.</p>
          <button
            onClick={handleRunIngestion}
            disabled={ingesting}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps uppercase text-xs"
          >
            Run First Ingestion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((item) => (
            <div
              key={item.id}
              className={`p-5 border rounded-lg transition-colors ${
                item.status === 'published'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : item.status === 'drafted'
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-outline-variant bg-surface-variant/20'
              }`}
            >
              {item.status !== 'published' && (
                <label className="mb-3 inline-flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />
                  Select for batch action
                </label>
              )}
              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    item.source === 'arxiv' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                    item.source === 'huggingface' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                    item.source === 'github' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                    item.source === 'hackernews' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300' :
                    item.source === 'producthunt' ? 'bg-pink-500/20 text-pink-700 dark:text-pink-300' :
                    item.source === 'gaming-rss' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                    item.source === 'crypto-rss' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                    item.source === 'mobile-rss' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' :
                    item.source === 'hardware-rss' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                    'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  }`}>
                    {item.source}
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">
                    SHA: {item.contentHash.substring(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.suggestedDomain && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      Suggested: {item.suggestedDomain}
                    </span>
                  )}
                  {cacheNotice[item.id] && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                      Cache Hit (0 Tokens)
                    </span>
                  )}
                  <span className={`text-[10px] font-label-caps uppercase px-2 py-0.5 rounded ${
                    item.status === 'published' ? 'bg-emerald-600 text-white' :
                    item.status === 'drafted' ? 'bg-blue-600 text-white' : 'bg-outline-variant text-on-surface'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <h2 className="font-headline-md text-lg mb-2">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  {item.rawTitle}
                </a>
              </h2>

              <p className="text-sm text-on-surface-variant mb-4 line-clamp-3 font-serif">
                {item.rawContent}
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
                {item.status === 'pending' && (
                  <button
                    onClick={() => handleDraft(item.id)}
                    disabled={draftingId === item.id}
                    className="bg-primary text-on-primary text-xs font-label-caps uppercase px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                  >
                    {draftingId === item.id ? "Drafting with Gemini..." : "Draft with Gemini AI"}
                  </button>
                )}

                {item.status === 'drafted' && (
                  <button
                    onClick={() => openReviewModal(item)}
                    className="bg-emerald-600 text-white text-xs font-label-caps uppercase px-3 py-1.5 hover:bg-emerald-700"
                  >
                    Review and add story
                  </button>
                )}

                {item.status === 'published' && (
                  <span className="text-xs text-emerald-600 font-label-caps uppercase py-1">
                    Approved and added to an issue
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewingCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-primary max-w-2xl w-full p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-headline-xl text-xl uppercase mb-4">Human Editorial Review & Approval</h2>
            
            <form onSubmit={handleApprove} className="space-y-4">
              {error && <p role="alert" className="text-red-700 border border-red-700 p-3">{error}</p>}
              <div>
                <label htmlFor="publication-issue" className="block text-xs font-label-caps uppercase mb-1">Add to issue</label>
                <select id="publication-issue" required value={issueId} onChange={e => setIssueId(e.target.value)} className="w-full border border-outline p-2 bg-transparent text-sm">
                  <option value="">Select an issue</option>
                  {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.volume} — Issue {issue.issueNumber} ({issue.isPublished ? 'published' : 'draft'})</option>)}
                </select>
                {issues.length === 0 && <Link href="/admin/issues/new" className="text-sm underline">Create a draft issue first.</Link>}
              </div>
              <div>
                <label className="block text-xs font-label-caps uppercase mb-1">Headline / Title</label>
                <input
                  required
                  className="w-full border border-outline p-2 bg-transparent text-sm"
                  value={reviewForm.title}
                  onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase mb-1">Crux (Article Summary)</label>
                <textarea
                  required
                  className="w-full border border-outline p-2 min-h-[140px] bg-transparent text-sm font-serif"
                  value={reviewForm.crux}
                  onChange={e => setReviewForm({ ...reviewForm, crux: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase mb-1">Domain</label>
                  <select
                    className="w-full border border-outline p-2 bg-transparent text-sm"
                    value={reviewForm.domain}
                    onChange={e => setReviewForm({ ...reviewForm, domain: e.target.value })}
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase mb-1">Severity</label>
                  <select
                    className="w-full border border-outline p-2 bg-transparent text-sm"
                    value={reviewForm.severity}
                    onChange={e => setReviewForm({ ...reviewForm, severity: e.target.value })}
                  >
                    {["normal", "notable", "major"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase mb-1">Tags</label>
                  <input
                    className="w-full border border-outline p-2 bg-transparent text-sm"
                    value={reviewForm.tags}
                    onChange={e => setReviewForm({ ...reviewForm, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setReviewingCandidate(null)}
                  className="px-4 py-2 border border-outline font-label-caps uppercase text-xs hover:bg-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving || !issueId}
                  className="px-4 py-2 bg-emerald-600 text-white font-label-caps uppercase text-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {approving ? "Adding..." : "Approve and add to issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
