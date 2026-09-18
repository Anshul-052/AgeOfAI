"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';
import TagChip from "./TagChip";
import VideoEmbed from "./VideoEmbed";
import ExplainModal from "./ExplainModal";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

export interface Story {
  id: string;
  title: string;
  crux: string;
  sourceUrl: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  domain: string;
  tags: { id: string; name: string }[];
  severity: string;
  publishedAt?: Date | string;
  evidenceJson?: string | null;
  verificationStatus?: string;
}

interface StoryCardProps {
  story: Story;
  isLead?: boolean;
}

export default function StoryCard({ story, isLead = false }: StoryCardProps) {
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isBookmarked(story.id));
    sync();
    window.addEventListener('bookmarks-changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('bookmarks-changed', sync); window.removeEventListener('storage', sync); };
  }, [story.id]);

  const handleBookmarkToggle = () => {
    const newState = toggleBookmark(story);
    setSaved(newState);
  };

  return (
    <>
      <article className="story-card border-b border-outline-variant/60 pb-4 mb-4">
        <header className="mb-3">
          {story.severity === "major" && (
            <div className="text-error font-label-caps uppercase font-bold tracking-widest text-[11px] mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error inline-block animate-pulse"></span>
              Major development
            </div>
          )}
          <h2 className={`font-headline-xl font-black leading-tight mb-2 ${
            isLead 
              ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight' 
              : 'text-lg sm:text-xl md:text-2xl tracking-normal'
          }`}>
            <Link href={`/stories/${story.id}`} className="hover:underline">{story.title}</Link>
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 text-on-surface-variant font-label-caps italic uppercase text-xs">
            <span className="font-bold text-primary">{story.domain}</span>
            {story.publishedAt && <time dateTime={new Date(story.publishedAt).toISOString()}>{new Date(story.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time>}
            {story.verificationStatus === 'source-checked' && <span>AI source-checked</span>}
            <span className="w-1 h-1 bg-on-surface-variant rounded-full"></span>
            <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
              Original Source ↗
            </a>
          </div>
        </header>
        
        {story.imageUrl && !story.videoUrl && (
          <div className="mb-4 w-full h-[180px] sm:h-[240px] md:h-[300px] bg-secondary-container halftone overflow-hidden relative border-2 border-primary shadow-md">
            <Image className="w-full h-full object-cover" src={story.imageUrl} alt={story.title} width={800} height={300} unoptimized />
          </div>
        )}

        {story.videoUrl && (
          <div className="mb-4">
            <VideoEmbed url={story.videoUrl} />
          </div>
        )}

        <div className={`story-copy ${isLead ? 'drop-cap' : ''} mb-3 font-serif leading-relaxed text-on-surface`}>
          {story.crux.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-2.5 border-t border-outline-variant/40">
          <div className="flex flex-wrap gap-1.5">
            {story.tags.map(tag => (
              <TagChip key={tag.id} name={tag.name} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExplainOpen(true)}
              className="text-xs font-label-caps uppercase border border-primary/50 px-3 py-1 bg-surface-variant/40 hover:bg-primary hover:text-on-primary rounded transition-colors flex items-center gap-1 font-bold"
            >
              🎓 Ask Engineer
            </button>
            <button
              onClick={handleBookmarkToggle}
              aria-pressed={saved}
              className={`text-xs font-label-caps uppercase px-3 py-1 border rounded transition-colors font-bold ${
                saved 
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50' 
                  : 'border-outline-variant hover:bg-surface-variant'
              }`}
            >
              {saved ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
          </div>
        </div>
      </article>

      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        storyTitle={story.title}
        storyCrux={story.crux}
        domain={story.domain}
      />
    </>
  );
}
