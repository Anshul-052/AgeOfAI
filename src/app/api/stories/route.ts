import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const tagNames = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    
    const story = await prisma.story.create({
      data: {
        title: data.title,
        crux: data.crux,
        sourceUrl: data.sourceUrl,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        domain: data.domain,
        severity: data.severity,
        publishedAt: new Date(),
        tags: {
          connectOrCreate: tagNames.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        }
      }
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Story creation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, { status: 500 });
  }
}
