import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runIngestionPipeline } from '@/lib/ingest';

export async function GET() {
  try {
    const candidates = await prisma.ingestedCandidate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch inbox candidates' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Manual ingestion error:', error);
    return NextResponse.json({ error: 'Failed to run ingestion pipeline' }, { status: 500 });
  }
}
