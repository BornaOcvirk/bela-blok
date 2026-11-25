// Network first, cache fallback: always fresh when online, still works offline at the card table.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // never cache the cloud (logins, stats)
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // revalidate, so index.html and bela.js never come from different versions
      .then(r => { const c = r.clone(); caches.open('bela').then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request))
  );
});
