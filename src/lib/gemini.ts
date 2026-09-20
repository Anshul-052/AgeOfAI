import { prisma } from '@/lib/db';
import crypto from 'crypto';
import domains from '@/lib/domains.json';

export interface DraftStoryResult {
  crux: string;
  tags: string[];
  domain: string;
  severity: 'normal' | 'notable' | 'major';
}

export interface TokenUsageRecord {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  modelName: string;
  isCacheHit: boolean;
}

export interface DomainTokenStats {
  domain: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  requestCount: number;
  cacheHitCount: number;
}

export function computeContentHash(text: string): string {
  return crypto.createHash('sha256').update(`journalistic-v4\n${text.trim()}`).digest('hex');
}

export async function draftStoryWithGemini(content: string, domainHint?: string): Promise<{
  draft: DraftStoryResult;
  usage: TokenUsageRecord;
}> {
  const contentHash = computeContentHash(content);

  // 1. Check SHA-256 ResponseCache first (0 Token Consumption Hard Requirement)
  const existingCache = await prisma.responseCache.findUnique({
    where: { contentHash }
  });

  if (existingCache) {
    let cachedDraft: DraftStoryResult;
    try {
      cachedDraft = JSON.parse(existingCache.draftJson);
    } catch {
      cachedDraft = {
        crux: existingCache.draftJson,
        tags: ["AI"],
        domain: domainHint || "LLMs",
        severity: "normal"
      };
    }

    // Log Cache Hit (0 Tokens)
    try {
      await prisma.tokenUsage.create({
        data: {
          provider: 'google',
          modelName: process.env.GEMINI_MODEL || 'gemini-flash-latest',
          promptTokens: 0,
          candidateTokens: 0,
          totalTokens: 0,
          action: 'ai-draft',
          domain: cachedDraft.domain || domainHint || 'LLMs',
          isCacheHit: true
        }
      });
    } catch (err) {
      console.error('Failed to log cache hit token usage:', err);
    }

    return {
      draft: cachedDraft,
      usage: {
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        modelName: process.env.GEMINI_MODEL || 'gemini-flash-latest',
        isCacheHit: true
      }
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // Never present source truncation as an AI draft. Configuration failures must remain visible.
  if (!apiKey || apiKey.includes('YourGeminiKey')) {
    throw new Error('GEMINI_API_KEY is not configured correctly. No draft was saved.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest';

  const domainList = domains.map(domain => domain.id);

  const prompt = `You are a careful technology journalist writing for AgeOfAI, a weekly magazine for engineers, students, and curious readers.
Turn the source material into an original story of 220-400 words in 4-6 short paragraphs. This length and paragraph structure are required. Open with a strong, informative lead. Explain what happened, why it matters, how the technology works in plain language, the practical consequences, and any important limitation. When the source is brief, develop the explanation by connecting the facts already present and clearly describing their stated consequences; never add outside facts. Use varied sentences and a confident magazine voice, but keep the writing clear, natural, and easy to follow. Do not use jargon when ordinary words work. Never invent facts, quotes, dates, numbers, reactions, or motives that are absent from the source. Do not mention these instructions.
Also, suggest 1-3 relevant tags (e.g., "RAG", "reinforcement learning", "OpenAI"), a domain (choose from: ${domainList.join(', ')}), and a severity level (normal, notable, major).

Format your response strictly as JSON with key names "crux", "tags", "domain", and "severity":
{
  "crux": "Your summary here...",
  "tags": ["tag1", "tag2"],
  "domain": "LLMs",
  "severity": "normal"
}

Article Content:
${content}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  let res: Response | null = null;
  let modelUsed = model;
  let lastError = '';
  for (const candidateModel of Array.from(new Set([model, fallbackModel].filter(Boolean)))) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const attempt = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (attempt.ok) { res = attempt; modelUsed = candidateModel; break; }
    lastError = `Gemini ${candidateModel} returned HTTP ${attempt.status}: ${(await attempt.text()).slice(0, 300)}`;
  }
  if (!res) throw new Error(lastError || 'Gemini drafting failed.');

    const data = await res.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    const usageMetadata = data.usageMetadata || {};
    let promptTokens = usageMetadata.promptTokenCount || 0;
    let candidateTokens = usageMetadata.candidatesTokenCount || 0;
    let totalTokens = usageMetadata.totalTokenCount || (promptTokens + candidateTokens);

    let draft: DraftStoryResult;
    try {
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      draft = JSON.parse(jsonMatch ? jsonMatch[0] : textOutput);
    } catch (err) {
      console.error('Failed to parse Gemini response JSON:', textOutput, err);
      throw new Error('Gemini response was not valid JSON');
    }

    let wordCount = draft.crux?.trim().split(/\s+/).length || 0;
    if (wordCount < 180) {
      const expansionPrompt = `Rewrite the JSON draft below so the crux is 220-400 words in 4-6 short paragraphs. Keep its facts and classification, improve the lead and flow, explain the consequences in plain language, and do not introduce any fact absent from the source. Return JSON only with crux, tags, domain, and severity.\n\nSOURCE\n${content}\n\nCURRENT DRAFT\n${JSON.stringify(draft)}`;
      const retryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelUsed)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const retry = await fetch(retryUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: expansionPrompt }] }], generationConfig: { temperature: 0.45, maxOutputTokens: 4096, responseMimeType: 'application/json' } }) });
      if (!retry.ok) throw new Error(`Gemini expansion returned HTTP ${retry.status}: ${(await retry.text()).slice(0, 300)}`);
      const retryData = await retry.json();
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      try { draft = JSON.parse(retryText.match(/\{[\s\S]*\}/)?.[0] || retryText); }
      catch { throw new Error('Gemini expansion was not valid JSON.'); }
      const retryUsage = retryData.usageMetadata || {};
      promptTokens += retryUsage.promptTokenCount || 0;
      candidateTokens += retryUsage.candidatesTokenCount || 0;
      totalTokens += retryUsage.totalTokenCount || ((retryUsage.promptTokenCount || 0) + (retryUsage.candidatesTokenCount || 0));
      wordCount = draft.crux?.trim().split(/\s+/).length || 0;
    }
    if (wordCount < 140 || wordCount > 650) {
      throw new Error(`Gemini returned ${wordCount} words; the safe range is 140-650. The source may not contain enough verified detail for a longer story.`);
    }
    if (!domainList.includes(draft.domain)) draft.domain = domainHint || 'Research';
    if (!['normal', 'notable', 'major'].includes(draft.severity)) draft.severity = 'normal';
    if (!Array.isArray(draft.tags)) draft.tags = ['Technology'];
    const finalDomain = draft.domain || domainHint || 'Research';

    await prisma.$transaction([
      prisma.responseCache.upsert({
        where: { contentHash },
        update: { draftJson: JSON.stringify(draft) },
        create: { contentHash, draftJson: JSON.stringify(draft) }
      }),
      prisma.tokenUsage.create({
        data: {
          provider: 'google',
          modelName: modelUsed,
          promptTokens,
          candidateTokens,
          totalTokens,
          action: 'ai-draft',
          domain: finalDomain,
          isCacheHit: false
        }
      })
    ]);

    return {
      draft,
      usage: {
        promptTokens,
        candidateTokens,
        totalTokens,
        modelName: modelUsed,
        isCacheHit: false
      }
    };
}

export async function getTokenUsageStats() {
  const aggregate = await prisma.tokenUsage.aggregate({
    _sum: {
      promptTokens: true,
      candidateTokens: true,
      totalTokens: true
    },
    _count: {
      id: true
    }
  });

  const cacheHitCount = await prisma.tokenUsage.count({
    where: { isCacheHit: true }
  });

  const draftCount = await prisma.tokenUsage.count({
    where: { action: 'ai-draft' }
  });

  // Per-domain breakdown
  const domainStats = await prisma.tokenUsage.groupBy({
    by: ['domain'],
    _sum: {
      promptTokens: true,
      candidateTokens: true,
      totalTokens: true
    },
    _count: {
      id: true
    },
    where: {
      domain: { not: null }
    },
    orderBy: {
      _sum: {
        totalTokens: 'desc'
      }
    }
  });

  const domainBreakdown: DomainTokenStats[] = domainStats.map(d => ({
    domain: d.domain || 'Unknown',
    promptTokens: d._sum.promptTokens || 0,
    candidateTokens: d._sum.candidateTokens || 0,
    totalTokens: d._sum.totalTokens || 0,
    requestCount: d._count.id || 0,
    cacheHitCount: 0
  }));

  const totalUsed = aggregate._sum.totalTokens || 0;
  const promptUsed = aggregate._sum.promptTokens || 0;
  const candidateUsed = aggregate._sum.candidateTokens || 0;
  const requestCount = aggregate._count.id || 0;

  const freeTierLimit = 1_000_000;
  const remainingTokens = Math.max(0, freeTierLimit - totalUsed);

  return {
    promptTokens: promptUsed,
    candidateTokens: candidateUsed,
    totalTokens: totalUsed,
    requestCount,
    cacheHitCount,
    draftCount,
    freeTierLimit,
    remainingTokens,
    percentUsed: Math.min(100, Number(((totalUsed / freeTierLimit) * 100).toFixed(2))),
    domainBreakdown
  };
}
