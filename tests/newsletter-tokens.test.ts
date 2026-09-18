import assert from 'node:assert/strict';
import test from 'node:test';
import { createUnsubscribeToken, verifyUnsubscribeToken } from '../src/lib/newsletterTokens';

const secret = 'test-secret-that-is-at-least-thirty-two-characters';

test('unsubscribe tokens round-trip normalized email addresses', () => {
  const token = createUnsubscribeToken(' Reader@Example.COM ', secret);
  assert.equal(verifyUnsubscribeToken(token, secret), 'reader@example.com');
});

test('unsubscribe tokens reject tampering and another secret', () => {
  const token = createUnsubscribeToken('reader@example.com', secret);
  assert.equal(verifyUnsubscribeToken(`${token}x`, secret), null);
  assert.equal(verifyUnsubscribeToken(token, 'another-secret-that-is-at-least-thirty-two'), null);
});

test('unsubscribe tokens require a strong signing secret', () => {
  assert.throws(() => createUnsubscribeToken('reader@example.com', 'short'));
});
