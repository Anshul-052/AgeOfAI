import 'dotenv/config';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { prisma } from '../src/lib/db';
import domains from '../src/lib/domains.json';
import { findOriginalImage, safeImageUrl } from '../src/lib/sourceImages';

type Candidate = {
  domain: string;
  title: string;
  summary: string;
  url: string;
  publisher: string;
  publishedAt: Date;
  score: number;
  imageUrl?: string;
};

type Source = Candidate & { id: string; content: string };
type Draft = {
  title: string;
  crux: string;
  tags: string[];
  severity: 'normal' | 'notable' | 'major';
  claims: { text: string; sourceIds: string[] }[];
  uncertainties: string[];
};

const argv = new Set(process.argv.slice(2));
const shouldStage = argv.has('--stage') || argv.has('--publish');
const scanOnly = argv.has('--scan-only');
const previewOnly = argv.has('--preview') || !shouldStage;
const maxPerDomain = Math.max(1, Number(process.env.EDITOR_MAX_PER_DOMAIN || 2));
const days = Math.max(1, Number(process.env.EDITOR_LOOKBACK_DAYS || 8));
const model = process.env.GEMINI_MODEL || '';
const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest';
const geminiKey = process.env.GEMINI_API_KEY || '';
const tavilyKey = process.env.TAVILY_API_KEY || '';
const searchDiscovery = process.env.EDITOR_SEARCH_DISCOVERY !== 'false';
const requestedDomain = process.env.EDITOR_DOMAIN?.trim();
const activeDomains = requestedDomain ? domains.filter(domain => domain.id === requestedDomain) : domains;
if (requestedDomain && activeDomains.length === 0) throw new Error(`Unknown EDITOR_DOMAIN: ${requestedDomain}`);
const runId = crypto.randomUUID();

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', processEntities: true, trimValues: true });
const report = {
  runId,
  mode: scanOnly ? 'scan' : previewOnly ? 'preview' : 'stage',
  startedAt: new Date().toISOString(),
  verification: tavilyKey ? 'tavily-and-independent-feeds' : 'independent-feeds-and-google-news',
  fetched: 0,
  considered: 0,
  drafted: 0,
  staged: 0,
  models: {} as Record<string, number>,
  coverage: {} as Record<string, { fetched: number; selected: number; withheld: number }>,
  withheld: [] as { domain: string; title?: string; reason: string }[],
};
let evidencePool: Candidate[] = [];

function list<T>(value: T | T[] | undefined): T[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return text(item['#text'] ?? item['__cdata'] ?? item['@_href'] ?? '');
  }
  return '';
}

function clean(value: unknown): string {
  return text(value).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

function safeUrl(value: unknown): string {
  try {
    const url = new URL(text(value));
    return /^https?:$/.test(url.protocol) ? url.toString() : '';
  } catch { return ''; }
}

function feedImage(item: Record<string, unknown>): string {
  const values = [item['media:content'], item['media:thumbnail'], item.enclosure, item.image];
  for (const value of values) {
    for (const entry of list(value as Record<string, unknown> | string | undefined)) {
      if (typeof entry === 'string') {
        const url = safeImageUrl(entry);
        if (url) return url;
      } else if (entry && typeof entry === 'object') {
        const image = entry as Record<string, unknown>;
        const url = safeImageUrl(image['@_url'] ?? image.url ?? image['#text']);
        if (url) return url;
      }
    }
  }
  return '';
}

function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function titleTokens(title: string): Set<string> {
  const stop = new Set(['with', 'from', 'that', 'this', 'into', 'over', 'after', 'about', 'will', 'have', 'your', 'their', 'says', 'more']);
  return new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 3 && !stop.has(word)));
}

function similarity(a: string, b: string): number {
  const left = titleTokens(a); const right = titleTokens(b);
  const common = Array.from(left).filter(word => right.has(word)).length;
  return common / Math.max(1, new Set([...Array.from(left), ...Array.from(right)]).size);
}

const blockedPublishers = [
  'facebook.com', 'openpr.com', 'issuewire.com', 'globenewswire.com', 'prnewswire.com',
  'businesswire.com', 'industrytoday.co.uk', 'kalkine.ca', 'marketscreener.com',
  'tradingview.com', 'pulse2.com', 'tycoonstory.com', 'programminginsider.com',
];

