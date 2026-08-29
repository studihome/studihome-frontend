(() => {
  'use strict';

  // ============================================================
  // STUDIHOME Social Proof Widget v9
  // ============================================================
  // Queries v_social_proof_recent VIEW (Migration 16).
  // VIEW joins orders + products + profiles, bypasses RLS,
  // exposes only: member_name, product_title, created_at.
  //
  // Timing: 4s initial delay, 5s display, 12-25s random interval
  // Boot: polls for supabaseClient every 200ms (bulletproof)
  // ============================================================

  var WIDGET_ID = 'studihome-social-proof-widget';
  var POLL_KEY = 'studihome-sp-v9';
  var MAX_ITEMS = 10;
  var POLL_INTERVAL = 200;
  var POLL_TIMEOUT = 30000;

  var TIMING = { initialDelay: 4000, displayMs: 5000, intervalMin: 12000, intervalMax: 25000 };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function db() { return window.supabaseClient || null; }

  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- Data ----
  async function fetchItems() {
    var c = db();
    if (!c || !c.from) return [];
    try {
      // Primary: query the public VIEW (real data, bypasses RLS)
      var res = await c
        .from('v_social_proof_recent')
        .select('member_name, product_title, created_at')
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS);

      if (res.error) {
        // Fallback: query social_proof_items (seed data)
        console.warn('[SP] VIEW query failed, falling back to seed data:', res.error.message);
        var fb = await c
          .from('social_proof_items')
          .select('name, brand_name, package_name, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(MAX_ITEMS);
        if (fb.error) {
          console.warn('[SP] fallback also failed:', fb.error.message);
          return [];
        }
        return (fb.data || []).map(function(r) {
          return {
            name: r.name || 'Member Studihome',
            product_title: r.brand_name ? r.brand_name + ' \u2014 ' + r.package_name : r.package_name || 'Paket Premium'
          };
        });
      }

      return (res.data || []).map(function(r) {
        return {
          name: r.member_name || 'Member Studihome',
          product_title: r.product_title || 'Paket Premium'
        };
      });
    } catch (e) {
      console.warn('[SP] fetch exception:', e);
      return [];
    }
  }

  // ---- Toast ----
  function toastHTML(item) {
    var pts = (item.name || '').trim().split(/\s+/);
    var ini = '';
    for (var i = 0; i < pts.length && i < 2; i++) ini += pts[i].charAt(0);
    ini = ini.toUpperCase() || '\u2726';
    return '<div class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 opacity-0 translate-y-2">' +
      '<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#151c75] to-[#3f48bf] text-[10px] font-black text-white">' + esc(ini) + '</span>' +
      '<div class="min-w-0 flex-1">' +
        '<p class="truncate text-xs font-bold text-[#151c75]">' + esc(item.name) + '</p>' +
        '<p class="mt-0.5 truncate text-[10px] text-slate-500">baru saja membeli <span class="font-semibold text-amber-600">' + esc(item.product_title) + '</span></p>' +
        '<p class="mt-0.5 text-[9px] font-medium text-blue-400">Studihome</p>' +
      '</div>' +
      '<button type="button" aria-label="Tutup" class="sp-close shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors">&times;</button>' +
    '</div>';
  }

  function ensureWidgetPositionStyles() {
    if (document.getElementById('studihome-social-proof-position')) return;
    var style = document.createElement('style');
    style.id = 'studihome-social-proof-position';
    style.textContent = '#' + WIDGET_ID + '{bottom:1rem;left:1rem;right:auto;max-width:20rem}' +
      '@media (max-width:767px){#' + WIDGET_ID + '{bottom:calc(env(safe-area-inset-bottom, 0px) + 4.5rem);left:50%;right:auto;width:min(calc(100% - 2rem), 24rem);max-width:24rem;transform:translateX(-50%)}}';
    document.head.appendChild(style);
  }

  function getContainer() {
    var el = document.getElementById(WIDGET_ID);
    if (el) return el;
    ensureWidgetPositionStyles();
    el = document.createElement('div');
    el.id = WIDGET_ID;
    el.className = 'fixed z-50 flex flex-col-reverse gap-2.5 pointer-events-none';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function show(item) {
    var c = getContainer();
    var w = document.createElement('div');
    w.innerHTML = toastHTML(item);
    var t = w.firstElementChild;
    c.appendChild(t);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        t.classList.remove('opacity-0', 'translate-y-2');
        t.classList.add('opacity-100', 'translate-y-0');
      });
    });
    var btn = t.querySelector('.sp-close');
    if (btn) btn.addEventListener('click', function() { hide(t); });
    setTimeout(function() { hide(t); }, TIMING.displayMs);
  }

  function hide(t) {
    if (!t || !t.parentElement) return;
    t.classList.remove('opacity-100', 'translate-y-0');
    t.classList.add('opacity-0', 'translate-y-2');
    setTimeout(function() { if (t.parentElement) t.remove(); }, 300);
  }

  // ---- Loop ----
  async function start() {
    var items = await fetchItems();
    if (!items.length) { console.warn('[SP] no active items found'); return; }
    console.log('[SP] loaded ' + items.length + ' items');
    var q = shuffle(items);
    var idx = 0;
    function next() {
      var item = q[idx % q.length]; idx++;
      if (idx >= q.length) { q = shuffle(items); idx = 0; }
      return item;
    }
    setTimeout(function() {
      show(next());
      (function loop() {
        setTimeout(function() { show(next()); loop(); }, randInt(TIMING.intervalMin, TIMING.intervalMax));
      })();
    }, TIMING.initialDelay);
  }

  // ---- Boot: bulletproof polling for supabaseClient ----
  function boot() {
    if (window[POLL_KEY]) return;
    window[POLL_KEY] = true;

    // Immediate check: if client already exists, start now
    if (db() && db().from) {
      console.log('[SP] supabaseClient ready immediately');
      start();
      return;
    }

    // Poll until client appears or timeout
    console.log('[SP] polling for supabaseClient...');
    var elapsed = 0;
    var timer = setInterval(function() {
      elapsed += POLL_INTERVAL;
      if (db() && db().from) {
        clearInterval(timer);
        console.log('[SP] supabaseClient ready after ' + elapsed + 'ms');
        start();
      } else if (elapsed >= POLL_TIMEOUT) {
        clearInterval(timer);
        console.warn('[SP] supabaseClient not found after ' + POLL_TIMEOUT + 'ms, giving up');
      }
    }, POLL_INTERVAL);
  }

  // Always run boot immediately (script is at end of <body>, not deferred)
  boot();
})();
