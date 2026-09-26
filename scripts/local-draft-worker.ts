import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { draftStoryWithGemini } from '../src/lib/gemini';
import { localDraftPrompt, parseAndValidateDraft, type ValidatedDraft } from '../src/lib/draftValidation';
import { buildDraftingSource } from '../src/lib/sourceContent';

interface OllamaResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
  total_duration?: number;
  eval_duration?: number;
}

const once = process.argv.includes('--once');
const pollMs = Math.max(2_000, Number.parseInt(process.env.LOCAL_EDITOR_POLL_MS || '10000', 10));
const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
let stopping = false;

process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

function parseCompletenessDraft(output: string, fallback: ValidatedDraft, domainHint?: string | null): ValidatedDraft {
  const match = output.match(/\{[\s\S]*\}/);
  const value = JSON.parse(match?.[0] || output) as Record<string, unknown>;
  if (typeof value.crux === 'string' && value.crux.trim()) return parseAndValidateDraft(JSON.stringify(value), domainHint);
  const sections = ['lead', 'background', 'mechanism', 'impact', 'outlook']
    .map(key => typeof value[key] === 'string' ? value[key].trim() : '')
    .filter(Boolean);
  if (!sections.length) throw new Error('The completeness rewrite did not return article sections.');
  const draft = {
    crux: `${sections.slice(0, 2).join(' ')}\n\n${sections.slice(2).join(' ')}`,
    tags: Array.isArray(value.tags) ? value.tags : fallback.draft.tags,
    domain: typeof value.domain === 'string' ? value.domain : fallback.draft.domain,
    severity: typeof value.severity === 'string' ? value.severity : fallback.draft.severity,
  };
  return parseAndValidateDraft(JSON.stringify(draft), domainHint);
}