function sourceQuality(publisher: string): number {
  if (blockedPublishers.some(blocked => publisher === blocked || publisher.endsWith(`.${blocked}`))) return -10;
  if (/\.(gov|edu)$/.test(publisher) || /(^|\.)(arxiv\.org|ieee\.org|spectrum\.ieee\.org|nature\.com|science\.org|technologyreview\.com|reuters\.com|apnews\.com|bloomberg\.com|theverge\.com|arstechnica\.com|wired\.com|techcrunch\.com|theregister\.com|github\.com|nasa\.gov|cisa\.gov)$/.test(publisher)) return 2.5;
  return 0;
}

function relevant(candidate: Candidate): boolean {
  const domain = domains.find(item => item.id === candidate.domain);
  if (!domain) return false;
  const haystack = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const generic = new Set(['technology', 'engineering', 'release', 'research', 'developer', 'news', 'latest']);
  const keywords = domain.query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 2 && !generic.has(word));
  const matches = keywords.filter(keyword => haystack.includes(keyword)).length;
  const promotion = /\b(deal|discount|coupon|sale|save \$|best price|buy now|gift guide|free bundle|sponsored|webinar|top \d+)\b|\bmarket (size|report|outlook)\b|\bstock (gains|jumps|falls)\b|\$\d+.*\b(low|off|bundle)\b/i.test(candidate.title);
  return sourceQuality(candidate.publisher) > -10 && !promotion && (matches > 0 || ['Research', 'Policy & Society', 'Drama'].includes(candidate.domain));
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'AgeOfAI-Editor/1.0 (+weekly technology publication)' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timer); }
}

function parseFeed(body: string, domain: string): Candidate[] {
  const parsed = xml.parse(body);
  const channel = parsed?.rss?.channel;
  const rssItems = list<Record<string, unknown>>(channel?.item);
  const feed = parsed?.feed;
  const atomItems = list<Record<string, unknown>>(feed?.entry);
  const items = rssItems.length ? rssItems : atomItems;
  return items.map(item => {
    const linkValue = Array.isArray(item.link)
      ? (item.link as Record<string, unknown>[]).find(link => link['@_rel'] === 'alternate')?.['@_href'] ?? (item.link as unknown[])[0]
      : item.link;
    const published = clean(item.pubDate ?? item.published ?? item.updated ?? item.date);
    const publishedAt = new Date(published || Date.now());
    const summary = clean(item.description ?? item.summary ?? item.content ?? item['content:encoded']);
    const title = clean(item.title);
    const url = safeUrl(linkValue ?? item.guid ?? item.id);
    const source = item.source as Record<string, unknown> | string | undefined;
    const sourceUrl = source && typeof source === 'object' ? safeUrl(source['@_url']) : '';
    const publisher = sourceUrl ? host(sourceUrl) : clean(source) || host(url);
    const age = (Date.now() - publishedAt.getTime()) / 86_400_000;
    const score = Math.max(0, 6 - age / 2) + Math.min(3, summary.length / 400) + (url.startsWith('https://') ? 1 : 0) + sourceQuality(publisher);
    return { domain, title, summary, url, publisher, publishedAt, score, imageUrl: feedImage(item) || undefined };
  }).filter(item => item.title.length >= 12 && item.summary.length >= 30 && item.url && !Number.isNaN(item.publishedAt.getTime()) && item.publishedAt >= new Date(Date.now() - days * 86_400_000)).filter(relevant);
}

async function searchDomain(domain: (typeof domains)[number]): Promise<Candidate[]> {
  if (!searchDiscovery) return [];
  if (!tavilyKey) {
    const query = encodeURIComponent(`${domain.query} technology when:${days}d`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    return parseFeed(await fetchText(url), domain.id).map(item => ({ ...item, score: item.score - 1 }));
  }
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST', headers: { Authorization: `Bearer ${tavilyKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `${domain.query} news development`, topic: 'news', search_depth: 'basic', max_results: 6, include_raw_content: false, time_range: 'week' }),
  });
  if (!response.ok) throw new Error(`Discovery search returned HTTP ${response.status}`);
  const result = await response.json() as { results?: { title?: string; url?: string; content?: string; score?: number; published_date?: string }[] };
  return (result.results || []).map(item => ({
    domain: domain.id, title: clean(item.title), summary: clean(item.content), url: safeUrl(item.url), publisher: host(item.url || ''), publishedAt: new Date(item.published_date || Date.now()), score: 5 + (item.score || 0) * 4,
  })).filter(item => item.title.length >= 12 && item.summary.length >= 30 && item.url).filter(relevant);
}

