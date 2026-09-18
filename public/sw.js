const CACHE_NAME = 'ageofai-v3';
const STATIC_ASSETS = [
  '/',
  '/bookmarks',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if ((key.startsWith('ages-of-ai-') || key.startsWith('ageofai-')) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Editorial pages, APIs, third-party requests and RSC payloads are network-only.
  if (url.origin !== self.location.origin ||
      /^\/(admin|api)(\/|$)/.test(url.pathname) ||
      event.request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  const isPage = event.request.mode === 'navigate';
  const isAsset = url.pathname.startsWith('/_next/static/') || STATIC_ASSETS.includes(url.pathname) ||
    ['style', 'script', 'font', 'image'].includes(event.request.destination);
  if (!isPage && !isAsset) return;

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response && response.status === 200 && !response.redirected &&
            !/no-store|private/i.test(response.headers.get('Cache-Control') || '')) {
          const responseClone = response.clone();
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, responseClone);
          } catch { /* Cache quota failures must not interrupt online reading. */ }
        }
        return response;
      })
      .catch(() => {
        return caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (isPage) return new Response('This page is not saved offline. Reconnect to read it.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
          return Response.error();
        });
      })
  );
});
