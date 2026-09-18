import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IssuesArchivePage() {
  const issues = await prisma.issue.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, include: { _count: { select: { stories: true } } }, orderBy: { publishedAt: 'desc' } });
  return <main className="publication-main archive-main"><header className="archive-heading"><p className="eyebrow">The Sunday shelf</p><h1>Past editions.</h1><p>Return to the week a development happened, then follow its topic through the archive.</p></header>
    <div className="issue-grid">{issues.map(issue => <Link key={issue.id} href={`/issues/${issue.id}`} className="issue-card"><time>{new Date(issue.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time><h2>{issue.volume}<br/>Issue {issue.issueNumber}</h2><p>{issue._count.stories} stories</p><span>Open edition →</span></Link>)}</div>
    {!issues.length && <div className="edition-empty"><h2>The shelf is being prepared.</h2><p>The first published edition will appear here.</p></div>}
  </main>;
}
