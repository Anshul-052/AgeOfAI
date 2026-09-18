import { NextResponse } from 'next/server';
import { explainConceptWithGemini } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { storyTitle, storyCrux, question, domain } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const { explanation, usage } = await explainConceptWithGemini(
      storyTitle || 'Tech Concept',
      storyCrux || '',
      question,
      domain
    );

    return NextResponse.json({
      explanation,
      usage
    });
  } catch (error) {
    console.error('Explain API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
