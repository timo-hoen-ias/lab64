// Service Worker: Spiel offline spielbar machen.
// Netzwerk zuerst (damit neue Versionen sofort ankommen), sonst aus dem Cache.
// VERSION ersetzt der Pages-Workflow durch den Commit – so ändert sich sw.js bei jedem Deploy
// und die offene App merkt, dass es eine neue Version gibt.
const VERSION = 'dev';
const CACHE = 'moll64-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './vendor/three.module.js', './src/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './fonts/fredoka.woff2', './fonts/luckiest-guy.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

// Erst auf Knopfdruck („Neue Version – neu laden“) übernehmen, damit nichts mitten im Spiel umspringt.
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
