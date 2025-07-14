// sw.js
const CACHE_NAME = 'HmiPWAcacheV1';
const urlsToCache = [
  '/',
  '/index.html',
  '/callback.html',
  '/app.js',
  '/imgA1.jpeg',
  '/imgA2.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
