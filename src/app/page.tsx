import { prisma } from '@/lib/db';
import MagazineReader from '@/components/MagazineReader';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const issue = await prisma.issue.findFirst({
    where: { isPublished: true, publishedAt: { lte: new Date() }, stories: { some: {} } },
    orderBy: { publishedAt: 'desc' },
    include: { stories: { include: { tags: true }, orderBy: { publishedAt: 'desc' } } },
  });
  return <main className="publication-main">{issue ? <MagazineReader issue={issue} stories={issue.stories} /> : <div className="edition-empty"><p className="eyebrow">AgeOfAI</p><h1>The next edition is taking shape.</h1><p>Explore the technology archive while we prepare the weekly edition.</p><Link href="/search">Browse all stories</Link></div>}</main>;
}
