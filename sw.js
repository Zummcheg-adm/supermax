// Супер-Макс: офлайн-кэш. Версия меняется при каждой сборке.
const V = 'supermax-7ca30aacd1';
const CORE = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(CORE))); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const nav = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
    const hit = nav ? await cache.match('./') : await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }
    catch (err) { const fb = await cache.match('./'); return fb || Response.error(); }
  })());
});
