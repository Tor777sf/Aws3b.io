// sw.js
const CACHE_NAME = 'HmiPWAcacheV1';
const urlsToCache = [
  '/Aws3b.io/',
  '/Aws3b.io/index.html',
  '/Aws3b.io/callback.html',
  '/Aws3b.io/app.js',
  '/Aws3b.io/ImgA1.jpeg',
  '/Aws3b.io/ImgA2.jpeg'
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
