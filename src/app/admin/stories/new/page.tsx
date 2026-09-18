"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import domains from '@/lib/domains.json';

export default function NewStoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    crux: "",
    sourceUrl: "",
    imageUrl: "",
    videoUrl: "",
    domain: "LLMs",
    severity: "normal",
    tags: ""
  });
  const [rawText, setRawText] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [tokenUsageNotice, setTokenUsageNotice] = useState<{
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
  } | null>(null);

  const handleDraft = async () => {
    if (!rawText.trim()) return alert("Enter raw text to draft from.");
    setIsDrafting(true);
    setError("");
    setTokenUsageNotice(null);
    try {
      const res = await fetch("/api/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawText })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Drafting failed.");
      
      const { draft, usage } = data;
      setFormData(prev => ({
        ...prev,
        crux: draft.crux || prev.crux,
        domain: draft.domain || prev.domain,
        severity: draft.severity || prev.severity,
        tags: draft.tags ? draft.tags.join(", ") : prev.tags
      }));

      if (usage) {
        setTokenUsageNotice(usage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drafting failed.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Saving failed.");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-screen-md mx-auto px-edge-margin py-stack-lg min-h-screen">
      <h1 className="font-headline-xl text-headline-xl uppercase mb-8">New Story</h1>
      
      {error && <div className="bg-red-500/10 border border-red-500 text-red-700 dark:text-red-300 p-4 mb-4 rounded">{error}</div>}

      <div className="mb-8 p-4 border border-primary bg-surface-variant/30 rounded">
        <h2 className="font-headline-md mb-2">AI Drafter (Gemini 1.5 Flash)</h2>
        <textarea
          className="w-full p-2 border border-outline mb-2 min-h-[100px] bg-background text-on-surface"
          placeholder="Paste article content or raw text here..."
          value={rawText}
          onChange={e => setRawText(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleDraft}
            disabled={isDrafting}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isDrafting ? "Drafting with Gemini..." : "Draft with Gemini AI"}
          </button>

          {tokenUsageNotice && (
            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded">
              Usage: <strong>{tokenUsageNotice.totalTokens}</strong> tokens (Prompt: {tokenUsageNotice.promptTokens}, Output: {tokenUsageNotice.candidateTokens})
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-label-caps uppercase mb-1">Title</label>
          <input required className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        <div>
          <label className="block font-label-caps uppercase mb-1">Crux</label>
          <textarea required className="w-full border border-primary bg-transparent p-2 min-h-[150px]" value={formData.crux} onChange={e => setFormData({...formData, crux: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-label-caps uppercase mb-1">Source URL</label>
            <input required type="url" className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
          </div>
          <div>
            <label className="block font-label-caps uppercase mb-1">Image URL</label>
            <input type="url" className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div>
            <label className="block font-label-caps uppercase mb-1">Video URL (Embed)</label>
            <input type="url" className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
          </div>
          <div>
            <label className="block font-label-caps uppercase mb-1">Tags (comma separated)</label>
            <input required className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
          </div>
          <div>
            <label className="block font-label-caps uppercase mb-1">Domain</label>
            <select className="w-full border border-primary bg-transparent p-1" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}>
              {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-label-caps uppercase mb-1">Severity</label>
            <select className="w-full border border-primary bg-transparent p-1" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
              {["normal", "notable", "major"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        
        <div className="pt-6">
          <button type="submit" disabled={isSaving} className="w-full bg-primary text-on-primary font-headline-md py-3 hover:opacity-90 disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Story"}
          </button>
          <p className="text-center text-sm mt-2 font-label-caps uppercase text-on-surface-variant">
            Requires human review and approval.
          </p>
        </div>
      </form>
    </main>
  );
}
