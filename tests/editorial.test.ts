import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { PrismaClient } from '@prisma/client';
import { PrismaClient as TestPrismaClient } from '../generated/prisma-test';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { approveCandidate, EditorialError } from '../src/lib/editorial';

test('publication attaches to the chosen issue, rejects repeats, and preserves failed candidates', async () => {
  const db = new TestPrismaClient({ adapter: new PrismaBetterSqlite3({ url: ':memory:' }) });
  try {
    const sql = readFileSync('prisma/test-schema.sql', 'utf8');
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    const issue = await db.issue.create({ data: { volume: 'Test', issueNumber: 1, publishedAt: new Date(), isPublished: true } });
    const candidate = await db.ingestedCandidate.create({ data: {
      rawTitle: 'Test', rawContent: 'Test content', source: 'test', sourceUrl: 'https://example.com/source', contentHash: 'test', status: 'drafted',
    } });
    const input = { candidateId: candidate.id, issueId: issue.id, title: ' Reviewed title ', crux: 'Reviewed engineering analysis.', domain: 'Research', severity: 'normal', tags: 'AI, AI, Systems' };
    const editorialDb = db as unknown as PrismaClient;
    await assert.rejects(approveCandidate(editorialDb, { ...input, issueId: 'missing' }), (e: unknown) => e instanceof EditorialError && e.status === 400);
    assert.equal((await db.ingestedCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).status, 'drafted');
    assert.equal(await db.story.count(), 0);
    const story = await approveCandidate(editorialDb, input);
    assert.equal(story.issueId, issue.id);
    assert.equal(story.title, 'Reviewed title');
    assert.equal(story.sourceUrl, candidate.sourceUrl);
    assert.equal(story.tags.length, 2);
    await assert.rejects(approveCandidate(editorialDb, input), (e: unknown) => e instanceof EditorialError && e.status === 409);
    assert.equal(await db.story.count(), 1);
    assert.equal((await db.ingestedCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).status, 'published');
    await assert.rejects(approveCandidate(editorialDb, { ...input, title: ' ' }), (e: unknown) => e instanceof EditorialError && e.status === 400);
    // A database failure after the status claim must roll the claim back.
    await db.ingestedCandidate.update({ where: { id: candidate.id }, data: { status: 'drafted' } });
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_story BEFORE INSERT ON Story BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END`);
    await assert.rejects(approveCandidate(editorialDb, input));
    assert.equal((await db.ingestedCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).status, 'drafted');
  } finally { await db.$disconnect(); }
});
