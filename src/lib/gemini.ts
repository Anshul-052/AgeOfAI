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
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
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
          modelName: 'gemini-1.5-flash',
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
        modelName: 'gemini-1.5-flash',
        isCacheHit: true
      }
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // If API key is missing or unconfigured placeholder, generate structured fallback draft
  if (!apiKey || apiKey.includes('YourGeminiKey') || apiKey.startsWith('AQ.')) {
    console.warn('GEMINI_API_KEY unconfigured or invalid key provided. Using structured heuristic drafting fallback.');
    
    const cruxText = content.length > 600 ? content.slice(0, 600) + '...' : content;
    const fallbackDraft: DraftStoryResult = {
      crux: cruxText,
      tags: ["Tech", "Engineering"],
      domain: domainHint || "LLMs",
      severity: "normal"
    };

    try {
      await prisma.responseCache.upsert({
        where: { contentHash },
        update: { draftJson: JSON.stringify(fallbackDraft) },
        create: { contentHash, draftJson: JSON.stringify(fallbackDraft) }
      });
    } catch (cacheErr) {
      console.error('Failed to store fallback response cache:', cacheErr);
    }

    return {
      draft: fallbackDraft,
      usage: {
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        modelName: 'heuristic-drafter',
        isCacheHit: false
      }
    };
  }

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const domainList = domains.map(domain => domain.id);

  const prompt = `You are an expert tech journalist writing for "AgeOfAI," a weekly broadsheet magazine for engineers and students.
Given the following raw text or article content, generate a concise, engaging summary (crux) of 2-3 paragraphs.
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
      temperature: 0.2,
      maxOutputTokens: 1000,
      responseMimeType: "application/json"
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Gemini API HTTP Error:', res.status, errorBody);
      throw new Error(`Gemini API returned status ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    const usageMetadata = data.usageMetadata || {};
    const promptTokens = usageMetadata.promptTokenCount || 0;
    const candidateTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (promptTokens + candidateTokens);

    let draft: DraftStoryResult;
    try {
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      draft = JSON.parse(jsonMatch ? jsonMatch[0] : textOutput);
    } catch (err) {
      console.error('Failed to parse Gemini response JSON:', textOutput, err);
      throw new Error('Gemini response was not valid JSON');
    }

    // Save to ResponseCache
    try {
      await prisma.responseCache.upsert({
        where: { contentHash },
        update: { draftJson: JSON.stringify(draft) },
        create: { contentHash, draftJson: JSON.stringify(draft) }
      });
    } catch (cacheErr) {
      console.error('Failed to store response cache:', cacheErr);
    }

    // Persist TokenUsage with domain
    const finalDomain = draft.domain || domainHint || 'LLMs';
    try {
      await prisma.tokenUsage.create({
        data: {
          provider: 'google',
          modelName: model,
          promptTokens,
          candidateTokens,
          totalTokens,
          action: 'ai-draft',
          domain: finalDomain,
          isCacheHit: false
        }
      });
    } catch (dbErr) {
      console.error('Failed to log token usage:', dbErr);
    }

    return {
      draft,
      usage: {
        promptTokens,
        candidateTokens,
        totalTokens,
        modelName: model,
        isCacheHit: false
      }
    };
  } catch (apiError) {
    console.warn('Gemini API request failed. Falling back to heuristic drafting:', apiError);

    const cruxText = content.length > 600 ? content.slice(0, 600) + '...' : content;
    const fallbackDraft: DraftStoryResult = {
      crux: cruxText,
      tags: ["Tech", "Engineering"],
      domain: domainHint || "LLMs",
      severity: "normal"
    };

    return {
      draft: fallbackDraft,
      usage: {
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        modelName: 'fallback-drafter',
        isCacheHit: false
      }
    };
  }
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