async function discover(): Promise<Candidate[]> {
  const batches = await Promise.allSettled(activeDomains.map(async domain => {
    const [feed, search] = await Promise.allSettled([fetchText(domain.feed).then(body => parseFeed(body, domain.id)), searchDomain(domain)]);
    if (feed.status === 'rejected' && search.status === 'rejected') throw new Error(`feed: ${feed.reason}; search: ${search.reason}`);
    return [...(feed.status === 'fulfilled' ? feed.value : []), ...(search.status === 'fulfilled' ? search.value : [])];
  }));
  const all: Candidate[] = [];
  batches.forEach((batch, index) => {
    const domain = activeDomains[index];
    const found = batch.status === 'fulfilled' ? batch.value : [];
    report.coverage[domain.id] = { fetched: found.length, selected: 0, withheld: 0 };
    report.fetched += found.length;
    if (batch.status === 'rejected') report.withheld.push({ domain: domain.id, reason: `Feed unavailable: ${String(batch.reason).slice(0, 180)}` });
    all.push(...found);
  });
  evidencePool = all;
  const deduped: Candidate[] = [];
  for (const item of all.sort((a, b) => b.score - a.score)) {
    if (!deduped.some(existing => existing.url === item.url || similarity(existing.title, item.title) >= 0.72)) deduped.push(item);
  }
  return deduped;
}

async function searchCorroboration(candidate: Candidate): Promise<Source[]> {
  let pooled = evidencePool
    .filter(item => item.url !== candidate.url && item.publisher && item.publisher !== candidate.publisher && similarity(item.title, candidate.title) >= 0.22)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (!tavilyKey) {
    if (pooled.length === 0) {
      const coreTitle = candidate.title.replace(/\s+-\s+[^-]{2,80}$/, '');
      const query = encodeURIComponent(`"${coreTitle}" when:30d`);
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
      try {
        pooled = parseFeed(await fetchText(url), candidate.domain)
          .filter(item => item.url !== candidate.url && item.publisher && item.publisher !== candidate.publisher && similarity(item.title, candidate.title) >= 0.14)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);
      } catch {
        pooled = [];
      }
    }
    return pooled.map((item, index) => ({ ...item, id: `S${index + 2}`, content: item.summary }));
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST', headers: { Authorization: `Bearer ${tavilyKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `"${candidate.title}" ${candidate.domain}`, topic: 'news', search_depth: 'advanced', chunks_per_source: 2, max_results: 6, include_raw_content: false, time_range: 'month', exclude_domains: [candidate.publisher] }),
  });
  if (!response.ok) throw new Error(`Verification search returned HTTP ${response.status}`);
  const result = await response.json() as { results?: { title?: string; url?: string; content?: string; score?: number; published_date?: string }[] };
  const searched = (result.results || []).filter(item => (item.score || 0) >= 0.35 && safeUrl(item.url) && host(item.url || '') !== candidate.publisher).map(item => ({
    domain: candidate.domain, title: clean(item.title), summary: clean(item.content), content: clean(item.content), url: safeUrl(item.url), publisher: host(item.url || ''), publishedAt: new Date(item.published_date || Date.now()), score: item.score || 0,
  }));
  return [...pooled.map(item => ({ ...item, content: item.summary })), ...searched]
    .filter((source, index, items) => items.findIndex(other => other.publisher === source.publisher) === index)
    .slice(0, 4)
    .map((source, index) => ({ ...source, id: `S${index + 2}` }));
}

async function callGemini(prompt: string): Promise<{ value: unknown; modelUsed: string }> {
  if (!geminiKey || !model) throw new Error('Set GEMINI_API_KEY and GEMINI_MODEL to enable verified drafting.');
  const candidates = Array.from(new Set([model, fallbackModel].filter(Boolean)));
  let lastFailure = 'No Gemini model was available.';
  for (const modelName of candidates) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' } }),
      });
      if (response.ok) {
        const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
        const output = payload.candidates?.[0]?.content?.parts?.filter(part => !part.thought && part.text).map(part => part.text).join('') || '{}';
        return { value: JSON.parse(output), modelUsed: modelName };
      }
      const detail = (await response.text()).slice(0, 180);
      lastFailure = `Drafting model ${modelName} returned HTTP ${response.status}: ${detail}`;
      if (![429, 503].includes(response.status) || attempt === 2) break;
      await new Promise(resolve => setTimeout(resolve, 1500 * (2 ** attempt)));
    }
  }
  throw new Error(lastFailure);
}

