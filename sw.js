/* ============================================================
   Studihome Service Worker
   Strategy: network-first for navigations, stale-while-revalidate
   for same-origin static assets. Cross-origin (Supabase, CDN,
   fonts) is NEVER touched. No auth/API responses are cached.
   ------------------------------------------------------------
   Security & freshness guarantees:
   - Only GET, same-origin requests are handled.
   - Navigations always hit the network first, so new deploys
     are visible immediately (fallback to cached shell offline).
   - Versioned cache names; old caches purged on activation.
   - Runtime cache capped to avoid unbounded growth.
   ============================================================ */
'use strict';

const SHELL_CACHE = 'studihome-shell-v1';
const RUNTIME_CACHE = 'studihome-runtime-v1';
const RUNTIME_MAX_ENTRIES = 80;
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase / CDN / fonts

  // Never serve the SW or manifest from cache.
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') return;

  // App navigations: network-first so updates are always fresh.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            cache.put(req, copy).then(() => trimRuntime(cache));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});

async function trimRuntime(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > RUNTIME_MAX_ENTRIES) {
      await cache.delete(keys[0]);
    }
  } catch (_) {
    /* cache trimming is best-effort */
  }
}