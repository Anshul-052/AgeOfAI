import { prisma } from '@/lib/db';
import { publicStories } from '@/lib/publication';
import StoryCard from '@/components/StoryCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
type Evidence = { sources?: { id: string; title: string; url: string; publisher?: string }[]; checkedAt?: string; limitations?: string[] };

export default async function StoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const story = await prisma.story.findFirst({ where: { AND: [{ id: storyId }, publicStories()] }, include: { tags: true, issue: true } });
  if (!story) notFound();
  let evidence: Evidence = {};
  try { evidence = JSON.parse(story.evidenceJson || '{}'); } catch { /* Older articles have no structured evidence. */ }
  return <main className="publication-main article-main"><Link className="eyebrow" href="/search">← The story archive</Link><StoryCard story={story} isLead />
    {story.issue && <p className="article-edition">From <Link href={`/issues/${story.issue.id}`}>{story.issue.volume} · Issue {story.issue.issueNumber}</Link></p>}
    <section className="source-notes"><p className="eyebrow">The reporting record</p><h2>Sources & context</h2><p>{story.verificationStatus === 'source-checked' ? 'An AI editor compared this report with retrieved sources. Source checks reduce errors; they do not guarantee accuracy.' : 'This archive story predates automated source checks. Read the original reporting for context.'}</p>
      <ul>{(evidence.sources || [{ id: 'original', title: 'Original reporting', url: story.sourceUrl }]).filter(source => /^https?:\/\//i.test(source.url)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>{source.publisher && <span> · {source.publisher}</span>}</li>)}</ul>
      {evidence.checkedAt && <p>Checked {new Date(evidence.checkedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>}
      {evidence.limitations?.map((note, index) => <p key={index}>{note}</p>)}
    </section></main>;
}
