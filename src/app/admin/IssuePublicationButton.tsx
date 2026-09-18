"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IssuePublicationButton({ issueId, issueNumber }: { issueId: string; issueNumber: number }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const publish = async () => {
    const confirmed = window.confirm(
      `Publish Issue ${issueNumber} now? This makes every story in the issue visible to readers. Review the draft before continuing.`
    );
    if (!confirmed) return;

    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/issues/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publication failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Publication failed.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={publish}
        disabled={publishing}
        className="bg-primary text-on-primary text-[11px] font-label-caps uppercase px-3 py-1 rounded hover:opacity-90 disabled:opacity-50"
      >
        {publishing ? "Publishing..." : "Review complete — publish issue"}
      </button>
      {error && <p className="mt-1 text-[10px] text-error">{error}</p>}
    </div>
  );
}
