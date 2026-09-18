import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizeEmail } from '@/lib/newsletterTokens';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const normalized = typeof email === 'string' ? normalizeEmail(email) : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email: normalized },
      update: { status: 'active' },
      create: { email: normalized, status: 'active' }
    });

    return NextResponse.json({ success: true, subscribed: subscriber.status === 'active' });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
