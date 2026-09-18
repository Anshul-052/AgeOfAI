import { NextResponse } from 'next/server';
import { getTokenUsageStats } from '@/lib/gemini';

export async function GET() {
  try {
    const stats = await getTokenUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch token usage stats:', error);
    return NextResponse.json({ error: 'Failed to fetch token usage' }, { status: 500 });
  }
}
