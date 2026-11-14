// Network first, cache fallback: always fresh when online, still works offline at the card table.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open('bela').then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request))
  );
});
