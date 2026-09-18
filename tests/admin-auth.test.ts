import assert from 'node:assert/strict';
import test from 'node:test';
import { credentialsMatch, readAdminCredential } from '../src/lib/adminAuth';

test('admin credentials accept a configured bearer token', () => {
  const credential = readAdminCredential('Bearer long-random-secret');
  assert.equal(credentialsMatch(credential, 'long-random-secret'), true);
  assert.equal(credentialsMatch(credential, 'wrong-secret'), false);
});

test('admin credentials accept a browser Basic Auth password', () => {
  const encoded = Buffer.from('admin:long-random-secret').toString('base64');
  assert.equal(readAdminCredential(`Basic ${encoded}`), 'long-random-secret');
  assert.equal(credentialsMatch(readAdminCredential('Basic invalid'), 'long-random-secret'), false);
});

test('admin access stays disabled when no secret is configured', () => {
  assert.equal(credentialsMatch('anything', undefined), false);
  assert.equal(readAdminCredential(null), null);
});

