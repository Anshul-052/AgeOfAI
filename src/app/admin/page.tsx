import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTokenUsageStats, DomainTokenStats } from "@/lib/gemini";
import { Issue, Story } from "@prisma/client";
import DispatchNewsletterButton from "./DispatchNewsletterButton";
import GenerateCoverArtButton from "./GenerateCoverArtButton";

export default async function AdminPage() {
  let issues: Issue[] = [];
  let stories: Story[] = [];
  let tokenStats = {
    promptTokens: 0,
    candidateTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    cacheHitCount: 0,
    draftCount: 0,
    explainCount: 0,
    imageCount: 0,
    freeTierLimit: 1000000,
    remainingTokens: 1000000,
    percentUsed: 0,
    domainBreakdown: [] as DomainTokenStats[]
  };

  try {
    issues = await prisma.issue.findMany({ orderBy: { publishedAt: 'desc' } });
    stories = await prisma.story.findMany({ orderBy: { publishedAt: 'desc' } });
    tokenStats = await getTokenUsageStats();
  } catch (err) {
    console.error("Admin Dashboard fetch error:", err);
  }

  return (
    <main className="max-w-screen-xl mx-auto px-edge-margin py-stack-lg min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-xl text-headline-xl uppercase">Admin Editorial Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage issues, candidate inbox stream, AI drafting, and token usage analytics.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Link href="/admin/inbox" className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 font-label-caps uppercase text-xs transition-colors rounded">
            📥 Ingestion Inbox
          </Link>
          <Link href="/admin/issues/new" className="border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary font-label-caps uppercase text-xs transition-colors rounded">
            + New Issue
          </Link>
          <Link href="/admin/stories/new" className="bg-primary text-on-primary px-4 py-2 hover:opacity-90 font-label-caps uppercase text-xs transition-colors rounded">
            + New Story
          </Link>
        </div>
      </div>

      {/* Gemini Token Usage & Response Cache Monitor Widget */}
      <section className="mb-12 p-6 border border-primary/20 bg-surface-variant/30 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="font-headline-md text-xl uppercase tracking-wide flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Gemini API — Token Usage & Cache Monitor
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Tracking SHA-256 cache hits and API consumption breakdown by feature.
            </p>
          </div>
          <span className="mt-2 md:mt-0 font-mono text-xs px-3 py-1 bg-surface border border-outline-variant rounded">
            Free Tier Quota: 1,000,000 Tokens
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 text-center">
          <div className="p-3 bg-background border border-outline-variant rounded">
            <span className="text-[10px] uppercase text-on-surface-variant block font-label-caps">Total Requests</span>
            <span className="text-xl font-bold font-mono">{tokenStats.requestCount}</span>
          </div>
          <div className="p-3 bg-background border border-outline-variant rounded">
            <span className="text-[10px] uppercase text-on-surface-variant block font-label-caps">⚡ Cache Hits</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{tokenStats.cacheHitCount}</span>
          </div>
          <div className="p-3 bg-background border border-outline-variant rounded">
            <span className="text-[10px] uppercase text-on-surface-variant block font-label-caps">Draft Calls</span>
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{tokenStats.draftCount}</span>
          </div>
          <div className="p-3 bg-background border border-outline-variant rounded">
            <span className="text-[10px] uppercase text-on-surface-variant block font-label-caps">Tutor Explains</span>
            <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">{tokenStats.explainCount}</span>
          </div>
          <div className="p-3 bg-background border border-outline-variant rounded">
            <span className="text-[10px] uppercase text-on-surface-variant block font-label-caps">Cover Art Gens</span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{tokenStats.imageCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-background border border-outline-variant rounded mb-4 text-center font-mono text-xs">
          <div>Prompt Tokens: <strong>{tokenStats.promptTokens.toLocaleString()}</strong></div>
          <div>Candidate Output Tokens: <strong>{tokenStats.candidateTokens.toLocaleString()}</strong></div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span>Quota Used: {tokenStats.percentUsed}%</span>
            <span>{tokenStats.remainingTokens.toLocaleString()} tokens remaining</span>
          </div>
          <div className="w-full bg-outline-variant/30 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.max(1, tokenStats.percentUsed)}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Per-Domain Token Breakdown */}
      {tokenStats.domainBreakdown && tokenStats.domainBreakdown.length > 0 && (
        <section className="mb-12 p-6 border border-amber-500/20 bg-amber-500/5 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="font-headline-md text-xl uppercase tracking-wide flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                Token Usage by Domain
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Cost breakdown per editorial section for budget allocation decisions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-outline-variant text-left">
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant">Domain</th>
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant text-right">Total Tokens</th>
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant text-right">Prompt</th>
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant text-right">Output</th>
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant text-right">Requests</th>
                  <th className="pb-2 font-label-caps uppercase text-on-surface-variant text-right">% of Budget</th>
                </tr>
              </thead>
              <tbody>
                {tokenStats.domainBreakdown.map((d: DomainTokenStats) => (
                  <tr key={d.domain} className="border-b border-outline-variant/30">
                    <td className="py-2 font-bold text-primary">{d.domain}</td>
                    <td className="py-2 text-right">{d.totalTokens.toLocaleString()}</td>
                    <td className="py-2 text-right">{d.promptTokens.toLocaleString()}</td>
                    <td className="py-2 text-right">{d.candidateTokens.toLocaleString()}</td>
                    <td className="py-2 text-right">{d.requestCount}</td>
                    <td className="py-2 text-right text-amber-600 dark:text-amber-400 font-bold">
                      {tokenStats.totalTokens > 0 ? ((d.totalTokens / tokenStats.totalTokens) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <div className="flex justify-between items-center mb-4 border-b-2 border-primary pb-2">
            <h2 className="font-headline-md text-2xl uppercase">Issues Management</h2>
            <Link href="/admin/issues/new" className="border border-primary px-4 py-1 hover:bg-primary hover:text-on-primary font-label-caps uppercase transition-colors text-xs">
              + New Issue
            </Link>
          </div>
          <ul className="space-y-4">
            {issues.map(issue => (
              <li key={issue.id} className="p-4 border border-outline-variant rounded bg-surface-variant/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{issue.volume} Issue #{issue.issueNumber}</span>
                  <span className="font-label-caps text-xs uppercase px-2 py-0.5 border border-outline-variant rounded">
                    {issue.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant font-mono mb-3">
                  Layout: {issue.layout || 'lead-story-focus'}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
                  <DispatchNewsletterButton issueId={issue.id} issueNumber={issue.issueNumber} />
                  <GenerateCoverArtButton issueId={issue.id} hasCover={Boolean(issue.coverImageUrl)} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4 border-b-2 border-primary pb-2">
            <h2 className="font-headline-md text-2xl uppercase">Stories</h2>
            <Link href="/admin/stories/new" className="border border-primary px-4 py-1 hover:bg-primary hover:text-on-primary font-label-caps uppercase transition-colors text-xs">
              + New Story
            </Link>
          </div>
          <ul className="space-y-2">
            {stories.slice(0, 10).map(story => (
              <li key={story.id} className="p-3 border border-outline-variant flex justify-between items-center text-xs">
                <Link href={`/admin/stories/${story.id}`} className="hover:underline font-bold text-sm">
                  {story.title}
                </Link>
                <span className="font-label-caps uppercase text-on-surface-variant ml-4 px-2 py-0.5 bg-surface-variant rounded">
                  {story.domain}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
