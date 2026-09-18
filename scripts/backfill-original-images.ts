import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { findOriginalImage, safeImageUrl } from '../src/lib/sourceImages';

async function main() {
  const stories = await prisma.story.findMany({
    select: { id: true, title: true, sourceUrl: true, imageUrl: true, issueId: true },
    orderBy: { publishedAt: 'desc' },
  });

  let updated = 0;
  let cleared = 0;
  for (let index = 0; index < stories.length; index += 4) {
    const batch = stories.slice(index, index + 4);
    await Promise.all(batch.map(async story => {
      const imageUrl = await findOriginalImage(story.sourceUrl, story.imageUrl);
      const current = safeImageUrl(story.imageUrl);
      if (imageUrl && imageUrl !== current) {
        await prisma.story.update({ where: { id: story.id }, data: { imageUrl } });
        updated += 1;
      } else if (!imageUrl && story.imageUrl && !current) {
        await prisma.story.update({ where: { id: story.id }, data: { imageUrl: null } });
        cleared += 1;
      }
    }));
  }

  const issues = await prisma.issue.findMany({
    include: { stories: { where: { imageUrl: { not: null } }, orderBy: { publishedAt: 'desc' }, take: 1 } },
  });
  for (const issue of issues) {
    const lead = issue.stories[0];
    await prisma.issue.update({
      where: { id: issue.id },
      data: {
        coverImageUrl: lead?.imageUrl || null,
        coverImagePrompt: lead ? `Original publisher image for: ${lead.title}` : null,
      },
    });
  }

  console.log(JSON.stringify({ stories: stories.length, updated, cleared, issueCoversReviewed: issues.length }));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
