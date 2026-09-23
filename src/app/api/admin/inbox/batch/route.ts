import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { addDraftedCandidatesToIssue, EditorialError } from '@/lib/editorial';
import { isDraftPreference, routeDraft } from '@/lib/draftRouting';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: unknown; candidateIds?: unknown; issueId?: unknown; modelPreference?: unknown };
    const action = typeof body.action === 'string' ? body.action : '';
    const candidateIds = Array.isArray(body.candidateIds)
      ? Array.from(new Set(body.candidateIds.filter((id): id is string => typeof id === 'string' && Boolean(id.trim()))))
      : [];
    if (!candidateIds.length || candidateIds.length > 30) {
      return NextResponse.json({ error: 'Select between 1 and 30 stories.' }, { status: 400 });
    }

    if (action === 'queue-draft') {
      const preference = isDraftPreference(body.modelPreference) ? body.modelPreference : 'auto';
      const selected = await prisma.ingestedCandidate.findMany({ where: { id: { in: candidateIds } } });
      if (selected.length !== candidateIds.length) return NextResponse.json({ error: 'One or more selected stories no longer exist. Refresh the inbox.' }, { status: 404 });
      const candidates = selected.filter(candidate => candidate.status === 'pending' || candidate.status === 'failed');
      if (!candidates.length) return NextResponse.json({ error: 'Select pending or failed stories to queue.' }, { status: 409 });
      const requestedAt = new Date();
      const decisions = candidates.map(candidate => ({ candidate, decision: routeDraft(candidate, preference) }));
      await prisma.$transaction(decisions.map(({ candidate, decision }) => prisma.ingestedCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'queued', draftJson: null, draftProvider: decision.provider, draftModel: decision.model,
          draftRoute: decision.route, draftReason: decision.reason, draftRequestedAt: requestedAt,
          draftStartedAt: null, draftCompletedAt: null, draftMetricsJson: null, draftError: null,
        },
      })));
      return NextResponse.json({
        queued: decisions.length,
        skipped: selected.length - candidates.length,
        routes: decisions.map(({ candidate, decision }) => ({ candidateId: candidate.id, ...decision })),
      });
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
