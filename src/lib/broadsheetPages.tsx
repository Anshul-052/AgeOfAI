import React from 'react';
import Image from 'next/image';
import type { Story } from '@/components/StoryCard';
import BroadsheetPageScroll from '@/components/BroadsheetPageScroll';

interface IssueInfo {
  volume: string;
  issueNumber: number;
  publishedAt: Date | string;
  coverImageUrl?: string | null;
  coverImagePrompt?: string | null;
  layout?: string | null;
}

const severityRank: Record<string, number> = { major: 3, notable: 2, normal: 1 };

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function paginateStories(stories: Story[]) {
  const pages: Story[][] = [];
  let page: Story[] = [];
  let pageWeight = 0;

  for (const story of stories) {
    // Artwork needs real vertical room. Count it during pagination so image
    // cards do not make a page visually collide even before its own scroll.
    const storyWeight = wordCount(story.crux) + Math.ceil(wordCount(story.title) * 1.8) + 28 + (story.imageUrl ? 190 : 0);
    if (page.length && (page.length >= 4 || pageWeight + storyWeight > 620)) {
      pages.push(page);
      page = [];
      pageWeight = 0;
    }
    page.push(story);
    pageWeight += storyWeight;
  }
  if (page.length) pages.push(page);
  return pages;
}

