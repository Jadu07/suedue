const CACHE_NAME = 'suedue-pwa-cache-v2';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip API routes, Next.js internal data, RSC streams, and non-HTTP requests
  // Caching these breaks Next.js App Router hydration and Server Actions!
  if (
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.has('RSC') ||
    event.request.headers.has('Next-Router-State-Tree') ||
    event.request.headers.has('Next-Router-Prefetch')
  ) {
    return; 
  }

  event.respondWith(
    // Stale-while-revalidate strategy for maximum speed on splash screen / HTML
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for failed network requests
      });

      return cachedResponse || fetchPromise;
    })
  );
});
