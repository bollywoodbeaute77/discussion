// Service worker — coque de l'appli uniquement (jamais les données/API)
const CACHE = 'discussion-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './doodle.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Ne jamais mettre en cache les appels Supabase (données, fichiers, API)
  if (url.hostname.endsWith('supabase.co')) return;
  if (e.request.method !== 'GET') return;
  // Réseau d'abord pour la page (toujours la dernière version), cache en secours
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
    return;
  }
  // Cache d'abord pour le reste de la coque
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request)));
});
