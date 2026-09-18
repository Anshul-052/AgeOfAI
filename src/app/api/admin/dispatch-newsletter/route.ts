import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateNewsletterHtml } from '@/lib/newsletter';

export async function POST(request: Request) {
  try {
    const { issueId } = await request.json();
    if (typeof issueId !== 'string' || !issueId) return NextResponse.json({ error: 'issueId is required' }, { status: 400 });

    const resendApiKey = process.env.RESEND_API_KEY;
    const unsubscribeSecret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || '';
    const from = process.env.NEWSLETTER_FROM;
    if (!resendApiKey || !from || unsubscribeSecret.length < 32) {
      return NextResponse.json({ error: 'Newsletter delivery is not fully configured.' }, { status: 503 });
    }

    const issue = await prisma.issue.findFirst({
      where: { id: issueId, isPublished: true, publishedAt: { lte: new Date() } },
      include: { stories: true },
    });
    if (!issue) return NextResponse.json({ error: 'Published issue not found' }, { status: 404 });

    const subscribers = await prisma.subscriber.findMany({ where: { status: 'active' } });
    if (subscribers.length === 0) return NextResponse.json({ message: 'No active subscribers found.', dispatchedCount: 0, failedCount: 0, skippedCount: 0 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let dispatchedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const subscriber of subscribers) {
      const existing = await prisma.newsletterDelivery.upsert({
        where: { issueId_subscriberId: { issueId, subscriberId: subscriber.id } },
        create: { issueId, subscriberId: subscriber.id },
        update: {},
      });
      if (existing.status === 'sent') { skippedCount += 1; continue; }

      const attemptId = randomUUID();
      const stale = new Date(Date.now() - 15 * 60_000);
      const claimed = await prisma.newsletterDelivery.updateMany({
        where: {
          id: existing.id,
          OR: [{ status: { in: ['pending', 'failed'] } }, { status: 'sending', updatedAt: { lt: stale } }],
        },
        data: { status: 'sending', attemptId, lastError: null },
      });
      if (claimed.count !== 1) { skippedCount += 1; continue; }

      try {
        const html = generateNewsletterHtml(issue, subscriber.email, siteUrl, unsubscribeSecret);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `${issue.id}:${subscriber.id}`,
          },
          body: JSON.stringify({
            from,
            to: [subscriber.email],
            subject: `AgeOfAI — ${issue.volume} Issue #${issue.issueNumber}`,
            html,
          }),
        });
        const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || `Resend returned HTTP ${response.status}`);
        await prisma.newsletterDelivery.update({
          where: { id: existing.id },
          data: { status: 'sent', providerId: payload.id || null, sentAt: new Date(), lastError: null },
        });
        dispatchedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown delivery error';
        await prisma.newsletterDelivery.update({ where: { id: existing.id }, data: { status: 'failed', lastError: message } });
        failedCount += 1;
      }
    }

    return NextResponse.json({
      success: failedCount === 0,
      message: `Issue #${issue.issueNumber}: ${dispatchedCount} sent, ${skippedCount} skipped, ${failedCount} failed.`,
      dispatchedCount,
      skippedCount,
      failedCount,
    });
  } catch (error) {
    console.error('Newsletter dispatch error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dispatch failed' }, { status: 500 });
  }
}
