import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { approveCandidate, EditorialError } from '@/lib/editorial';

export async function POST(request: Request) {
  try {
    const story = await approveCandidate(prisma, await request.json());
    for (const path of ['/', '/issues', `/issues/${story.issueId}`, '/admin', '/search']) revalidatePath(path);
    for (const tag of story.tags) revalidatePath(`/topics/${encodeURIComponent(tag.name)}`);
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    if (error instanceof EditorialError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    console.error('Candidate approval error:', error);
    return NextResponse.json({ error: 'Approval failed. Please try again.' }, { status: 500 });
  }
}
