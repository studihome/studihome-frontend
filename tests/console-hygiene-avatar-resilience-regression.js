'use strict';

const assert = require('assert');
const path = require('path');

const fs = require('fs');
const index = fs.readFileSync('index.html', 'utf8');
const social = fs.readFileSync('social-proof-widget.js', 'utf8');
const card = fs.readFileSync('studio-ai-creator-card.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/pr-syntax-validation.yml', 'utf8');
const dapur = fs.readFileSync('dapur.html', 'utf8');
const rootBrowserRuntimeFiles = fs.readdirSync('.')
  .filter(name => /\.(?:js|html)$/.test(name))
  .filter(name => fs.statSync(name).isFile());

assert(index.includes('/studio-ai-creator-card.js?v=7'), 'Studio AI creator card cache-buster must be v7');
assert(index.includes('/social-proof-widget.js?v=15'), 'Social proof widget cache-buster must be v15');
assert(index.includes("/api/creator-avatar?path="), 'Core safeUrl must route Studihome avatars through same-origin proxy');
assert(index.includes("parsed.hostname === 'hbfmhwwxbgidsnljupca.supabase.co'"), 'Avatar proxy host allowlist missing');
assert(index.includes("avatarPattern.test(objectPath)"), 'Avatar object-path allowlist missing');
assert(index.includes('usesCustomInstallUI: true'), 'Home/Studio custom install-button contract must remain active');
assert(index.includes("window.addEventListener('beforeinstallprompt'"), 'Home/Studio must retain the installable Chromium event');
assert(index.includes('deferredInstallPrompt = event'), 'Home/Studio must retain the Chromium install event for the user button');
assert(index.includes('await promptEvent.prompt()'), 'Install Praktis must invoke the retained browser prompt from user action');

assert(!social.includes("console.log('[SP]"), 'Social-proof success/debug console logs must stay removed');
assert(!social.includes("console.warn('[SP] no active items found')"), 'Empty social-proof data is not a console warning');
assert(social.includes("console.warn('[SP] verified social proof query failed:'"), 'Real social-proof query failures must remain visible');
assert(social.includes("console.warn('[SP] fetch exception:'"), 'Real social-proof fetch exceptions must remain visible');

assert(
  card.includes("window.App?.utils?.safeUrl?.(c.avatar_url,'')"),
  'Studio AI Creator cards must use the resilient shared URL helper'
);

assert(workflow.includes("'chrome.runtime'"), 'First-party extension-messaging guard must remain active');
assert(workflow.includes("'browser.runtime'"), 'First-party browser.runtime guard must remain active');
assert(index.includes("updateViaCache: 'none'"), 'Home must bypass HTTP cache when checking sw.js updates');
assert(dapur.includes("updateViaCache: 'none'"), 'Dapur must bypass HTTP cache when checking sw.js updates');
const sw = fs.readFileSync('sw.js', 'utf8');
assert(sw.includes("studihome-shell-v9"), 'PWA shell cache generation must stay rotated to v9');
assert(sw.includes("studihome-runtime-v3"), 'PWA runtime cache generation must stay rotated to v3');
assert(index.includes("AUTO_WINDOW_TTL = 24 * 60 * 60 * 1000"), 'PWA automatic quota window must reset after 24 hours');
assert(index.includes("AUTO_MAX_PER_WINDOW = 3"), 'PWA automatic quota must allow at most 3 impressions per 24 hours');
assert(index.includes("SESSION_MAX = 3"), 'PWA automatic quota must allow at most 3 impressions per session');
assert(index.includes("AUTO_MIN_GAP = 15 * 60 * 1000"), 'PWA automatic notices must keep a 15-minute minimum gap');
assert(index.includes("DISMISS_TTL = 24 * 60 * 60 * 1000"), 'PWA explicit dismissal must snooze for 24 hours');
assert(!index.includes('AUTO_HIDE_MS'), 'PWA notice must not auto-close on a timer');
assert(!index.includes('autoHideTimer'), 'PWA notice must not retain an auto-hide timer');
assert(index.includes('persistentUntilAction: true'), 'PWA notice must remain open until explicit user action');
assert(index.includes("homeDelayMs: 18 * 1000"), 'Home PWA notice delay contract missing');
assert(index.includes("studioDelayMs: 24 * 1000"), 'Studio AI PWA notice delay contract missing');
assert(index.includes("contentDelayMs: 30 * 1000"), 'Content PWA notice delay contract missing');
assert(index.includes("path === '/admin'") && index.includes("path === '/reset-password'"), 'Sensitive routes must stay excluded from automatic PWA notice');
assert(index.includes("Tambahkan ke Dock"), 'Safari Mac install guidance missing');
assert(dapur.includes("privateDelayMs: 45 * 1000"), 'Dapur PWA notice must keep the longer 45-second delay');
assert(!dapur.includes('AUTO_HIDE_MS'), 'Dapur PWA notice must not auto-close on a timer');
assert(dapur.includes('persistentUntilAction: true'), 'Dapur PWA notice must stay open until explicit user action');
assert(dapur.includes("window.addEventListener('beforeinstallprompt'"), 'Dapur must retain the Chromium install event for Install Praktis');
assert(dapur.includes('await promptEvent.prompt()'), 'Dapur Install Praktis must invoke the browser prompt');
assert(index.includes('Instal Praktis') && dapur.includes('Instal Praktis'), 'Install Praktis button must exist in both PWA shells');
assert(index.includes('font-size:10px') && dapur.includes('font-size:10px'), 'Nanti saja must use the smaller 10px font');
assert(index.includes('aria-label="Tutup pengingat instalasi"'), 'Nanti saja must be an explicit close action');
assert(!index.includes('Gunakan ikon <b>Install</b> di address bar atau menu browser'), 'Old Chromium install instruction must not remain as the default popup content');

