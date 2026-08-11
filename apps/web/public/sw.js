const CACHE_NAME = 'zets-v1';
const STATIC_ASSETS = [
  '/',
  '/public',
  '/offline/bid-draft',
  '/manifest.json',
  '/offline.html',
];

// Install: cache the shell and offline fallback pages.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activate: clean up old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first for API calls, cache-first for static assets.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: try network, fall back to offline JSON response.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then(
          (cached) =>
            cached ||
            new Response(
              JSON.stringify({
                ok: false,
                message: 'You are offline. Drafts saved on this device will sync automatically when connectivity returns.',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            ),
        ),
      ),
    );
    return;
  }

  // Static assets and navigation: serve from cache, fall back to network and update cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (
            response.status === 200 &&
            (request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'image' ||
              request.mode === 'navigate')
          ) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    }),
  );
});
