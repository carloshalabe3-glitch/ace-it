var CACHE_NAME = 'ace-it-v8';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './grades.js',
  './store.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' skips the browser's HTTP cache (GitHub Pages lets files sit there
      // for 10 minutes), so a new version never gets saved with old files inside it.
      .then(function (cache) { return cache.addAll(ASSETS.map(function (url) { return new Request(url, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200 && new URL(event.request.url).origin === self.location.origin) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () {
        // Offline and not cached: navigations fall back to the app itself.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });
    })
  );
});
