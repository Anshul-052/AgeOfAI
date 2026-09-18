const blockedImageHosts = [
  'image.pollinations.ai',
  'images.unsplash.com',
  'unsplash.com',
  'pexels.com',
  'pixabay.com',
];

export function safeImageUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol)) return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (blockedImageHosts.some(blocked => host === blocked || host.endsWith(`.${blocked}`))) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function imageFromHtml(html: string): string {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/i.test(tag)) continue;
    const match = tag.match(/content=["']([^"']+)["']/i);
    const url = safeImageUrl(match?.[1]?.replace(/&amp;/g, '&'));
    if (url) return url;
  }
  return '';
}

export async function findOriginalImage(sourceUrl: string, providedImageUrl?: string | null): Promise<string> {
  const provided = safeImageUrl(providedImageUrl);
  if (provided) return provided;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AgeOfAI/1.0 (+source image verification)' },
    });
    if (!response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) return '';
    return imageFromHtml(await response.text());
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
