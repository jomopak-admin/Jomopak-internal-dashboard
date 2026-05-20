/* JomoPak service worker — Phase 17 (Task #103).
 *
 * Strategy:
 *   • Cache the app shell on install (index.html + assets the browser
 *     fetches as part of the shell load).
 *   • On fetch, network-first for navigation requests with a cache
 *     fallback. Cache-first for static assets we recognise.
 *   • POST requests are NOT auto-queued by the SW. The page itself
 *     persists pending PODs in IndexedDB (see podQueue.ts) and retries
 *     them when navigator.onLine flips back to true.
 *
 * This is intentionally minimal. A workbox-based setup with deeper
 * runtime caching and background-sync is a future upgrade once we
 * confirm the use pattern.
 */

const CACHE = 'jomopak-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Don't try to cache supabase / external API calls.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/index.html')))
    );
    return;
  }

  // Static assets — cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