const forbiddenMessaging = [
  'chrome.runtime',
  'browser.runtime',
  '.runtime.sendMessage(',
  '.runtime.onMessage',
];
const forbiddenSuppression = [
  "addEventListener('unhandledrejection'",
  'addEventListener("unhandledrejection"',
  'window.onunhandledrejection',
];

for (const file of rootBrowserRuntimeFiles) {
  const body = fs.readFileSync(file, 'utf8');
  for (const marker of forbiddenMessaging) {
    assert(!body.includes(marker), `Unexpected extension messaging API in first-party runtime ${file}: ${marker}`);
  }
  for (const marker of forbiddenSuppression) {
    assert(!body.includes(marker), `Global promise rejection suppression is forbidden in first-party runtime ${file}: ${marker}`);
  }
}

const apiPath = path.resolve('api/creator-avatar.js');
delete require.cache[apiPath];
const handler = require(apiPath);

function makeRes() {
  return {
    headers: {},
    statusCode: 0,
    body: null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
    end(body) { this.body = body == null ? null : body; this.ended = true; return this; }
  };
}

(async () => {
  const originalFetch = global.fetch;
  let fetchCalls = [];

  try {
    global.fetch = async (...args) => {
      fetchCalls.push(args);
      throw new Error('fetch should not be called');
    };

    {
      const res = makeRes();
      await handler({ method: 'GET', query: { path: '../../etc/passwd' } }, res);
      assert.strictEqual(res.statusCode, 400, 'Traversal-like avatar path must be rejected');
      assert.strictEqual(fetchCalls.length, 0, 'Invalid avatar path must not reach upstream fetch');
    }

    {
      const res = makeRes();
      await handler({ method: 'GET', query: { path: 'https://evil.example/avatar.webp' } }, res);
      assert.strictEqual(res.statusCode, 400, 'Absolute URL must be rejected');
      assert.strictEqual(fetchCalls.length, 0, 'Absolute URL must never reach upstream fetch');
    }

    const validPath = 'a2225613-ce1d-4bbf-bd2a-343d4ba51415/63737ec2-afd0-42d6-8b31-6d931c426495/avatar.webp';

    {
      fetchCalls = [];
      global.fetch = async (url, options) => {
        fetchCalls.push([url, options]);
        return {
          ok: true,
          headers: {
            get(name) {
              const key = String(name).toLowerCase();
              if (key === 'content-type') return 'image/webp';
              if (key === 'content-length') return '3';
              return null;
            }
          },
          async arrayBuffer() { return Uint8Array.from([1, 2, 3]).buffer; }
        };
      };

      const res = makeRes();
      await handler({ method: 'GET', query: { path: validPath, v: '123' } }, res);
      assert.strictEqual(res.statusCode, 200, 'Valid avatar should proxy successfully');
      assert.strictEqual(res.headers['content-type'], 'image/webp');
      assert.match(res.headers['cache-control'], /s-maxage=86400/);
      assert.strictEqual(fetchCalls.length, 1);
      assert.strictEqual(
        fetchCalls[0][0],
        'https://hbfmhwwxbgidsnljupca.supabase.co/storage/v1/object/public/creator-media/' + validPath,
        'Proxy upstream must be fixed to the Studihome Supabase public avatar origin'
      );
      assert.strictEqual(Buffer.from(res.body).length, 3);
    }

    {
      global.fetch = async () => { throw new Error('dns failure'); };
      const res = makeRes();
      await handler({ method: 'GET', query: { path: validPath } }, res);
      assert.strictEqual(res.statusCode, 200, 'Upstream DNS failure must degrade to a successful fallback image');
      assert.match(res.headers['content-type'], /^image\/svg\+xml/);
      assert.strictEqual(res.headers['x-studihome-avatar-fallback'], '1');
    }

    console.log('Console hygiene + avatar resilience regression: PASS');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
