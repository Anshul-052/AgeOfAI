import { createHmac, timingSafeEqual } from 'node:crypto';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createUnsubscribeToken(email: string, secret: string): string {
  if (secret.length < 32) throw new Error('NEWSLETTER_UNSUBSCRIBE_SECRET must contain at least 32 characters.');
  const payload = Buffer.from(normalizeEmail(email), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  if (!token || secret.length < 32) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let provided: Buffer;
  try { provided = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? normalizeEmail(email) : null;
  } catch { return null; }
}

