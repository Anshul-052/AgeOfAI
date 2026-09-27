import assert from 'node:assert/strict';
import test from 'node:test';
import { friendlyAuthError } from '../src/lib/authMessages';

test('auth email limits are explained without exposing backend wording', () => {
  assert.match(friendlyAuthError(new Error('email rate limit exceeded'), 'recovery'), /temporarily busy/i);
  assert.doesNotMatch(friendlyAuthError(new Error('email rate limit exceeded'), 'recovery'), /rate limit/i);
});

test('invalid credentials direct readers to password recovery', () => {
  assert.match(friendlyAuthError(new Error('Invalid login credentials'), 'login'), /Forgot password/i);
});

test('existing accounts are directed back to sign in or recovery', () => {
  assert.match(friendlyAuthError(new Error('User already registered'), 'signup'), /Sign in/i);
});

test('an unavailable social provider has a useful temporary message', () => {
  assert.match(friendlyAuthError(new Error('Unsupported provider: provider is not enabled'), 'login'), /being activated/i);
});
