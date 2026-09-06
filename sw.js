/* ============================================================
   Studihome Service Worker v3
   ─────────────────────────────────────────────────────────────
   Strategy:
     - Navigations: network-first (deploys visible immediately);
       on network failure fall back to the precached shell for the
       route family, and finally to a synthetic offline Response —
       the fetch handler NEVER resolves with `undefined` (that
       previously produced "Failed to convert value to 'Response'").
     - Same-origin static assets: stale-while-revalidate with
       query-string normalization (?v= cache-busters are stripped
       before cache.match). If a request fails and nothing is
       cached, a synthetic Response is returned instead of an
       uncaught rejection.
   Cross-origin: NEVER touched (Supabase, CDN, fonts, embeds).
   Security: only GET, same-origin. Auth tokens never cached.
   Install: per-URL tolerant — one failing asset no longer wipes
            the whole shell cache.
   ============================================================ */
'use strict';

const SHELL_CACHE  = 'studihome-shell-v3';
const RUNTIME_CACHE = 'studihome-runtime-v1';
const RUNTIME_MAX   = 80;

/* App shell — precached at install (tolerantly, one by one).
   The HTML references these with ?v= suffixes; the runtime handler
   strips query strings before cache.match so one precached entry
   serves every versioned request. */
const APP_SHELL = [
  '/',
  '/index.html',
  '/dapur.html',
  '/tailwind-compiled.css',
  '/supabase-sdk-loader-v1.js',
  '/supabase-config.js'
];

function offlineResponse(status, body, contentType) {
  return new Response(body, {
    status: status,
    statusText: status === 503 ? 'Service Unavailable' : 'Not Found',
    headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' }
  });
}

const OFFLINE_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Sedang offline — Studihome</title></head>' +
  '<body style="margin:0;background:#f3f6ff;color:#151c75;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px">' +
  '<div><div style="font-size:56px;line-height:1">✦</div>' +
  '<h1 style="font-size:22px;margin:16px 0 8px">Koneksi terputus</h1>' +
  '<p style="font-size:14px;color:#475569;max-width:340px;margin:0 auto">Periksa koneksi internetmu lalu coba lagi. Data kamu tetap aman.</p>' +
  '<a href="/" style="display:inline-block;margin-top:18px;padding:10px 20px;border-radius:14px;background:linear-gradient(135deg,#151c75,#3f48bf);color:#fff;text-decoration:none;font-weight:700;font-size:13px">Coba lagi</a>' +
  '</div></body></html>';

/* ── Install: tolerant per-URL precache ───────────────────── */
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res && res.ok) await cache.put(url, res);
          } catch (_) {
            /* best-effort: a single failing asset must not nuke the shell */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

/* ── Activate: purge stale caches, take control ───────────── */
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
      (async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req.url, copy)).catch(() => {});
          }
          return res;
        } catch (_) {
          /* Offline: try this URL's own cached entry, then the route family shell */
          const shellPath = url.pathname.startsWith('/dapur') ? '/dapur.html' : '/index.html';
          const cached =
            (await caches.match(req)) ||
            (await caches.match(url.href)) ||
            (await caches.match(shellPath)) ||
            (await caches.match('/'));
          if (cached) return cached;
          return offlineResponse(503, OFFLINE_HTML, 'text/html; charset=utf-8');
        }
      })()
    );
    return;
  }

  /* Same-origin static assets — stale-while-revalidate with query normalization */
  evt.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cleanKey = url.origin + url.pathname;

      const fromNetwork = async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const copy = res.clone();
            cache.put(cleanKey, copy).then(() => trimCache(cache)).catch(() => {});
          }
          return res;
        } catch (_) {
          const stale = await cache.match(cleanKey);
          if (stale) return stale;
          const shellHit = await caches.match(url.pathname);
          if (shellHit) return shellHit;
          /* Distinguish the true offline case from a 4xx by checking navigator online
             is impossible inside the SW, so return a plain synthetic 503 text/plain. */
          return offlineResponse(503, 'Offline — resource belum tersedia di cache.');
        }
      };

      const cached = await cache.match(cleanKey) || await cache.match(req) || await caches.match(url.pathname);
      if (cached) {
        /* Return cached immediately, refresh in background */
        fromNetwork().catch(() => {});
        return cached;
      }
      return fromNetwork();
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
