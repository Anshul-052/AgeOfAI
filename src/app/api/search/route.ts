import { NextResponse } from 'next/server';
import { getActiveEngine, prisma } from '@/lib/db';
import { publicStories } from '@/lib/publication';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json({ stories: [] });
  }

  const cleanQuery = query.trim();

  try {
    // Native PostgreSQL full-text search with tsvector & ILIKE.
    if (getActiveEngine() === 'postgres') try {
        const stories = await prisma.$queryRaw`
          SELECT DISTINCT s.id
          FROM "Story" s
          LEFT JOIN "_StoryToTag" st ON s.id = st."A"
          LEFT JOIN "Tag" t ON st."B" = t.id
          WHERE 
            t.name ILIKE ${'%' + cleanQuery + '%'}
            OR s.title ILIKE ${'%' + cleanQuery + '%'}
            OR s.crux ILIKE ${'%' + cleanQuery + '%'}
            OR to_tsvector('english', s.title || ' ' || s.crux) @@ plainto_tsquery('english', ${cleanQuery})
          ORDER BY s.id DESC
          LIMIT 50;
        `;
        
        const storyIds = (stories as Array<{ id: string }>).map(s => s.id);
        
        if (storyIds.length > 0) {
          const fullStories = await prisma.story.findMany({
            where: { AND: [{ id: { in: storyIds } }, publicStories()] },
            include: { tags: true },
            orderBy: { publishedAt: 'desc' }
          });

          return NextResponse.json({ stories: fullStories });
        }
    } catch (pgError) {
      console.warn("PostgreSQL full-text search raw query fallback:", pgError);
    }

    // ORM fallback if the full-text query is unavailable.
    const fallbackStories = await prisma.story.findMany({
      where: {
        AND: [publicStories(), { OR: [
          { title: { contains: cleanQuery } },
          { crux: { contains: cleanQuery } },
          { domain: { contains: cleanQuery } },
          { tags: { some: { name: { contains: cleanQuery } } } }
        ] }]
      },
      include: { tags: true },
      orderBy: { publishedAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ stories: fallbackStories });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
