// Service Worker for RadioCast Podcast Studio PWA
const CACHE_NAME = 'radiocast-v2-branding';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/branding/radiocast-icon.svg',
  '/branding/radiocast-readme-banner.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : undefined);
    })
  );
});
