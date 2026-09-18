import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const issues = await prisma.issue.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' }
    });
    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const issue = await prisma.issue.create({
      data: {
        volume: data.volume,
        issueNumber: data.issueNumber,
        publishedAt: new Date(),
        isPublished: true,
      }
    });
    return NextResponse.json({ issue });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, { status: 500 });
  }
}