function DenseStory({ story, wide = false }: { story: Story; wide?: boolean }) {
  const paragraphs = story.crux.split(/\n\s*\n/).filter(Boolean);
  return (
    <article className={`min-w-0 overflow-x-hidden border border-outline-variant/70 border-t-2 border-t-primary bg-surface px-3 py-3 break-inside-avoid ${wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span className="min-w-0 break-words text-primary">{story.domain}</span>
        <span className="text-right">{story.severity === 'major' ? 'Major development' : story.severity}</span>
      </div>
      <h3 className={`${wide ? 'text-xl md:text-2xl' : 'text-base md:text-xl'} font-headline-md font-black leading-[1.12] break-words [overflow-wrap:anywhere]`}>
        {story.title}
      </h3>
      {story.imageUrl && !story.videoUrl && (
        <figure className={`relative mt-3 w-full overflow-hidden border border-primary/70 bg-secondary-container ${wide ? 'aspect-[2/1] max-h-64' : 'aspect-[16/9] max-h-52'}`}>
          <Image src={story.imageUrl} alt="" fill sizes={wide ? "(min-width: 1024px) 45vw, 90vw" : "(min-width: 1024px) 22vw, 90vw"} className="object-cover" unoptimized />
        </figure>
      )}
      <div className={`mt-3 min-w-0 break-words text-left text-sm md:text-[15px] font-serif leading-[1.52] hyphens-auto [overflow-wrap:anywhere] ${wide ? 'md:columns-2 md:gap-8' : ''}`}>
        {paragraphs.map((paragraph, index) => <p key={index} className={index ? 'mt-2' : ''}>{paragraph}</p>)}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2 border-t border-outline-variant/60 pt-1.5">
        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono uppercase text-on-surface-variant">
          {story.tags.slice(0, 4).map(tag => <span key={tag.id} className="break-words">#{tag.name}</span>)}
        </div>
        <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] font-bold uppercase text-primary hover:underline">Source</a>
      </div>
    </article>
  );
}

export function generateBroadsheetPages(
  issue: IssueInfo,
  allStories: Story[],
  dramaStories: Story[]
): React.ReactNode[] {
  const ordered = [...allStories, ...dramaStories].sort((a, b) =>
    (severityRank[b.severity] || 1) - (severityRank[a.severity] || 1) ||
    new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  );
  const lead = ordered[0];
  const storyPages = paginateStories(ordered);
  const issueDate = new Date(issue.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const pages: React.ReactNode[] = [];

  pages.push(
    <div key="cover-page" className="flex h-full w-full flex-col overflow-hidden border-2 border-primary bg-surface p-4 box-border">
      <header className="shrink-0 border-b-4 border-double border-primary pb-3 text-center">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[.2em] text-on-surface-variant">The weekly technology edition</span>
        <h1 className="mt-1 font-headline-xl text-4xl md:text-5xl font-black uppercase tracking-tight">{issue.volume}</h1>
        <p className="font-headline-md text-sm font-bold uppercase tracking-widest text-on-surface-variant">Issue {issue.issueNumber} · {issueDate}</p>
      </header>

      <BroadsheetPageScroll className="min-h-0 flex-1">
      <div className="grid min-h-full grid-cols-5 gap-4 py-4">
        <section className="col-span-3 flex min-h-[32rem] flex-col border-r border-outline-variant pr-4">
          {issue.coverImageUrl ? (
            <div className="relative min-h-0 flex-1 overflow-hidden border border-primary halftone">
              <Image src={issue.coverImageUrl} alt="Issue cover" fill className="object-cover" unoptimized />
              <div className="absolute inset-x-0 bottom-0 bg-black/85 p-2 text-center text-xs font-serif text-white">{issue.coverImagePrompt || lead?.title}</div>
            </div>
          ) : lead ? (
            <div className="flex h-full flex-col justify-center">
              <p className="eyebrow">Lead report · {lead.domain}</p>
              <h2 className="mt-2 font-headline-xl text-3xl md:text-4xl font-black leading-[.98] text-balance">{lead.title}</h2>
              <div className="mt-4 font-serif text-sm leading-relaxed text-justify hyphens-auto">
                {lead.crux.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className={index ? 'mt-2' : ''}>{paragraph}</p>)}
              </div>
            </div>
          ) : <div className="grid h-full place-items-center font-headline-xl text-3xl">Edition in preparation</div>}
        </section>

        <aside className="col-span-2 min-w-0">
          <p className="border-b-2 border-primary pb-1 font-label-caps text-xs font-bold uppercase tracking-widest">Inside this issue</p>
          <div className="divide-y divide-outline-variant">
            {ordered.slice(issue.coverImageUrl ? 0 : 1, issue.coverImageUrl ? 6 : 7).map((story, index) => (
              <div key={story.id} className="py-2.5">
                <span className="font-mono text-[9px] font-bold uppercase text-primary">{story.domain}</span>
                <h3 className="font-headline-md text-sm md:text-base font-bold leading-tight">{story.title}</h3>
                {index < 2 && <p className="mt-1 line-clamp-2 text-[11px] font-serif leading-snug text-on-surface-variant">{story.crux}</p>}
              </div>
            ))}
          </div>
        </aside>
      </div>
      </BroadsheetPageScroll>

      <footer className="flex shrink-0 items-center justify-between border-t-4 border-double border-primary pt-2 font-mono text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span>AgeOfAI · Verified editorial</span><span>{ordered.length} stories across technology</span>
      </footer>
    </div>
  );

  storyPages.forEach((stories, index) => {
    const domains = Array.from(new Set(stories.map(story => story.domain)));
    const pageTitle = domains.length === 1 ? domains[0] : index === 0 ? 'The Essential Read' : 'Across Technology';
    pages.push(
      <div key={`story-page-${index}`} className="flex h-full w-full flex-col overflow-hidden bg-surface p-1 box-border">
        <header className="mb-3 flex shrink-0 items-end justify-between gap-4 border-b-4 border-double border-primary pb-2">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">{issue.volume} · Issue {issue.issueNumber}</p>
            <h2 className="font-headline-xl text-2xl md:text-3xl font-black leading-none">{pageTitle}</h2>
          </div>
          <p className="max-w-[48%] break-words text-right font-mono text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{domains.join(' · ')}</p>
        </header>

        <BroadsheetPageScroll className="min-h-0 flex-1 pr-2">
          <div className={`grid content-start gap-4 ${stories.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {stories.map(story => <DenseStory key={story.id} story={story} wide={stories.length === 1} />)}
          </div>
        </BroadsheetPageScroll>

        <footer className="mt-2 flex shrink-0 items-center justify-between border-t border-primary pt-1 font-mono text-[9px] font-bold uppercase text-on-surface-variant">
          <span>AgeOfAI · Read across technology</span><span>{index + 2}</span>
        </footer>
      </div>
    );
  });

  return pages;
}
