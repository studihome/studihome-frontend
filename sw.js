/* ============================================================
   Studihome Service Worker v4
   ─────────────────────────────────────────────────────────────
   Strategy:
     - Navigations: network-first; EVERY successful same-origin
       navigation is cached under a query-normalized key
       (origin + pathname), so a route that was opened once works
       offline and during transient network failures afterwards.
       If the network fails OR the origin answers 4xx/5xx (e.g. a
       transient 503 mid-deploy), the cached copy for that route /
       route-family shell is served instead of a broken page.
       A synthetic 503 is returned ONLY as the final last resort —
       never `undefined`, never an uncaught rejection.
     - Same-origin static assets: stale-while-revalidate with
       query-string normalization. Failures fall back to the
       cached/stale copy; only then to a synthetic response.
   Cross-origin: NEVER touched (Supabase, CDN, fonts, embeds).
   Security: GET-only, same-origin. Auth tokens never cached —
             member data loads client-side from the API and is
             never stored by this worker.
   Install: per-URL tolerant — one failing asset does not wipe
            the shell cache. Activate purges stale cache versions.
   ============================================================ */
'use strict';

const SHELL_CACHE   = 'studihome-shell-v4';
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

/* Normalized cache key: origin + pathname (query/cache-buster stripped). */
function cleanKey(url) {
  return url.origin + url.pathname;
}

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

/* ── Navigation: network-first with cached fallback ───────── */
async function navigationHandler(req, url) {
  const shell = await caches.open(SHELL_CACHE);
  const runtime = await caches.open(RUNTIME_CACHE);
  const key = cleanKey(url);
  const familyShell = url.pathname.startsWith('/dapur') ? '/dapur.html' : '/index.html';

  /* Ordered fallback: own normalized entry → exact URL →
     route-family shell → root shell. Never resolves null. */
  const serveStale = async () =>
    (await runtime.match(key)) ||
    (await shell.match(key)) ||
    (await runtime.match(req)) ||
    (await shell.match(req)) ||
    (await shell.match(familyShell)) ||
    (await shell.match('/')) ||
    null;

  let res;
  try {
    res = await fetch(req);
  } catch (_) {
    /* Network unreachable/failed → cached copy, else synthetic 503. */
    const stale = await serveStale();
    return stale || offlineResponse(503, OFFLINE_HTML, 'text/html; charset=utf-8');
  }

  if (res && res.ok) {
    /* Cache a normalized copy of every successful same-origin
       navigation so the route survives offline / transient drops. */
    const copy = res.clone();
    runtime.put(key, copy).then(() => trimCache(runtime)).catch(() => {});
    return res;
  }

  /* Origin answered but not OK (404/500/503 hiccup): prefer the
     last good copy when we have one; otherwise pass the real status
     through so the user sees the true server state. */
  const stale = await serveStale();
  return stale || res;
}

/* ── Static asset: stale-while-revalidate (query-normalized) ─ */
async function assetHandler(req, url) {
  const cache = await caches.open(RUNTIME_CACHE);
  const key = cleanKey(url);

  const fromNetwork = async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const copy = res.clone();
        cache.put(key, copy).then(() => trimCache(cache)).catch(() => {});
      }
      return res;
    } catch (_) {
      const stale = await cache.match(key);
      if (stale) return stale;
      const shellHit = await caches.match(url.pathname);
      if (shellHit) return shellHit;
      return offlineResponse(503, 'Offline — resource belum tersedia di cache.');
    }
  };

  const cached =
    (await cache.match(key)) ||
    (await cache.match(req)) ||
    (await caches.match(url.pathname));
  if (cached) {
    /* Serve instantly, refresh in the background. */
    fromNetwork().catch(() => {});
    return cached;
  }
  return fromNetwork();
}

/* ── Fetch ────────────────────────────────────────────────── */
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin: untouched
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') return;

  evt.respondWith(
    req.mode === 'navigate'
      ? navigationHandler(req, url)
      : assetHandler(req, url)
  );
});

/* Keep runtime cache bounded (oldest entries evicted first). */
async function trimCache(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > RUNTIME_MAX) await cache.delete(keys[0]);
  } catch (_) { /* best-effort */ }
}
