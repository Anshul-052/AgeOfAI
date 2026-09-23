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
  if (wordCount <= 10 || wordCount > 650) {
    throw new Error(`The draft contains ${wordCount} words; a valid story must contain more than 10 and no more than 650.`);
  }
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
  return `You are an experienced technology journalist writing for AgeOfAI. Write an original, accurate story from only the supplied source material.

Write a focused story of about 90 words in 1-3 short paragraphs. Start with a strong factual lead, then explain what happened and why it matters in plain language. Use only as much detail as the source supports. Write with a natural magazine voice. Never invent facts, quotes, dates, numbers, reactions, or motives, and never pad a thin source.

Return only valid JSON with keys crux, tags, domain, and severity. tags must contain 1-3 strings. domain must be one of: ${domainList}. severity must be normal, notable, or major.

SOURCE MATERIAL
${source}`;
}
