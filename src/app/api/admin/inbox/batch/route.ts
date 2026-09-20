import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { draftStoryWithGemini } from '@/lib/gemini';
import { addDraftedCandidatesToIssue, EditorialError } from '@/lib/editorial';
import { buildDraftingSource } from '@/lib/sourceContent';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: unknown; candidateIds?: unknown; issueId?: unknown };
    const action = typeof body.action === 'string' ? body.action : '';
    const candidateIds = Array.isArray(body.candidateIds)
      ? Array.from(new Set(body.candidateIds.filter((id): id is string => typeof id === 'string' && Boolean(id.trim()))))
      : [];
    if (!candidateIds.length || candidateIds.length > 30) {
      return NextResponse.json({ error: 'Select between 1 and 30 stories.' }, { status: 400 });
    }

    if (action === 'draft') {
      const candidates = await prisma.ingestedCandidate.findMany({ where: { id: { in: candidateIds }, status: 'pending' } });
      if (candidates.length !== candidateIds.length) return NextResponse.json({ error: 'Every selected story must still be pending.' }, { status: 409 });
      const results = [];
      for (const candidate of candidates) {
        const source = await buildDraftingSource(candidate.rawTitle, candidate.rawContent, candidate.sourceUrl);
        const { draft, usage } = await draftStoryWithGemini(source, candidate.suggestedDomain || undefined);
        const updated = await prisma.ingestedCandidate.updateMany({
          where: { id: candidate.id, status: 'pending' },
          data: { status: 'drafted', draftJson: JSON.stringify(draft) },
        });
        if (updated.count !== 1) throw new EditorialError(`"${candidate.rawTitle}" changed while drafting.`, 409);
        results.push({ candidateId: candidate.id, usage });
      }
      return NextResponse.json({ drafted: results.length, results });
    }

    if (action === 'add-to-issue') {
      const issueId = typeof body.issueId === 'string' ? body.issueId : '';
      const stories = await addDraftedCandidatesToIssue(prisma, candidateIds, issueId);
      for (const path of ['/', '/issues', `/issues/${issueId}`, '/admin', '/search']) revalidatePath(path);
      return NextResponse.json({ added: stories.length, stories }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unknown batch action.' }, { status: 400 });
  } catch (error) {
    if (error instanceof EditorialError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    console.error('Batch editorial action failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Batch action failed.' }, { status: 500 });
  }
}
