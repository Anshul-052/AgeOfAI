import assert from 'node:assert/strict';
import test from 'node:test';
import { isAuthenticationPage } from '../src/proxy';

test('reader authentication never intercepts the admin login page', () => {
  assert.equal(isAuthenticationPage('/admin/login'), true);
});

test('reader login and callback remain authentication pages', () => {
  assert.equal(isAuthenticationPage('/login'), true);
  assert.equal(isAuthenticationPage('/auth/callback'), true);
  assert.equal(isAuthenticationPage('/admin'), false);
});
