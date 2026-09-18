import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function worker() {
  const handlers = {};
  const saved = new Map();
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://ages.test' }, addEventListener: (type, fn) => { handlers[type] = fn; } },
    URL, Response,
    fetch: async () => { throw new Error('offline'); },
    caches: { open: async () => ({ match: async req => saved.get(req.url) }) },
  });
  const request = (path, extra = {}) => {
    let result;
    handlers.fetch({ request: { url: `https://ages.test${path}`, method: 'GET', mode: 'navigate', headers: new Headers(), ...extra }, respondWith: promise => { result = promise; } });
    return result;
  };
  return { request, saved };
}

test('private and API requests are never served from offline cache', () => {
  const { request } = worker();
  for (const path of ['/admin', '/admin/inbox', '/api/admin/inbox', '/api/unsubscribe', '/?_rsc=abc']) assert.equal(request(path), undefined);
  assert.equal(request('/', { method: 'POST' }), undefined);
});
test('offline reader serves the requested saved page and does not substitute HTML for assets', async () => {
  const { request, saved } = worker();
  saved.set('https://ages.test/issues/saved', new Response('saved edition'));
  assert.equal(await (await request('/issues/saved')).text(), 'saved edition');
  assert.equal((await request('/issues/missing')).status, 503);
  assert.equal((await request('/_next/static/missing.js', { mode: 'cors', destination: 'script' })).type, 'error');
});
