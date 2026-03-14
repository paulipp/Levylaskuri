const CACHE = 'levylasku-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&display=swap'
];

// Asennus: cacheta kaikki tiedostot
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cacheta paikalliset tiedostot ensin, fontit erikseen (voivat epäonnistua)
      const local = ASSETS.filter(a => !a.startsWith('http'));
      const external = ASSETS.filter(a => a.startsWith('http'));
      return cache.addAll(local).then(() =>
        Promise.allSettled(external.map(url => cache.add(url)))
      );
    })
  );
  self.skipWaiting();
});

// Aktivointi: poista vanhat cachet
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache first, network fallback
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
