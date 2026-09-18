import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient as SQLitePrismaClient } from '../generated/prisma-test';

const apply = process.argv.includes('--apply');
const sourceUrl = process.env.SQLITE_SOURCE_URL || 'file:./dev.db';
const targetUrl = process.env.DATABASE_URL || '';
const source = new SQLitePrismaClient({ adapter: new PrismaBetterSqlite3({ url: sourceUrl }) });

async function readSource() {
  const [issues, tags, stories, candidates, cache, usage, subscribers] = await Promise.all([
    source.issue.findMany(),
    source.tag.findMany(),
    source.story.findMany({ include: { tags: true } }),
    source.ingestedCandidate.findMany(),
    source.responseCache.findMany(),
    source.tokenUsage.findMany(),
    source.subscriber.findMany(),
  ]);
  return { issues, tags, stories, candidates, cache, usage, subscribers };
}

async function main() {
  const data = await readSource();
  const duplicateStoryUrls = data.stories.length - new Set(data.stories.map(story => story.sourceUrl)).size;
  const duplicateCandidateHashes = data.candidates.length - new Set(data.candidates.map(candidate => candidate.contentHash)).size;
  const summary = {
    mode: apply ? 'apply' : 'preview',
    source: sourceUrl.replace(/[^/\\]+\.db.*$/i, '<sqlite-file>'),
    counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
    skippedDuplicates: { storyUrls: duplicateStoryUrls, candidateHashes: duplicateCandidateHashes },
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (!/^postgres(ql)?:\/\//.test(targetUrl)) throw new Error('Set DATABASE_URL to the Supabase PostgreSQL connection before using --apply.');

  const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl, max: 1 }) });
  try {
    await target.$transaction(async tx => {
      for (const issue of data.issues) {
        const row = { ...issue };
        await tx.issue.upsert({ where: { id: row.id }, create: row, update: row });
      }
      const tagIds = new Map<string, string>();
      for (const tag of data.tags) {
        const saved = await tx.tag.upsert({ where: { name: tag.name }, create: tag, update: { name: tag.name } });
        tagIds.set(tag.id, saved.id);
      }

      const seenStoryUrls = new Set<string>();
      for (const story of data.stories) {
        if (seenStoryUrls.has(story.sourceUrl)) continue;
        seenStoryUrls.add(story.sourceUrl);
        const { tags: storyTags, ...row } = story;
        const connectedTags = storyTags.map(tag => ({ id: tagIds.get(tag.id) || tag.id }));
        const tagLinks = { set: connectedTags };
        await tx.story.upsert({
          where: { sourceUrl: row.sourceUrl },
          create: { ...row, tags: { connect: connectedTags } },
          update: { ...row, tags: tagLinks },
        });
      }

      const seenCandidateHashes = new Set<string>();
      for (const candidate of data.candidates) {
        if (seenCandidateHashes.has(candidate.contentHash)) continue;
        seenCandidateHashes.add(candidate.contentHash);
        await tx.ingestedCandidate.upsert({ where: { contentHash: candidate.contentHash }, create: candidate, update: candidate });
      }
      for (const item of data.cache) await tx.responseCache.upsert({ where: { contentHash: item.contentHash }, create: item, update: item });
      for (const item of data.usage) await tx.tokenUsage.upsert({ where: { id: item.id }, create: item, update: item });
      for (const item of data.subscribers) await tx.subscriber.upsert({ where: { email: item.email }, create: item, update: item });
    }, { timeout: 60_000 });
    console.log(JSON.stringify({ ...summary, completed: true }, null, 2));
  } finally {
    await target.$disconnect();
  }
}

main().catch(error => {
  console.error(`[SQLite → Supabase] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}).finally(() => source.$disconnect());
