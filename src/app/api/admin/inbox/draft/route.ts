import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { draftStoryWithGemini } from '@/lib/gemini';
import { buildDraftingSource } from '@/lib/sourceContent';

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = await prisma.ingestedCandidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending candidates can be drafted.' }, { status: 409 });
    }
    const source = await buildDraftingSource(candidate.rawTitle, candidate.rawContent, candidate.sourceUrl);
    const { draft, usage } = await draftStoryWithGemini(source, candidate.suggestedDomain || undefined);

    const updated = await prisma.ingestedCandidate.updateMany({
      where: { id: candidateId, status: 'pending' },
      data: {
        status: 'drafted',
        draftJson: JSON.stringify(draft)
      }
    });

    if (updated.count !== 1) {
      return NextResponse.json({ error: 'Candidate status changed. Refresh the inbox.' }, { status: 409 });
    }
    const updatedCandidate = await prisma.ingestedCandidate.findUnique({ where: { id: candidateId } });
    return NextResponse.json({
      candidate: updatedCandidate,
      draft,
      usage,
      isCacheHit: usage.isCacheHit
    });
  } catch (error) {
    console.error('Candidate draft error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Drafting failed' }, { status: 500 });
  }
}
