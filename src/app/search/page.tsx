import Link from 'next/link';
import StoryCard from '@/components/StoryCard';
import { prisma } from '@/lib/db';
import { publicStories } from '@/lib/publication';
import domains from '@/lib/domains.json';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; domain?: string; page?: string; period?: string; sort?: string }> }) {
  const query = await searchParams;
  const q = (query.q || '').trim().slice(0, 200);
  const domain = domains.some(d => d.id === query.domain) ? query.domain : '';
  const period = ['7', '30', '365'].includes(query.period || '') ? query.period! : '';
  const oldest = query.sort === 'oldest';
  const requested = Math.max(1, Math.min(100000, Number.parseInt(query.page || '1') || 1));
  const filters: Prisma.StoryWhereInput[] = [publicStories()];
  if (domain) filters.push({ domain });
  // This dynamic server route evaluates relative date filters once per request.
  // eslint-disable-next-line react-hooks/purity
  if (period) filters.push({ publishedAt: { gte: new Date(Date.now() - Number(period) * 86400000) } });
  if (q) filters.push({ OR: [{ title: { contains: q } }, { crux: { contains: q } }, { domain: { contains: q } }, { tags: { some: { name: { contains: q } } } }] });
  const where = { AND: filters };
  const count = await prisma.story.count({ where });
  const pages = Math.max(1, Math.ceil(count / 18));
  const page = Math.min(requested, pages);
  const stories = await prisma.story.findMany({ where, include: { tags: true }, orderBy: [{ publishedAt: oldest ? 'asc' : 'desc' }, { id: 'asc' }], skip: (page - 1) * 18, take: 18 });
  const pageUrl = (number: number) => '/search?' + new URLSearchParams({ q, domain: domain || '', period, sort: oldest ? 'oldest' : 'newest', page: String(number) }).toString();
  return <main className="publication-main archive-main">
    <header className="archive-heading"><p className="eyebrow">The permanent technology archive</p><h1>A story worth finding.</h1><p>Every published edition, every domain. Search beyond this week.</p></header>
    <form action="/search" className="archive-filters">
      <label className="search-field">Search<input type="search" name="q" defaultValue={q} placeholder="A topic, company, technology or question" /></label>
      <label>Domain<select name="domain" defaultValue={domain || ''}><option value="">All technology</option>{domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
      <label>Published<select name="period" defaultValue={period}><option value="">All time</option><option value="7">Past week</option><option value="30">Past month</option><option value="365">Past year</option></select></label>
      <label>Order<select name="sort" defaultValue={oldest ? 'oldest' : 'newest'}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button type="submit">Find stories</button>
    </form>
    <div className="section-rule"><h2>{q ? 'Results for “' + q + '”' : domain || 'Across technology'}</h2><span>{count} {count === 1 ? 'story' : 'stories'}</span></div>
    {stories.length ? <div className="archive-grid">{stories.map(story => <StoryCard key={story.id} story={story} />)}</div> : <div className="edition-empty"><h2>No matching stories yet.</h2><p>Try a broader term or choose all time.</p><Link href="/search">Clear filters</Link></div>}
    <nav className="archive-pagination" aria-label="Archive pages">{page > 1 ? <Link href={pageUrl(page - 1)}>← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link href={pageUrl(page + 1)}>Next →</Link> : <span />}</nav>
  </main>;
}
