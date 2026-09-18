import { prisma } from '@/lib/db';
import StoryCard from '@/components/StoryCard';
import Link from 'next/link';
import { publicStories } from '@/lib/publication';
export const dynamic = 'force-dynamic';

export default async function TopicPage({ params, searchParams }: { params: Promise<{ tag: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ tag }, query] = await Promise.all([params, searchParams]);
  const where = { AND: [publicStories(), { OR: [{ domain: tag }, { tags: { some: { name: tag } } }] }] };
  const count = await prisma.story.count({ where });
  const pages = Math.max(1, Math.ceil(count / 18));
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page || '1') || 1));
  const stories = await prisma.story.findMany({ where, include: { tags: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * 18, take: 18 });
  return <main className="publication-main archive-main"><header className="archive-heading"><p className="eyebrow">Permanent topic archive · {count} stories</p><h1>{tag}</h1><p>Reporting and developments from every published edition.</p></header>
    {stories.length ? <div className="archive-grid">{stories.map(story => <StoryCard key={story.id} story={story} />)}</div> : <div className="edition-empty"><h2>Coverage starts here.</h2><p>No stories have been published in this section yet.</p><Link href="/search">Explore all technology</Link></div>}
    <nav className="archive-pagination" aria-label="Topic pages">{page > 1 ? <Link href={'?page=' + (page - 1)}>← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link href={'?page=' + (page + 1)}>Next →</Link> : <span />}</nav></main>;
}