function validateDraft(value: unknown, sources: Source[]): Draft {
  if (!value || typeof value !== 'object') throw new Error('The drafting model returned an invalid object.');
  const draft = value as Draft;
  if (typeof draft.title !== 'string' || draft.title.length < 10 || draft.title.length > 180) throw new Error('Invalid drafted title.');
  const wordCount = typeof draft.crux === 'string' ? draft.crux.trim().split(/\s+/).length : 0;
  if (typeof draft.crux !== 'string' || !draft.crux.trim() || draft.crux.length > 9000 || wordCount > 1400) throw new Error('Draft does not meet the supported article format.');
  if (!Array.isArray(draft.tags) || draft.tags.length < 2 || draft.tags.length > 8 || draft.tags.some(tag => typeof tag !== 'string' || tag.length > 50)) throw new Error('Invalid tags.');
  if (!['normal', 'notable', 'major'].includes(draft.severity)) throw new Error('Invalid severity.');
  if (!Array.isArray(draft.claims) || !draft.claims.length) throw new Error('Draft has no claim ledger.');
  const ids = new Set(sources.map(source => source.id));
  for (const claim of draft.claims) {
    if (!claim.text || !Array.isArray(claim.sourceIds) || !claim.sourceIds.length || claim.sourceIds.some(id => !ids.has(id))) throw new Error('Draft contains an unsupported claim.');
  }
  if (!Array.isArray(draft.uncertainties)) draft.uncertainties = [];
  return draft;
}

async function draftCandidate(candidate: Candidate): Promise<{ draft: Draft; sources: Source[]; modelUsed: string }> {
  const original: Source = { ...candidate, id: 'S1', content: candidate.summary };
  const corroboration = await searchCorroboration(candidate);
  const sources = [original, ...corroboration].filter((source, index, items) => items.findIndex(other => other.publisher === source.publisher) === index);
  if (sources.length < 2) throw new Error('Fewer than two independent publisher domains supported the story.');
  const evidence = sources.map(source => `[${source.id}] ${source.publisher}: ${source.title}\n${source.content.slice(0, 3000)}\nURL: ${source.url}`).join('\n\n');
  const domain = domains.find(item => item.id === candidate.domain)!;
  const result = await callGemini(`You are the autonomous editor of AgeOfAI, a weekly technology magazine for engineers, students and curious practitioners. Use only the numbered evidence below. Never add a fact that is not supported. If sources conflict, state the disagreement in uncertainties. Write JSON only.

Domain: ${domain.id}. Focus: ${domain.description}.
Required JSON: {"title":"accurate headline","crux":"A source-adaptive article, usually 220-450 words in 4-7 paragraphs. Lead with what changed; explain the technical mechanism or context; examine who is affected, the practical consequences, trade-offs, limitations, and what remains uncertain.","tags":["2-8 specific terms"],"severity":"normal|notable|major","claims":[{"text":"each factual claim","sourceIds":["S1","S2"]}],"uncertainties":["unresolved limitation"]}.
Every factual statement in the crux must be represented in the claim ledger. Prefer precise, restrained language with enough explanation for a newcomer. Do not pad the article, speculate beyond the evidence, invent an impact, or call a story breaking unless severity is major. If the sources are sparse, write the best complete shorter account they support.

EVIDENCE\n${evidence}`);
  return { draft: validateDraft(result.value, sources), sources, modelUsed: result.modelUsed };
}

async function nextIssue() {
  const latest = await prisma.issue.findFirst({ orderBy: [{ publishedAt: 'desc' }, { issueNumber: 'desc' }] });
  return { volume: latest?.volume || 'Volume I', issueNumber: (latest?.issueNumber || 0) + 1 };
}

function weeklyEditionKey(now = new Date()): string {
  const india = new Date(now.getTime() + 330 * 60_000);
  india.setUTCDate(india.getUTCDate() - india.getUTCDay());
  return `weekly-${india.toISOString().slice(0, 10)}`;
}

