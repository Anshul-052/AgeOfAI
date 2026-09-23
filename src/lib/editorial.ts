import type { Prisma, PrismaClient } from '@prisma/client';
import domains from '@/lib/domains.json';
import type { DraftStoryResult } from '@/lib/gemini';

const DOMAINS = domains.map(domain => domain.id);

export class EditorialError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function createReviewedStory(
  tx: Prisma.TransactionClient,
  data: Prisma.StoryUncheckedCreateInput,
  tags: { id: string }[],
) {
  // Create the story first, then connect tags. This guarantees the story row
  // exists before Prisma writes to the implicit _StoryToTag relation table.
  const story = await tx.story.create({ data });
  return tx.story.update({
    where: { id: story.id },
    data: tags.length ? { tags: { connect: tags.map(tag => ({ id: tag.id })) } } : {},
    include: { tags: true },
  });
}

async function ensureTags(tx: Prisma.TransactionClient, names: string[]) {
  const uniqueNames = Array.from(new Set(names));
  if (!uniqueNames.length) return [];

  const tags = await tx.tag.findMany({ where: { name: { in: uniqueNames } } });
  const existingNames = new Set(tags.map(tag => tag.name));
  for (const name of uniqueNames) {
    if (!existingNames.has(name)) {
      tags.push(await tx.tag.upsert({ where: { name }, update: {}, create: { name } }));
    }
  }
  return tags;
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
    const reviewedTags = await ensureTags(tx, tags);
    return createReviewedStory(tx, {
      title, crux, domain, severity, issueId, sourceUrl: candidate.sourceUrl,
      publishedAt: new Date(), verificationStatus: 'editor-reviewed',
    }, reviewedTags);
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

    const reviewedCandidates = candidates.map(candidate => {
      let draft: DraftStoryResult;
      try { draft = JSON.parse(candidate.draftJson!) as DraftStoryResult; }
      catch { throw new EditorialError(`The draft for "${candidate.rawTitle}" is invalid.`, 400); }
      if (!draft.crux?.trim()) throw new EditorialError(`The draft for "${candidate.rawTitle}" is empty.`, 400);
      const domain = DOMAINS.includes(draft.domain) ? draft.domain : candidate.suggestedDomain || 'Research';
      const severity = ['normal', 'notable', 'major'].includes(draft.severity) ? draft.severity : 'normal';
      const tags = Array.from(new Set((draft.tags || []).map(tag => tag.trim()).filter(Boolean))).slice(0, 8);
      return { candidate, draft, domain, severity, tags };
    });

    // Resolve shared tags once for the whole batch instead of repeating up to
    // eight tag queries for every story. This keeps a 30-story transaction short.
    const allTags = await ensureTags(tx, reviewedCandidates.flatMap(item => item.tags));
    const tagsByName = new Map(allTags.map(tag => [tag.name, tag]));
    const stories = [];
    for (const { candidate, draft, domain, severity, tags } of reviewedCandidates) {
      stories.push(await createReviewedStory(tx, {
        title: candidate.rawTitle.trim(), crux: draft.crux.trim(), domain, severity,
        issueId, sourceUrl: candidate.sourceUrl, publishedAt: new Date(), verificationStatus: 'editor-reviewed',
      }, tags.flatMap(name => {
        const tag = tagsByName.get(name);
        return tag ? [tag] : [];
      })));
    }
    const claimed = await tx.ingestedCandidate.updateMany({ where: { id: { in: ids }, status: 'drafted' }, data: { status: 'published' } });
    if (claimed.count !== ids.length) throw new EditorialError('A selected candidate changed during publication. Refresh and retry.', 409);
    return stories;
  }, {
    maxWait: 10_000,
    timeout: 45_000,
  });
}
