const CACHE_NAME = 'along-v1';
const MAP_TILE_CACHE = 'along-map-tiles-v1';
const DATA_CACHE = 'along-data-v1';

// App shell files to cache
const APP_SHELL = [
  '/',
  '/index.html',
];

// Install - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== MAP_TILE_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch - stale-while-revalidate for map tiles, network-first for API, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Map tile caching (OpenStreetMap tiles)
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('tiles.stadiamaps.com')) {
    event.respondWith(
      caches.open(MAP_TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request).catch(() => null);
        if (response && response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // Network-first for API calls with cache fallback
  if (url.pathname.includes('/api/') || url.hostname.includes('base44')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok && event.request.method === 'GET') {
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_INCIDENTS') {
    caches.open(DATA_CACHE).then((cache) => {
      // Store incidents data for offline use
      const response = new Response(JSON.stringify(event.data.incidents), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/offline-incidents', response);
    });
  }
  if (event.data?.type === 'CACHE_ALERTS') {
    caches.open(DATA_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(event.data.alerts), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/offline-alerts', response);
    });
  }
});
