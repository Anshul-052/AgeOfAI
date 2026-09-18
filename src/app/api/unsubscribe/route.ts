import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/newsletterTokens';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || '';
  const email = token ? verifyUnsubscribeToken(token, secret) : null;

  if (!email) {
    return new NextResponse('This unsubscribe link is invalid.', { status: 400 });
  }

  try {
    await prisma.subscriber.updateMany({
      where: { email: email.toLowerCase().trim() },
      data: { status: 'unsubscribed' }
    });

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed — AgeOfAI</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 60px 20px; background: #0f0f11; color: #e5e5e7; }
            .card { max-width: 450px; margin: 0 auto; padding: 30px; border: 1px solid #333; border-radius: 8px; }
            h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 12px; }
            p { color: #a1a1aa; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>AgeOfAI</h1>
            <p>You have been successfully unsubscribed from weekly broadsheet dispatches.</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse('Unsubscribe failed', { status: 500 });
  }
}
