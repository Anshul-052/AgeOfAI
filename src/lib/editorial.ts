import type { PrismaClient } from '@prisma/client';
import domains from '@/lib/domains.json';

const DOMAINS = domains.map(domain => domain.id);

export class EditorialError extends Error {
  constructor(message: string, public status: number) { super(message); }
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
    if (!issue || !issue.isPublished || issue.publishedAt > new Date()) {
      throw new EditorialError('Choose an existing published issue.', 400);
    }
    // Claim and create atomically so repeated approval cannot publish duplicate stories.
    const claimed = await tx.ingestedCandidate.updateMany({
      where: { id: candidateId, status: 'drafted' }, data: { status: 'published' },
    });
    if (claimed.count !== 1) throw new EditorialError('This candidate has already been processed.', 409);
    return tx.story.create({
      data: {
        title, crux, domain, severity, issueId, sourceUrl: candidate.sourceUrl,
        publishedAt: new Date(),
        tags: { connectOrCreate: tags.map(name => ({ where: { name }, create: { name } })) },
      },
      include: { tags: true },
    });
  });
}