async function draftWithOllama(model: string, source: string, domainHint?: string | null) {
  const startedAt = Date.now();
  let prompt = localDraftPrompt(source);
  let promptTokens = 0;
  let candidateTokens = 0;
  let generationDurationMs = 0;
  let lastError: Error | null = null;
  let best: ValidatedDraft | null = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        format: 'json',
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: attempt === 1 ? 0.45 : 0.25, num_ctx: 8192, num_predict: 1400 },
      }),
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    if (!response.ok) throw new Error(`Ollama ${model} returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const result = await response.json() as OllamaResponse;
    promptTokens += result.prompt_eval_count || 0;
    candidateTokens += result.eval_count || 0;
    generationDurationMs += result.eval_duration ? Math.round(result.eval_duration / 1_000_000) : 0;
    try {
      const validated: ValidatedDraft = best
        ? parseCompletenessDraft(result.message?.content || '', best, domainHint)
        : parseAndValidateDraft(result.message?.content || '', domainHint);
      if (!best || validated.wordCount > best.wordCount) best = validated;
      const strongest = best;
      if (strongest.wordCount < 90) {
        if (attempt === 4) break;
        lastError = new Error(`Draft pass ${attempt} produced only ${strongest.wordCount} words.`);
        prompt = `You are expanding a thin technology brief using only the supplied evidence. Do not summarize. Fill five distinct reporting sections, each with 25-45 words when the evidence supports it. Never repeat a point, speculate, or invent facts. If a detail is not established, use the outlook section to state what remains unknown.\n\nReturn exactly one JSON object with this schema:\n{"lead":"what happened and when","background":"context a newcomer needs","mechanism":"how the technology, decision, or event works","impact":"who is affected and the practical consequence","outlook":"next step, limitation, or unresolved question","tags":["1-3 tags"],"domain":"${strongest.draft.domain}","severity":"${strongest.draft.severity}"}\n\nCURRENT DRAFT\n${JSON.stringify(strongest.draft)}\n\nSOURCE EVIDENCE\n${source}`;
        continue;
      }
      return {
        ...best,
        metrics: {
          promptTokens, candidateTokens, totalTokens: promptTokens + candidateTokens,
          totalDurationMs: Date.now() - startedAt,
          generationDurationMs: generationDurationMs || null,
          rewriteUsed: attempt > 1,
          rewritePasses: attempt - 1,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      prompt = `${localDraftPrompt(source)}\n\nYour previous attempt failed validation: ${lastError.message} Rewrite it as a complete, source-grounded article and return one JSON object. Do not include reasoning, markdown, or commentary.`;
    }
  }
  if (best) {
    for (let supplement = 1; supplement <= 3 && best.wordCount < 90; supplement += 1) {
      const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, stream: false, think: false,
          messages: [{ role: 'user', content: `Write exactly three new reporting sentences totaling 45-65 words for the article below. Use only facts or cautious limitations supported by SOURCE EVIDENCE. Cover missing context, mechanism, impact, or next step. Do not repeat any existing point. Return only the three plain-text sentences with no JSON, heading, markdown, or commentary.\n\nARTICLE\n${best.draft.crux}\n\nSOURCE EVIDENCE\n${source}` }],
          options: { temperature: 0.2, num_ctx: 8192, num_predict: 500 },
        }),
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
      if (!response.ok) break;
      const result = await response.json() as OllamaResponse;
      promptTokens += result.prompt_eval_count || 0;
      candidateTokens += result.eval_count || 0;
      generationDurationMs += result.eval_duration ? Math.round(result.eval_duration / 1_000_000) : 0;
      try {
        const addition = (result.message?.content || '').replace(/^```(?:text)?|```$/g, '').trim();
        if (!addition) continue;
        const expanded = parseAndValidateDraft(JSON.stringify({ ...best.draft, crux: `${best.draft.crux}\n\n${addition}` }), domainHint);
        if (expanded.wordCount > best.wordCount) best = expanded;
      } catch { /* Keep the longest valid article and try another supplement. */ }
    }
    return {
      ...best,
      metrics: {
        promptTokens, candidateTokens, totalTokens: promptTokens + candidateTokens,
        totalDurationMs: Date.now() - startedAt, generationDurationMs: generationDurationMs || null,
        rewriteUsed: true, rewritePasses: 3,
      },
    };
  }
  throw lastError || new Error('The local model did not return a valid draft.');
}

async function claimNext() {
  const candidate = await prisma.ingestedCandidate.findFirst({
    where: { status: 'queued' },
    orderBy: [{ draftRequestedAt: 'asc' }, { createdAt: 'asc' }],
  });
  if (!candidate) return null;
  const claimed = await prisma.ingestedCandidate.updateMany({
    where: { id: candidate.id, status: 'queued' },
    data: { status: 'drafting', draftStartedAt: new Date(), draftError: null, draftAttempts: { increment: 1 } },
  });
  return claimed.count === 1 ? { ...candidate, status: 'drafting' } : null;
}

async function processCandidate(candidate: NonNullable<Awaited<ReturnType<typeof claimNext>>>) {
  const source = await buildDraftingSource(candidate.rawTitle, candidate.rawContent, candidate.sourceUrl);
  const primaryModel = candidate.draftModel || process.env.OLLAMA_PRIMARY_MODEL || 'qwen3.5:4b';
  const fallbackModel = primaryModel === (process.env.OLLAMA_FALLBACK_MODEL || 'phi4-mini')
    ? (process.env.OLLAMA_PRIMARY_MODEL || 'qwen3.5:4b')
    : (process.env.OLLAMA_FALLBACK_MODEL || 'phi4-mini');

  try {
    if (candidate.draftRoute === 'cloud-gemini') {
      const { draft, usage } = await draftStoryWithGemini(source, candidate.suggestedDomain || undefined);
      await prisma.ingestedCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'drafted', draftJson: JSON.stringify(draft), draftProvider: 'google',
          draftModel: usage.modelName, draftCompletedAt: new Date(), draftError: null,
          draftMetricsJson: JSON.stringify({ ...usage, wordCount: draft.crux.trim().split(/\s+/).length }),
        },
      });
      console.log(`[drafted] ${candidate.id} | Gemini ${usage.modelName} | ${candidate.rawTitle}`);
      return;
    }

    const attempts = Array.from(new Set([primaryModel, fallbackModel]));
    let lastError: Error | null = null;
    for (const model of attempts) {
      try {
        const result = await draftWithOllama(model, source, candidate.suggestedDomain);
        await prisma.$transaction([
          prisma.ingestedCandidate.update({
            where: { id: candidate.id },
            data: {
              status: 'drafted', draftJson: JSON.stringify(result.draft), draftProvider: 'ollama',
              draftModel: model, draftRoute: model === primaryModel ? candidate.draftRoute : (model.includes('phi') ? 'local-phi' : 'local-qwen'),
              draftCompletedAt: new Date(), draftError: null,
              draftMetricsJson: JSON.stringify({ ...result.metrics, wordCount: result.wordCount, fallbackUsed: model !== primaryModel }),
            },
          }),
          prisma.tokenUsage.create({
            data: {
              provider: 'ollama', modelName: model, promptTokens: result.metrics.promptTokens,
              candidateTokens: result.metrics.candidateTokens, totalTokens: result.metrics.totalTokens,
              action: 'local-ai-draft', domain: result.draft.domain, isCacheHit: false,
            },
          }),
        ]);
        console.log(`[drafted] ${candidate.id} | Ollama ${model} | ${result.wordCount} words | ${candidate.rawTitle}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[retry] ${candidate.id} | ${model} | ${lastError.message}`);
      }
    }
    throw lastError || new Error('Every local drafting model failed.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.ingestedCandidate.update({
      where: { id: candidate.id },
      data: { status: 'failed', draftError: message.slice(0, 1500), draftCompletedAt: new Date() },
    });
    console.error(`[failed] ${candidate.id} | ${message}`);
  }
}

async function main() {
  const recovered = await prisma.ingestedCandidate.updateMany({
    where: { status: 'drafting', draftStartedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } },
    data: { status: 'queued', draftError: 'Recovered after an interrupted worker run.' },
  });
  if (recovered.count) console.log(`[recovered] ${recovered.count} interrupted draft(s)`);
  console.log(`AgeOfAI local editor is ready. Polling every ${pollMs / 1000}s${once ? ' (one story)' : ''}.`);

  do {
    const candidate = await claimNext();
    if (candidate) await processCandidate(candidate);
    else if (once) console.log('[idle] No queued stories.');
    if (!once && !stopping) await delay(pollMs);
  } while (!once && !stopping);
}

main()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
