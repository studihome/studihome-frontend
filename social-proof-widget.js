(() => {
  'use strict';

  // ============================================================
  // STUDIHOME Social Proof Widget v7
  // ============================================================
  // Uses ONLY social_proof_items table (M13: public SELECT on
  // is_active=true). No dependency on orders/products RLS.
  //
  // Timing: 4s initial delay, 5s display, 12-25s random interval
  // ============================================================

  var WIDGET_ID = 'studihome-social-proof-widget';
  var POLL_KEY = 'studihome-sp-v7';
  var MAX_ITEMS = 10;

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
      var res = await c
        .from('social_proof_items')
        .select('id, name, brand_name, package_name, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS);
      if (res.error) {
        console.warn('[SP]', res.error.message);
        return [];
      }
      return (res.data || []).map(function(r) {
        return {
          name: r.name || 'Member Studihome',
          product_title: r.brand_name ? r.brand_name + ' \u2014 ' + r.package_name : r.package_name || 'Paket Premium'
        };
      });
    } catch (e) {
      console.warn('[SP]', e);
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

  function getContainer() {
    var el = document.getElementById(WIDGET_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = WIDGET_ID;
    el.className = 'fixed z-50 flex flex-col-reverse gap-2.5 bottom-4 left-4 right-4 md:right-auto md:left-4 md:max-w-xs pointer-events-none';
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
    if (!items.length) return;
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

  function boot() {
    if (window[POLL_KEY]) return;
    window[POLL_KEY] = true;
    if (db() && db().from) { start(); return; }
    window.addEventListener('studihome:supabase-client-ready', function() { start(); }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
