// sw.js
const CACHE_NAME = 'HmiPWAcacheV1';
const urlsToCache = [
  '/Aws3b.io/',
  '/Aws3b.io/index.html',
  '/Aws3b.io/callback.html',
  '/Aws3b.io/app.js',
  '/Aws3b.io/MickA1.png',
  '/Aws3b.io/PicA2.png'
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
