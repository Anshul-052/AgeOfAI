import assert from 'node:assert/strict';
import test from 'node:test';
import { routeDraft } from '../src/lib/draftRouting';
import { localDraftPrompt, parseAndValidateDraft } from '../src/lib/draftValidation';

test('automatic routing keeps ordinary stories on the local primary model', () => {
  const route = routeDraft({ rawTitle: 'A new JavaScript runtime ships', rawContent: 'The release improves package loading.', suggestedDomain: 'Tools' });
  assert.equal(route.route, 'local-qwen');
  assert.equal(route.provider, 'ollama');
});

test('automatic routing reserves cloud review for high-risk stories', () => {
  const route = routeDraft({ rawTitle: 'Critical zero-day is actively exploited', rawContent: 'A security advisory asks users to patch.', suggestedDomain: 'Cybersecurity' });
  assert.equal(route.route, 'cloud-gemini');
  assert.equal(route.provider, 'google');
});

test('an editor model choice overrides automatic routing', () => {
  const route = routeDraft({ rawTitle: 'Security update', rawContent: 'A patch is available.', suggestedDomain: 'Cybersecurity' }, 'phi');
  assert.equal(route.route, 'local-phi');
});

test('draft validation normalizes classification but preserves an adequate story', () => {
  const words = Array.from({ length: 150 }, (_, index) => `word${index}`);
  const crux = [words.slice(0, 50), words.slice(50, 100), words.slice(100)].map(part => part.join(' ')).join('\n\n');
  const result = parseAndValidateDraft(JSON.stringify({ crux, tags: ['release'], domain: 'Unknown', severity: 'wrong' }), 'Tools');
  assert.equal(result.wordCount, 150);
  assert.equal(result.draft.domain, 'Tools');
  assert.equal(result.draft.severity, 'normal');
});

test('draft validation accepts a short source-supported brief without a lower word gate', () => {
  const result = parseAndValidateDraft(JSON.stringify({ crux: 'A concise verified update.', tags: [], domain: 'Tools', severity: 'normal' }));
  assert.equal(result.wordCount, 4);
});

test('draft validation accepts an 11-word brief in one paragraph', () => {
  const words = Array.from({ length: 11 }, (_, index) => `word${index}`);
  const crux = words.join(' ');
  assert.equal(parseAndValidateDraft(JSON.stringify({ crux, tags: ['brief'], domain: 'Tools', severity: 'normal' })).wordCount, 11);
});

test('draft validation rejects only an empty story at the lower boundary', () => {
  assert.throws(() => parseAndValidateDraft(JSON.stringify({ crux: '   ', tags: ['brief'], domain: 'Tools', severity: 'normal' })), /empty story/);
});

test('local drafting asks for context and impact without making length an acceptance rule', () => {
  const prompt = localDraftPrompt('A verified source report.');
  assert.match(prompt, /who is affected/i);
  assert.match(prompt, /practical impact/i);
  assert.match(prompt, /shorter article/i);
});
