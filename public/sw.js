self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('cardrive-pwa-v1').then((cache) =>
      cache.addAll([
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/maskable-512.png',
        '/icons/apple-touch-icon.png',
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Keep Cardrive's dynamic pages, APIs, auth and Supabase data network-first.
  // The service worker is intentionally limited to safe static PWA assets.
  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open('cardrive-pwa-v1').then((cache) => cache.put(event.request, copy));
          return response;
        })
      )
    );
  }
});
