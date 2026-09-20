function decodeHtml(value: string) {
  return value.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function plainText(value: string) {
  return decodeHtml(value).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function articleText(html: string) {
  const bodies: string[] = [];
  for (const match of html.matchAll(/"articleBody"\s*:\s*"((?:\\.|[^"\\])*)"/gi)) {
    try { bodies.push(JSON.parse(`"${match[1]}"`)); } catch { /* Ignore malformed structured data. */ }
  }
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  return plainText(bodies.join(' ') || article || main || '');
}

export async function buildDraftingSource(title: string, rawContent: string, sourceUrl: string) {
  const supplied = plainText(rawContent);
  let retrieved = '';
  if (supplied.split(/\s+/).length < 350) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(sourceUrl, { signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'AgeOfAI-Editor/1.0' } });
      if (response.ok && /text\/html/i.test(response.headers.get('content-type') || '')) retrieved = articleText(await response.text());
    } catch { /* The supplied feed content remains available. */ }
    finally { clearTimeout(timer); }
  }
  const evidence = retrieved.length > supplied.length ? retrieved : supplied;
  return `Headline: ${plainText(title)}\nSource URL: ${sourceUrl}\nSource material:\n${evidence.slice(0, 16_000)}`;
}
