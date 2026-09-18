import { prisma } from '@/lib/db';
import MagazineReader from '@/components/MagazineReader';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function IssuePage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, isPublished: true, publishedAt: { lte: new Date() } },
    include: { stories: { include: { tags: true }, orderBy: { publishedAt: 'desc' } } },
  });
  if (!issue) notFound();
  return <main className="publication-main"><MagazineReader issue={issue} stories={issue.stories} /></main>;
}
