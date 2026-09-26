import domains from '@/lib/domains.json';
import type { DraftStoryResult } from '@/lib/gemini';

export interface ValidatedDraft {
  draft: DraftStoryResult;
  wordCount: number;
}

export function parseAndValidateDraft(output: string, domainHint?: string | null): ValidatedDraft {
  const match = output.match(/\{[\s\S]*\}/);
  let value: unknown;
  try {
    value = JSON.parse(match?.[0] || output);
  } catch {
    throw new Error('The model did not return valid JSON.');
  }
  if (!value || typeof value !== 'object') throw new Error('The model returned an empty draft.');

  const record = value as Record<string, unknown>;
  const crux = typeof record.crux === 'string' ? record.crux.trim() : '';
  const wordCount = crux ? crux.split(/\s+/).length : 0;
  if (!crux) throw new Error('The model returned an empty story.');
  if (wordCount > 650) throw new Error(`The draft contains ${wordCount} words; the maximum supported length is 650.`);
  const allowedDomains = domains.map(domain => domain.id);
  const domain = typeof record.domain === 'string' && allowedDomains.includes(record.domain)
    ? record.domain
    : (domainHint && allowedDomains.includes(domainHint) ? domainHint : 'Research');
  const severity = record.severity === 'notable' || record.severity === 'major' ? record.severity : 'normal';
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim())).slice(0, 3)
    : [];

  return { draft: { crux, domain, severity, tags: tags.length ? tags : ['Technology'] }, wordCount };
}

export function localDraftPrompt(source: string): string {
  const domainList = domains.map(domain => domain.id).join(', ');
  return `You are an experienced technology journalist writing for AgeOfAI, a Sunday magazine readers should look forward to. Write an original, accurate article from only the supplied source material.

Aim for a substantial 120-180 word story in 2-4 short paragraphs, expanding further when the evidence supports it. Do not merely report what happened. Give the reader:
1. a strong factual lead that states the development clearly;
2. enough plain-language context to understand the technology or decision;
3. the practical impact: who is affected, what changes, what opportunity or risk follows, and why the development matters now;
4. an important limitation, uncertainty, or next step when the source provides one.

When the story is a new AI tool, plugin, model, coding agent, API, or student offer, make the utility concrete: what someone can do with it, who can access it, cost or plan limits when stated, setup or platform requirements, and one realistic use case for a student, maker, or vibe coder. Do not turn the article into promotion.

Prefer concrete explanation over adjectives and avoid repeating the headline. Write with the clarity and rhythm of a good magazine journalist: informed, curious, direct, and readable for someone new to the subject. Use only as much detail as the evidence supports. Never invent facts, quotes, dates, numbers, reactions, motives, or impacts, and never pad a thin source. A brief source may produce a shorter article; completeness and accuracy matter more than hitting a number.

Return only valid JSON with keys crux, tags, domain, and severity. tags must contain 1-3 strings. domain must be one of: ${domainList}. severity must be normal, notable, or major.

SOURCE MATERIAL
${source}`;
}
