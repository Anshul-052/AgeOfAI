export function readAdminCredential(authorization: string | null): string | null {
  if (!authorization) return null;

  const [scheme, value] = authorization.split(/\s+/, 2);
  if (!scheme || !value) return null;
  if (scheme.toLowerCase() === 'bearer') return value;
  if (scheme.toLowerCase() !== 'basic') return null;

  try {
    const decoded = atob(value);
    const separator = decoded.indexOf(':');
    return separator >= 0 ? decoded.slice(separator + 1) : null;
  } catch {
    return null;
  }
}

export function credentialsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;

  const length = Math.max(provided.length, expected.length);
  let difference = provided.length ^ expected.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (provided.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export const ADMIN_SESSION_COOKIE = 'ageofai_admin_session';

export async function createAdminSession(secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(`AgeOfAI admin session:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function adminSessionMatches(session: string | null, secret: string | undefined): Promise<boolean> {
  if (!session || !secret) return false;
  return credentialsMatch(session, await createAdminSession(secret));
}
