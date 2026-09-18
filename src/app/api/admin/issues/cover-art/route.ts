import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateIssueCoverArt } from '@/lib/image-gen';

export async function POST(request: Request) {
  try {
    const { issueId } = await request.json();

    if (!issueId) {
      return NextResponse.json({ error: 'issueId is required' }, { status: 400 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { stories: true }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const leadHeadline = issue.stories[0]?.title || `AgeOfAI ${issue.volume} Issue #${issue.issueNumber}`;
    const { imageUrl } = await generateIssueCoverArt(leadHeadline);

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        coverImageUrl: imageUrl,
        coverImagePrompt: leadHeadline
      }
    });

    return NextResponse.json({ issue: updatedIssue, imageUrl });
  } catch (error) {
    console.error('Cover art API error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cover art generation failed' }, { status: 500 });
  }
}
