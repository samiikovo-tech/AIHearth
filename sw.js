// Minimal service worker: cache app shell
const CACHE_NAME = 'aihearth-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/characters_seed.json', '/localization_sk.json'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(self.skipWaiting()));
});
self.addEventListener('activate', e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
