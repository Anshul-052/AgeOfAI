export type DraftPreference = 'auto' | 'qwen' | 'phi' | 'gemini';
export type DraftRoute = 'local-qwen' | 'local-phi' | 'cloud-gemini';

export interface DraftRouteDecision {
  route: DraftRoute;
  provider: 'ollama' | 'google';
  model: string;
  reason: string;
}

const HIGH_RISK_DOMAINS = new Set([
  'Cybersecurity',
  'Health & Biotech',
  'Fintech',
  'Crypto & Web3',
  'Policy & Society',
]);

const HIGH_RISK_TERMS = /\b(zero[- ]day|actively exploited|breach|ransomware|patient|clinical|drug|diagnos|financial advice|investment|regulat|election|lawsuit|fatal|death|sanction)\b/i;

export function isDraftPreference(value: unknown): value is DraftPreference {
  return value === 'auto' || value === 'qwen' || value === 'phi' || value === 'gemini';
}

export function routeDraft(candidate: {
  rawTitle: string;
  rawContent: string;
  suggestedDomain?: string | null;
}, preference: DraftPreference = 'auto'): DraftRouteDecision {
  const qwenModel = process.env.OLLAMA_PRIMARY_MODEL || 'qwen3.5:4b';
  const phiModel = process.env.OLLAMA_FALLBACK_MODEL || 'phi4-mini';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  if (preference === 'qwen') return { route: 'local-qwen', provider: 'ollama', model: qwenModel, reason: 'Qwen selected by the editor.' };
  if (preference === 'phi') return { route: 'local-phi', provider: 'ollama', model: phiModel, reason: 'Phi selected by the editor.' };
  if (preference === 'gemini') return { route: 'cloud-gemini', provider: 'google', model: geminiModel, reason: 'Gemini selected by the editor.' };

  const text = `${candidate.rawTitle}\n${candidate.rawContent}`;
  if (HIGH_RISK_DOMAINS.has(candidate.suggestedDomain || '') && HIGH_RISK_TERMS.test(text)) {
    return {
      route: 'cloud-gemini',
      provider: 'google',
      model: geminiModel,
      reason: 'Automatic routing reserved cloud review for a high-risk subject.',
    };
  }

  return {
    route: 'local-qwen',
    provider: 'ollama',
    model: qwenModel,
    reason: 'Automatic routing selected the local primary writer.',
  };
}
