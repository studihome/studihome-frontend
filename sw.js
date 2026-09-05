/* ============================================================
   Studihome Service Worker v2
   ─────────────────────────────────────────────────────────────
   Strategy:  network-first for navigations (deploys visible
              immediately; precached shell as offline fallback)
              stale-while-revalidate for same-origin static
              assets with query-string normalization (the HTML
              references assets with ?v= cache-busters).
   Cross-origin: NEVER touched (Supabase, CDN, fonts, GA).
   Security:  only GET, same-origin. Auth tokens never cached.
   Offline:   CSS + core JS are precached so the shell renders
              with correct layout even without a network.
   ============================================================ */
'use strict';

const SHELL_CACHE  = 'studihome-shell-v2';
const RUNTIME_CACHE = 'studihome-runtime-v1';
const RUNTIME_MAX   = 80;

/* App shell — precached at install.
   The HTML references these with ?v= suffixes; the runtime
   handler strips query strings before cache.match so one
   precached entry serves every versioned request. */
const APP_SHELL = [
  '/',
  '/index.html',
  '/dapur.html',
  '/tailwind-compiled.css',
  '/supabase-sdk-loader-v1.js',
  '/supabase-config.js'
];

/* ── Install ──────────────────────────────────────────────── */
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate ─────────────────────────────────────────────── */
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* ── Fetch ────────────────────────────────────────────────── */
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // cross-origin: untouched
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') return;

  /* Navigations — network-first, precached shell as offline fallback */
  if (req.mode === 'navigate') {
    evt.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req.url, copy));
          }
          return res;
        })
        .catch(async () => {
          /* /dapur/*  →  /dapur.html;  everything else  →  /index.html */
          if (url.pathname.startsWith('/dapur')) return caches.match('/dapur.html');
          return caches.match('/index.html');
        })
    );
    return;
  }

  /* Same-origin static assets — stale-while-revalidate.
     Query strings are stripped before matching so a precached
     /tailwind-compiled.css serves ?v=20260825r6 requests. */
  evt.respondWith(
    (async () => {
      const cache    = await caches.open(RUNTIME_CACHE);
      const cleanKey = url.origin + url.pathname;
      const cached   = await cache.match(cleanKey) || await cache.match(req);

      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            cache.put(cleanKey, copy).then(() => trimCache(cache));
          }
          return res;
        })
        .catch(() => cached);

      return cached || network;
    })()
  );
});

/* Keep runtime cache bounded */
async function trimCache(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > RUNTIME_MAX) await cache.delete(keys[0]);
  } catch (_) { /* best-effort */ }
}