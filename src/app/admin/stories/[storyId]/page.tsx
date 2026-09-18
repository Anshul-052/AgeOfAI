"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import domains from '@/lib/domains.json';

export default function EditStoryPage() {
  const params = useParams<{ storyId: string }>();
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
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stories/${params.storyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.story) {
          setFormData({
            title: data.story.title,
            crux: data.story.crux,
            sourceUrl: data.story.sourceUrl,
            imageUrl: data.story.imageUrl || "",
            videoUrl: data.story.videoUrl || "",
            domain: data.story.domain,
            severity: data.story.severity,
            tags: data.story.tags.map((t: { name: string }) => t.name).join(", ")
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.storyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/stories/${params.storyId}`, {
        method: "PUT",
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

  if (loading) return <div>Loading...</div>;

  return (
    <main className="max-w-screen-md mx-auto px-edge-margin py-stack-lg min-h-screen">
      <h1 className="font-headline-xl text-headline-xl uppercase mb-8">Edit Story</h1>
      
      {error && <div className="bg-error-container text-on-error-container p-4 mb-4">{error}</div>}

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
        </div>
      </form>
    </main>
  );
}
