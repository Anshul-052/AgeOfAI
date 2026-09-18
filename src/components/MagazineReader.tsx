"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoryCard, { Story } from './StoryCard';
import FlipBook from './FlipBook';
import domains from '@/lib/domains.json';
import { generateBroadsheetPages } from '@/lib/broadsheetPages';

interface Edition { id: string; volume: string; issueNumber: number; publishedAt: Date | string; layout?: string; coverImageUrl?: string | null; coverImagePrompt?: string | null }

export default function MagazineReader({ issue, stories }: { issue: Edition; stories: Story[] }) {
  const [section, setSection] = useState('Front page');
  const [spread, setSpread] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const update = () => { setCanAnimate(query.matches); if (!query.matches) setSpread(false); };
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const rank: Record<string, number> = { major: 3, notable: 2, normal: 1 };
  const frontPriority: Record<string, number> = { LLMs: 5, Cybersecurity: 5, Research: 5, 'Cloud & DevOps': 4, 'Data & Databases': 4, Hardware: 4, Robotics: 4, Tools: 3, 'Web Development': 3, Mobile: 3, 'Opportunities': -2, Campus: -2 };
  const ordered = [...stories].sort((a, b) => ((rank[b.severity] || 0) * 10 + (frontPriority[b.domain] || 0)) - ((rank[a.severity] || 0) * 10 + (frontPriority[a.domain] || 0)) || new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  const frontStories = ordered.filter(s => s.domain !== 'Drama').slice(0, 8);
  const visible = section === 'Front page' ? frontStories : ordered.filter(s => s.domain === section);
  const active = domains.filter(d => stories.some(s => s.domain === d.id));
  const selectSection = (value: string) => { setSection(value); setSpread(false); };
  return <div className="edition-shell">
    <div className="edition-dateline"><span>{issue.volume} / No. {String(issue.issueNumber).padStart(2, '0')}</span><time dateTime={new Date(issue.publishedAt).toISOString()}>{new Date(issue.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time><span>{stories.length} stories · {active.length} sections</span></div>
    <div className="edition-heading"><div><p className="eyebrow">The weekly technology edition</p><h1>This week, in perspective.</h1><p>Read across technology. Save what matters. Find it again.</p></div><div className="edition-actions"><Link href="/search">Explore the archive</Link>{canAnimate && <button onClick={() => setSpread(!spread)} aria-pressed={spread}>{spread ? 'Reading view' : 'Page-turn view'}</button>}</div></div>
    <div className="mobile-section-select"><label htmlFor="edition-section">Jump to a section</label><select id="edition-section" value={section} onChange={e => selectSection(e.target.value)}><option>Front page</option>{domains.map(d => <option key={d.id} value={d.id}>{d.label} ({stories.filter(s => s.domain === d.id).length})</option>)}</select></div>
    {spread && canAnimate ? <FlipBook layout={issue.layout}>{generateBroadsheetPages(issue, stories.filter(s => s.domain !== 'Drama'), stories.filter(s => s.domain === 'Drama'))}</FlipBook> : <div className="edition-layout">
      <aside className="edition-index"><p className="eyebrow">In this edition</p><nav aria-label="Edition sections"><button aria-current={section === 'Front page' ? 'page' : undefined} onClick={() => selectSection('Front page')}>Front page <span>{frontStories.length}</span></button>{domains.map(d => <button key={d.id} aria-current={section === d.id ? 'page' : undefined} onClick={() => selectSection(d.id)}>{d.label}<span>{stories.filter(s => s.domain === d.id).length || '—'}</span></button>)}</nav><Link className="index-archive" href="/search">Browse all past coverage</Link></aside>
      <section className="edition-stories" aria-label={section}>
        <div className="section-rule"><h2>{section === 'Front page' ? 'The essential read' : domains.find(d => d.id === section)?.label || section}</h2><span>{visible.length} stories</span></div>
        {visible.length ? <div key={section} className="story-grid reading-enter">{visible.map((story, index) => <div className={index === 0 ? 'story-lead' : ''} key={story.id}><StoryCard story={story} isLead={index === 0} /></div>)}</div> : <div className="edition-empty"><h3>No stories in this section this week.</h3><p>Browse the permanent archive for earlier coverage.</p><Link href={`/search?domain=${encodeURIComponent(section)}`}>Explore {section}</Link></div>}
      </section>
    </div>}
  </div>;
}
