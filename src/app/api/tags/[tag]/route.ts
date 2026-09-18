import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { publicStories } from '@/lib/publication';

export async function GET(request: Request, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const tagName = decodeURIComponent(tag);

  try {
    const stories = await prisma.story.findMany({
      where: {
        AND: [publicStories(), { tags: {
          some: {
            name: {
              equals: tagName
            }
          }
        } }]
      },
      include: { tags: true },
      orderBy: { publishedAt: 'desc' }
    });

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Topic fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch topic stories' }, { status: 500 });
  }
}
