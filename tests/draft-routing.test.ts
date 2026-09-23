import assert from 'node:assert/strict';
import test from 'node:test';
import { routeDraft } from '../src/lib/draftRouting';
import { parseAndValidateDraft } from '../src/lib/draftValidation';

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

test('draft validation rejects one-line undersized output', () => {
  assert.throws(() => parseAndValidateDraft(JSON.stringify({ crux: 'Too short.', tags: [], domain: 'Tools', severity: 'normal' })), /2 words/);
});

test('draft validation accepts a 50-word brief in two paragraphs', () => {
  const words = Array.from({ length: 50 }, (_, index) => `word${index}`);
  const crux = `${words.slice(0, 25).join(' ')}\n\n${words.slice(25).join(' ')}`;
  assert.equal(parseAndValidateDraft(JSON.stringify({ crux, tags: ['brief'], domain: 'Tools', severity: 'normal' })).wordCount, 50);
});

test('draft validation still rejects a one-paragraph brief', () => {
  const crux = Array.from({ length: 70 }, (_, index) => `word${index}`).join(' ');
  assert.throws(() => parseAndValidateDraft(JSON.stringify({ crux, tags: ['brief'], domain: 'Tools', severity: 'normal' })), /at least 2/);
});
