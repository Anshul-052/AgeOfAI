import Link from 'next/link';
import { notFound } from 'next/navigation';
import MagazineReader from '@/components/MagazineReader';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminIssuePreviewPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { stories: { include: { tags: true }, orderBy: { publishedAt: 'desc' } } },
  });
  if (!issue) notFound();

  return (
    <main className="publication-main">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-2 border-amber-700 bg-amber-50 px-4 py-3 text-amber-950">
        <div>
          <p className="font-label-caps text-xs font-bold uppercase tracking-widest">Admin-only preview</p>
          <p className="text-sm">This issue and its {issue.stories.length} stories remain private until you publish it.</p>
        </div>
        <Link href="/admin" className="border border-amber-900 px-3 py-2 font-label-caps text-xs font-bold uppercase hover:bg-amber-900 hover:text-white">Return to publishing controls</Link>
      </div>
      <MagazineReader issue={issue} stories={issue.stories} preview />
    </main>
  );
}
