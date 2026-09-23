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
  if (wordCount < 50 || wordCount > 650) {
    throw new Error(`The draft contains ${wordCount} words; the accepted range is 50-650.`);
  }
  const paragraphCount = crux.split(/\n\s*\n/).filter(Boolean).length;
  if (paragraphCount < 2) throw new Error(`The draft contains ${paragraphCount} paragraph; at least 2 are required.`);

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

Aim for 120-300 words in 2-5 short paragraphs, using only as much length as the source can support. Start with a strong factual lead, explain what happened, how the technology works in plain language, why it matters, its practical consequences, and any limitation stated by the source. Write with a natural magazine voice. Keep it accessible. Never invent facts, quotes, dates, numbers, reactions, or motives. If the source is thin, stay concise rather than padding it with speculation. A valid brief must still contain at least 50 words and 2 paragraphs.

Return only valid JSON with keys crux, tags, domain, and severity. tags must contain 1-3 strings. domain must be one of: ${domainList}. severity must be normal, notable, or major.

SOURCE MATERIAL
${source}`;
}
