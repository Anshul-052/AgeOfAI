import React from 'react';
import Image from 'next/image';
import StoryCard, { Story } from '@/components/StoryCard';
import DramaSection from '@/components/DramaSection';
import BroadsheetPageScroll from '@/components/BroadsheetPageScroll';
import domains from '@/lib/domains.json';

interface IssueInfo {
  volume: string;
  issueNumber: number;
  publishedAt: Date | string;
  coverImageUrl?: string | null;
  coverImagePrompt?: string | null;
  layout?: string | null;
}

export function generateBroadsheetPages(
  issue: IssueInfo,
  allStories: Story[],
  dramaStories: Story[]
): React.ReactNode[] {
  const pages: React.ReactNode[] = [];

  const normalStories = allStories.filter(s => s.domain !== 'Drama' && s.domain !== 'Opportunities');
  const opportunityStories = allStories.filter(s => s.domain === 'Opportunities');

  // --- PAGE 1: Wide Landscape Cover Page ---
  pages.push(
    <div key="cover-page" className="flex flex-col justify-between h-full w-full border-2 border-primary p-3 bg-surface select-none overflow-hidden box-border">
      <div className="text-center w-full border-b-2 border-primary pb-2.5 shrink-0">
        <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant block mb-1 font-bold">
          Official Sunday Edition • Technology & Engineering
        </span>
        <h1 className="font-headline-xl text-3xl md:text-4xl lg:text-5xl text-center uppercase tracking-tight font-black">{issue.volume}</h1>
        <h2 className="font-headline-md text-base md:text-lg text-center uppercase text-on-surface-variant mt-0.5 font-bold">Issue #{issue.issueNumber}</h2>
      </div>

      <div className="flex-1 my-2 flex flex-col md:flex-row items-center gap-3 overflow-hidden">
        {issue.coverImageUrl ? (
          <div className="w-full md:w-3/5 h-full relative border-2 border-primary overflow-hidden shadow-lg halftone min-h-[150px]">
            <Image 
              src={issue.coverImageUrl} 
              alt="Issue Cover Art" 
              fill 
              className="object-cover" 
              unoptimized 
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/85 text-white p-2 text-center text-xs font-serif italic">
              {issue.coverImagePrompt || "The Weekly Technology Broadsheet"}
            </div>
          </div>
        ) : null}

        <div className="w-full md:w-2/5 flex flex-col justify-center border-2 border-dashed border-outline-variant p-3 text-justify hyphens-auto bg-surface-variant/10 h-full">
          <h3 className="font-headline-md text-base md:text-lg mb-1.5 font-bold text-center">AgeOfAI Broadsheet</h3>
          <p className="text-xs md:text-sm font-serif text-on-surface-variant leading-relaxed text-justify">
            Weekly broadsheet journalism for engineers and technologists. Verified editorial coverage across AI, web development, gaming, crypto, mobile, hardware, and student opportunities.
          </p>
        </div>
      </div>

      <div className="text-center w-full border-t-2 border-primary pt-2.5 shrink-0">
        <div className="font-label-caps text-xs uppercase border-2 border-primary px-3.5 py-1 inline-block font-bold">
          {new Date(issue.publishedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <p className="text-[11px] font-mono text-on-surface-variant uppercase mt-1.5">
          Verified Editorial • Multi-Source Ingestion Engine • Published Sundays
        </p>
      </div>
    </div>
  );

  // --- PAGE 2: Wide 2-Column Front Page Headlines ---
  const leadStories = normalStories.slice(0, 2);
  const remainingStories = normalStories.slice(2);

  if (leadStories.length > 0) {
    pages.push(
      <div key="front-page" className="flex flex-col h-full w-full overflow-hidden">
        <div className="border-b-2 border-primary pb-2 mb-2 text-center shrink-0">
          <h2 className="font-headline-md text-xl md:text-2xl uppercase tracking-wider font-bold">Front Page Headlines</h2>
          <span className="text-xs font-mono text-on-surface-variant uppercase">Top Engineering Developments</span>
        </div>
        <BroadsheetPageScroll className="flex-1 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {leadStories.map((story, idx) => (
              <StoryCard key={story.id} story={story} isLead={idx === 0} />
            ))}
          </div>
        </BroadsheetPageScroll>
      </div>
    );
  }

  // --- PAGES 3+: Reflowed Wide Landscape Domain Section Pages ---
  const domainSequence = domains.map(domain => domain.id).filter(domain => !['Campus', 'Drama', 'Opportunities'].includes(domain));

  const storiesByDomain: Record<string, Story[]> = {};
  remainingStories.forEach(story => {
    const domain = story.domain || 'General';
    if (!storiesByDomain[domain]) {
      storiesByDomain[domain] = [];
    }
    storiesByDomain[domain].push(story);
  });

  const orderedDomains = [
    ...domainSequence.filter(d => storiesByDomain[d] && storiesByDomain[d].length > 0),
    ...Object.keys(storiesByDomain).filter(d => !domainSequence.includes(d) && d !== 'Campus' && d !== 'Drama' && d !== 'Opportunities' && storiesByDomain[d].length > 0)
  ];

  orderedDomains.forEach((domain) => {
    const domainStories = storiesByDomain[domain];
    if (domainStories.length === 0) return;

    const severityRank: Record<string, number> = { major: 3, notable: 2, normal: 1 };
    domainStories.sort((a, b) => (severityRank[b.severity] || 1) - (severityRank[a.severity] || 1));

    const leadStory = domainStories[0];
    const inBriefStories = domainStories.slice(1, 5);
    const deeperLookStory = domainStories[5] || null;

    pages.push(
      <div key={`domain-section-${domain}`} className="flex flex-col h-full w-full overflow-hidden">
        <div className="border-b-2 border-primary pb-2 mb-2.5 flex justify-between items-center shrink-0">
          <h2 className="font-headline-md text-xl md:text-2xl uppercase tracking-wider font-bold">{domain}</h2>
          <span className="text-xs font-mono text-on-surface-variant uppercase">Section Front • This Edition</span>
        </div>

        <BroadsheetPageScroll className="flex-1 pr-1">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Left Column: Lead Story */}
            {leadStory && (
              <div className="w-full md:w-3/5 border-b md:border-b-0 md:border-r border-outline-variant pb-3 md:pb-0 md:pr-5">
                <StoryCard story={leadStory} isLead={true} />
              </div>
            )}

            {/* Right Column: In Brief & Deeper Look */}
            <div className="w-full md:w-2/5 space-y-3.5">
              {/* In Brief Sub-section */}
              {inBriefStories.length > 0 && (
                <section className="bg-surface-variant/15 p-3.5 rounded-md border border-outline-variant/60">
                  <h3 className="font-headline-md text-xs md:text-sm uppercase text-primary mb-2.5 tracking-widest flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                    In Brief — {domain} Round-up
                  </h3>
                  <div className="space-y-2.5">
                    {inBriefStories.map(story => (
                      <article key={story.id} className="border-b border-outline-variant/40 pb-2 last:border-b-0">
                        <h4 className="font-headline-md text-xs md:text-sm font-bold leading-snug hover:underline">
                          <a href={story.sourceUrl} target="_blank" rel="noreferrer">
                            {story.title}
                          </a>
                        </h4>
                        <p className="text-xs font-serif text-on-surface-variant line-clamp-2 mt-0.5 text-justify hyphens-auto">
                          {story.crux}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Deeper Look Sub-section */}
              {deeperLookStory && (
                <section className="p-3.5 border-2 border-primary bg-surface rounded-md shadow-sm">
                  <div className="text-[10px] font-mono uppercase bg-primary text-on-primary px-2 py-0.5 inline-block mb-1.5 font-bold tracking-widest">
                    Deeper Look: Technical Analysis
                  </div>
                  <h3 className="font-headline-md text-sm md:text-base leading-tight font-bold mb-1">
                    {deeperLookStory.title}
                  </h3>
                  <p className="text-xs font-serif leading-relaxed text-on-surface-variant mb-2.5 text-justify hyphens-auto">
                    {deeperLookStory.crux}
                  </p>
                  <a 
                    href={deeperLookStory.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-label-caps uppercase text-primary hover:underline font-bold"
                  >
                    Read Full Paper and Code
                  </a>
                </section>
              )}
            </div>
          </div>
        </BroadsheetPageScroll>
      </div>
    );
  });

  // --- Opportunities Page ---
  if (opportunityStories.length > 0) {
    pages.push(
      <div key="opportunities-page" className="flex flex-col h-full w-full overflow-hidden bg-emerald-950/5 border-2 border-emerald-600/40 p-2.5 rounded-md">
        <div className="border-b-2 border-emerald-600 pb-2 mb-2.5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-headline-md text-xl md:text-2xl uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold">
              Student Opportunities and Grants
            </h2>
            <p className="text-xs font-mono text-on-surface-variant uppercase mt-0.5">
              Hackathons, Internships, Fellowships & Free Cloud Credits
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-600 text-white px-3 py-1 rounded uppercase font-bold">
            Student Edition
          </span>
        </div>

        <BroadsheetPageScroll className="flex-1 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {opportunityStories.map(story => {
              const pubDateStr = story.publishedAt 
                ? new Date(story.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Recent';

              return (
                <article key={story.id} className="p-3 bg-surface border-2 border-emerald-600/25 rounded-md shadow-sm hover:border-emerald-600/50 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                        {story.severity === 'major' ? 'Featured Opportunity' : 'Opportunity'}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {pubDateStr}
                      </span>
                    </div>

                    <h3 className="font-headline-md text-sm md:text-base font-bold leading-tight mb-1.5 text-on-surface">
                      {story.title}
                    </h3>

                    <p className="text-xs font-serif text-on-surface-variant leading-relaxed mb-2.5 text-justify hyphens-auto">
                      {story.crux}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/40 mt-1">
                    <div className="flex gap-1 flex-wrap">
                      {story.tags.map(tag => (
                        <span key={tag.id} className="text-[9px] font-mono bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-label-caps uppercase text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Apply or learn more
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </BroadsheetPageScroll>
      </div>
    );
  }

  // --- Campus Page (Student-focused content) ---
  const campusStories = allStories.filter(s => s.domain === 'Campus');
  if (campusStories.length > 0) {
    pages.push(
      <div key="campus-page" className="flex flex-col h-full w-full overflow-hidden bg-blue-950/5 border-2 border-blue-600/40 p-2.5 rounded-md">
        <div className="border-b-2 border-blue-600 pb-2 mb-2.5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-headline-md text-xl md:text-2xl uppercase tracking-wider text-blue-800 dark:text-blue-300 font-bold">
              Campus and Student Edition
            </h2>
            <p className="text-xs font-mono text-on-surface-variant uppercase mt-0.5">
              Learning Resources, Student Opportunities and Career Guidance
            </p>
          </div>
          <span className="text-xs font-mono bg-blue-600 text-white px-3 py-1 rounded uppercase font-bold">
            Student Section
          </span>
        </div>

        <BroadsheetPageScroll className="flex-1 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {campusStories.map(story => {
              const pubDateStr = story.publishedAt 
                ? new Date(story.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Recent';

              return (
                <article key={story.id} className="p-3 bg-surface border-2 border-blue-600/25 rounded-md shadow-sm hover:border-blue-600/50 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/30">
                        {story.severity === 'major' ? 'Featured' : 'Campus'}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {pubDateStr}
                      </span>
                    </div>

                    <h3 className="font-headline-md text-sm md:text-base font-bold leading-tight mb-1.5 text-on-surface">
                      {story.title}
                    </h3>

                    <p className="text-xs font-serif text-on-surface-variant leading-relaxed mb-2.5 text-justify hyphens-auto">
                      {story.crux}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/40 mt-1">
                    <div className="flex gap-1 flex-wrap">
                      {story.tags.map(tag => (
                        <span key={tag.id} className="text-[9px] font-mono bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-label-caps uppercase text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Read more
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </BroadsheetPageScroll>
      </div>
    );
  }

  // --- FINAL PAGE: Back Page Drama ---
  if (dramaStories.length > 0) {
    pages.push(
      <div key="drama-back-page" className="flex flex-col h-full w-full overflow-hidden bg-neutral-950 text-neutral-100 p-2.5 rounded-md">
        <BroadsheetPageScroll className="flex-1 pr-1">
          <DramaSection stories={dramaStories} />
        </BroadsheetPageScroll>
      </div>
    );
  }

  return pages;
}