async function main() {
  console.log(`[AgeOfAI editor] ${previewOnly ? 'previewing' : 'building'} edition ${runId}`);
  if (!previewOnly && (!geminiKey || !model)) throw new Error('Staging requires GEMINI_API_KEY and GEMINI_MODEL. Run editor:preview to inspect coverage first.');
  const discovered = await discover();
  report.considered = discovered.length;
  if (scanOnly) {
    console.log(JSON.stringify({
      ...report,
      samples: Object.fromEntries(activeDomains.map(domain => [domain.id, discovered.filter(item => item.domain === domain.id).slice(0, 3).map(item => ({ title: item.title, publisher: item.publisher }))])),
    }, null, 2));
    return;
  }
  const attemptsPerDomain = Math.max(6, maxPerDomain * 4);
  const selected = activeDomains.flatMap(domain => discovered.filter(item => item.domain === domain.id).sort((a, b) => b.score - a.score).slice(0, attemptsPerDomain));
  const stories: { candidate: Candidate; draft: Draft; sources: Source[]; modelUsed: string }[] = [];
  for (const candidate of selected) {
    if (report.coverage[candidate.domain].selected >= maxPerDomain) continue;
    try {
      const result = await draftCandidate(candidate);
      stories.push({ candidate, ...result });
      report.coverage[candidate.domain].selected++;
      report.drafted++;
      report.models[result.modelUsed] = (report.models[result.modelUsed] || 0) + 1;
    } catch (error) {
      report.coverage[candidate.domain].withheld++;
      report.withheld.push({ domain: candidate.domain, title: candidate.title, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  if (previewOnly) {
    console.log(JSON.stringify({ ...report, preview: stories.map(item => ({ domain: item.candidate.domain, title: item.draft.title, sources: item.sources.length })) }, null, 2));
    return;
  }
  const minimumStories = Math.max(1, Number(process.env.EDITOR_MIN_STORIES || 8));
  if (stories.length < minimumStories) throw new Error(`Only ${stories.length} stories passed verification; minimum is ${minimumStories}. No draft issue was created.`);
  const issueInfo = await nextIssue();
  const editionKey = weeklyEditionKey();
  if (await prisma.issue.findUnique({ where: { editionKey } })) throw new Error(`Edition ${editionKey} already exists as a draft or published issue. A scheduler retry will not create a duplicate.`);
  const preparedStories = await Promise.all(stories.map(async item => ({ ...item, imageUrl: await findOriginalImage(item.candidate.url, item.candidate.imageUrl) })));
  const coverStory = preparedStories.find(item => item.imageUrl);
  const issue = await prisma.$transaction(async tx => {
    const created = await tx.issue.create({ data: {
      ...issueInfo, editionKey, publishedAt: new Date(), isPublished: false, layout: 'editorial-and-drama-split',
      coverImageUrl: coverStory?.imageUrl || null,
      coverImagePrompt: coverStory ? `Original publisher image for: ${coverStory.draft.title}` : null,
    } });
    for (const item of preparedStories) {
      await tx.story.create({ data: {
        title: item.draft.title, crux: item.draft.crux, sourceUrl: item.candidate.url, domain: item.candidate.domain, severity: item.draft.severity,
        imageUrl: item.imageUrl || null, publishedAt: item.candidate.publishedAt, issueId: created.id, verificationStatus: 'source-checked',
        evidenceJson: JSON.stringify({ editorRunId: runId, model: item.modelUsed, checkedAt: new Date().toISOString(), claims: item.draft.claims, limitations: item.draft.uncertainties, imageSourceUrl: item.imageUrl ? item.candidate.url : null, sources: item.sources.map(source => ({ id: source.id, title: source.title, url: source.url, publisher: source.publisher })) }),
        tags: { connectOrCreate: item.draft.tags.map(name => ({ where: { name }, create: { name } })) },
      } });
    }
    return created;
  });
  report.staged = stories.length;
  console.log(JSON.stringify({ ...report, issue: { id: issue.id, volume: issue.volume, issueNumber: issue.issueNumber, status: 'awaiting-admin-approval' } }, null, 2));
}

main().catch(error => { console.error(`[AgeOfAI editor] ${error instanceof Error ? error.message : String(error)}`); console.error(JSON.stringify(report, null, 2)); process.exitCode = 1; }).finally(() => prisma.$disconnect());
