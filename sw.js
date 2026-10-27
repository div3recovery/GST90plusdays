/* STO Recovery – offline support.
   App files: try the internet first (so updates reach everyone), fall back to the saved copy.
   Data requests to Google (POST) are never cached here. */
const CACHE = 'sto-recovery-v15';
const FILES = ['./', 'index.html', 'app.js', 'app.css', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo-badge.png', 'logo-badge-sm.png', 'deco-bldg.webp', 'deco-map.webp', 'foot-bldg.webp', 'mo-badge.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
