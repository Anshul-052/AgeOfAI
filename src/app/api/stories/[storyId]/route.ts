import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { publicStories } from '@/lib/publication';

export async function GET(request: Request, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await params;
    const story = await prisma.story.findFirst({
      where: { AND: [{ id: storyId }, publicStories()] },
      include: { tags: true }
    });
    
    if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ story });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await params;
    const data = await request.json();
    const tagNames = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    
    const story = await prisma.story.update({
      where: { id: storyId },
      data: {
        title: data.title,
        crux: data.crux,
        sourceUrl: data.sourceUrl,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        domain: data.domain,
        severity: data.severity,
        tags: {
          set: [],
          connectOrCreate: tagNames.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        }
      }
    });

    return NextResponse.json({ story });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, { status: 500 });
  }
}
