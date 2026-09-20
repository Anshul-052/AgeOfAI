import type { PrismaClient } from '@prisma/client';
import domains from '@/lib/domains.json';
import type { DraftStoryResult } from '@/lib/gemini';

const DOMAINS = domains.map(domain => domain.id);

export class EditorialError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function publishIssue(db: PrismaClient, issueId: string) {
  if (!issueId.trim()) throw new EditorialError('issueId is required.', 400);
  return db.$transaction(async tx => {
    const draft = await tx.issue.findUnique({
      where: { id: issueId },
      include: { _count: { select: { stories: true } } },
    });
    if (!draft) throw new EditorialError('Issue not found.', 404);
    if (draft.isPublished) throw new EditorialError('This issue is already published.', 409);
    if (draft._count.stories === 0) throw new EditorialError('An empty issue cannot be published.', 400);
    const claimed = await tx.issue.updateMany({
      where: { id: issueId, isPublished: false },
      data: { isPublished: true, publishedAt: new Date() },
    });
    if (claimed.count !== 1) throw new EditorialError('The issue publication state changed. Refresh and try again.', 409);
    return tx.issue.findUniqueOrThrow({ where: { id: issueId } });
  });
}

export async function approveCandidate(db: PrismaClient, input: unknown) {
  if (!input || typeof input !== 'object') throw new EditorialError('Review details are required.', 400);
  const data = input as Record<string, unknown>;
  const requiredText = (key: string, max: number) => {
    const value = data[key];
    if (typeof value !== 'string' || !value.trim() || value.length > max) {
      throw new EditorialError(`${key} is required and must be at most ${max} characters.`, 400);
    }
    return value.trim();
  };
  const candidateId = requiredText('candidateId', 200);
  const issueId = requiredText('issueId', 200);
  const title = requiredText('title', 500);
  const crux = requiredText('crux', 20000);
  const domain = requiredText('domain', 100);
  const severity = requiredText('severity', 20);
  if (!DOMAINS.includes(domain) || !['normal', 'notable', 'major'].includes(severity)) {
    throw new EditorialError('Choose a valid domain and severity.', 400);
  }
  const rawTags = typeof data.tags === 'string' ? data.tags.split(',') : data.tags ?? [];
  if (!Array.isArray(rawTags) || rawTags.length > 30 || rawTags.some(t => typeof t !== 'string' || t.length > 80)) {
    throw new EditorialError('Provide at most 30 tags, each up to 80 characters.', 400);
  }
  const tags = Array.from(new Set((rawTags as string[]).map(t => t.trim()).filter(Boolean)));
  return db.$transaction(async tx => {
    const candidate = await tx.ingestedCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new EditorialError('Candidate not found.', 404);
    if (candidate.status !== 'drafted') throw new EditorialError('Only a drafted candidate can be approved. Refresh the inbox.', 409);
    const issue = await tx.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new EditorialError('Choose an existing issue.', 400);
    // Claim and create atomically so repeated approval cannot add duplicate stories.
    const claimed = await tx.ingestedCandidate.updateMany({
      where: { id: candidateId, status: 'drafted' }, data: { status: 'published' },
    });
    if (claimed.count !== 1) throw new EditorialError('This candidate has already been processed.', 409);
    return tx.story.create({
      data: {
        title, crux, domain, severity, issueId, sourceUrl: candidate.sourceUrl,
        publishedAt: new Date(), verificationStatus: 'editor-reviewed',
        tags: { connectOrCreate: tags.map(name => ({ where: { name }, create: { name } })) },
      },
      include: { tags: true },
    });
  });
}

export async function addDraftedCandidatesToIssue(db: PrismaClient, candidateIds: string[], issueId: string) {
  const ids = Array.from(new Set(candidateIds.map(id => id.trim()).filter(Boolean)));
  if (!issueId.trim()) throw new EditorialError('Choose an issue.', 400);
  if (!ids.length || ids.length > 30) throw new EditorialError('Select between 1 and 30 drafted stories.', 400);

  return db.$transaction(async tx => {
    const issue = await tx.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new EditorialError('Choose an existing issue.', 400);
    const candidates = await tx.ingestedCandidate.findMany({ where: { id: { in: ids } } });
    if (candidates.length !== ids.length) throw new EditorialError('One or more selected candidates no longer exist.', 404);
    if (candidates.some(candidate => candidate.status !== 'drafted' || !candidate.draftJson)) {
      throw new EditorialError('Every selected story must have a completed draft.', 409);
    }

    const stories = [];
    for (const candidate of candidates) {
      let draft: DraftStoryResult;
      try { draft = JSON.parse(candidate.draftJson!) as DraftStoryResult; }
      catch { throw new EditorialError(`The draft for "${candidate.rawTitle}" is invalid.`, 400); }
      if (!draft.crux?.trim()) throw new EditorialError(`The draft for "${candidate.rawTitle}" is empty.`, 400);
      const domain = DOMAINS.includes(draft.domain) ? draft.domain : candidate.suggestedDomain || 'Research';
      const severity = ['normal', 'notable', 'major'].includes(draft.severity) ? draft.severity : 'normal';
      const tags = Array.from(new Set((draft.tags || []).map(tag => tag.trim()).filter(Boolean))).slice(0, 8);
      stories.push(await tx.story.create({
        data: {
          title: candidate.rawTitle.trim(), crux: draft.crux.trim(), domain, severity,
          issueId, sourceUrl: candidate.sourceUrl, publishedAt: new Date(), verificationStatus: 'editor-reviewed',
          tags: { connectOrCreate: tags.map(name => ({ where: { name }, create: { name } })) },
        },
        include: { tags: true },
      }));
    }
    const claimed = await tx.ingestedCandidate.updateMany({ where: { id: { in: ids }, status: 'drafted' }, data: { status: 'published' } });
    if (claimed.count !== ids.length) throw new EditorialError('A selected candidate changed during publication. Refresh and retry.', 409);
    return stories;
  });
}
