import { NextResponse } from 'next/server';
import { draftStoryWithGemini, getTokenUsageStats } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env' }, { status: 500 });
    }

    const { draft, usage } = await draftStoryWithGemini(content);
    const cumulativeStats = await getTokenUsageStats();

    return NextResponse.json({ 
      draft, 
      usage,
      cumulativeStats 
    });
  } catch (error) {
    console.error('Draft API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}
