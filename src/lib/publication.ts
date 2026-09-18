import type { Prisma } from '@prisma/client';

export function publicStories(): Prisma.StoryWhereInput {
  return { publishedAt: { lte: new Date() }, OR: [{ issueId: null }, { issue: { isPublished: true, publishedAt: { lte: new Date() } } }] };
}
