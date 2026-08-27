(() => {
  'use strict';

  // ============================================================
  // STUDIHOME — Social Proof Widget (Live Toast Notifications)
  // ============================================================
  // Version: 6.0.0 (query orders directly, max 10, auto-check new)
  // Date: 27 Aug 2026
  //
  // Strategy: Query orders (PAID/CONFIRMED) directly with FK joins
  // to products(title) and profiles(name). Then check which are
  // registered in social_proof_items. No dependency on M14 FK.
  //
  // TIMING (organik/psikologis):
  //   Initial delay: 4000ms (4s after page load)
  //   Display duration: 5000ms (5s visible)
  //   Interval: random 12000–25000ms (12–25s between toasts)
  // ============================================================

  var VERSION = '6';
  var WIDGET_ID = 'studihome-social-proof-widget';
  var POLL_KEY = 'studihome-social-proof-items-v' + VERSION;

  var CONFIG = {
    initialDelay: 4000,
    displayDuration: 5000,
    intervalMin: 12000,
    intervalMax: 25000,
    maxItems: 10
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function db() {
    return window.supabaseClient || null;
  }

  // Fetch checked social proof items (order_id list + is_active)
  async function fetchCheckedIds(client) {
    try {
      var res = await client
        .from('social_proof_items')
        .select('order_id, is_active');
      if (res.error) {
        console.warn('[Studihome Social Proof] social_proof_items query:', res.error.message);
        return [];
      }
      return (res.data || [])
        .filter(function(r) { return r.is_active && r.order_id; })
        .map(function(r) { return r.order_id; });
    } catch (e) {
      console.warn('[Studihome Social Proof] social_proof_items fetch failed:', e);
      return [];
    }
  }

  // Fetch the latest paid/confirmed orders with product + profile info
  async function fetchOrders(client, ids) {
    try {
      var query = client
        .from('orders')
        .select('id, created_at, products(title), profiles!orders_user_id_fkey(name)')
        .in('payment_status', ['PAID', 'CONFIRMED'])
        .order('created_at', { ascending: false })
        .limit(CONFIG.maxItems * 2);

      var res = await query;
      if (res.error) {
        console.warn('[Studihome Social Proof] orders query:', res.error.message);
        return [];
      }
      return res.data || [];
    } catch (e) {
      console.warn('[Studihome Social Proof] orders fetch failed:', e);
      return [];
    }
  }

  // Main fetch: get checked IDs, then get matching orders
  async function fetchItems() {
    var client = db();
    if (!client || !client.from) return [];

    try {
      var checkedIds = await fetchCheckedIds(client);
      if (!checkedIds.length) {
        console.info('[Studihome Social Proof] No checked items — widget idle.');
        return [];
      }

      var orders = await fetchOrders(client, checkedIds);

      // Filter to only checked orders, take top N
      var idSet = {};
      checkedIds.forEach(function(id) { idSet[id] = true; });

      var matched = orders.filter(function(o) { return idSet[o.id]; });

      // Fallback: if no FK-resolved data, return basic items from order IDs
      if (!matched.length && checkedIds.length) {
        matched = checkedIds.slice(0, CONFIG.maxItems).map(function(id) {
          return { id: id, created_at: null, products: null, profiles: null };
        });
      }

      var toastItems = [];
      for (var i = 0; i < matched.length && i < CONFIG.maxItems; i++) {
        var o = matched[i];
        toastItems.push({
          name: (o.profiles && o.profiles.name) || 'Member Studihome',
          product_title: (o.products && o.products.title) || 'Paket Premium',
          created_at: o.created_at
        });
      }
      return toastItems;
    } catch (e) {
      console.warn('[Studihome Social Proof] Fetch failed:', e);
      return [];
    }
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function toastHTML(item) {
    var parts = (item.name || '').trim().split(/\s+/);
    var initials = '';
    for (var i = 0; i < parts.length && i < 2; i++) initials += parts[i].charAt(0);
    initials = initials.toUpperCase() || '\u2726';

    return (
      '<div class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 opacity-0 translate-y-2">' +
        '<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#151c75] to-[#3f48bf] text-[10px] font-black text-white">' +
          esc(initials) + '</span>' +
        '<div class="min-w-0 flex-1">' +
          '<p class="truncate text-xs font-bold text-[#151c75]">' + esc(item.name) + '</p>' +
          '<p class="mt-0.5 truncate text-[10px] text-slate-500">baru saja membeli <span class="font-semibold text-amber-600">' + esc(item.product_title) + '</span></p>' +
          '<p class="mt-0.5 text-[9px] font-medium text-blue-400">Studihome</p>' +
        '</div>' +
        '<button type="button" aria-label="Tutup" class="sp-close shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors">&times;</button>' +
      '</div>'
    );
  }

  function getContainer() {
    var c = document.getElementById(WIDGET_ID);
    if (c) return c;
    c = document.createElement('div');
    c.id = WIDGET_ID;
    c.className = 'fixed z-50 flex flex-col-reverse gap-2.5 bottom-4 left-4 right-4 md:right-auto md:left-4 md:max-w-xs pointer-events-none';
    c.setAttribute('aria-live', 'polite');
    c.setAttribute('aria-label', 'Notifikasi pembelian terkini');
    document.body.appendChild(c);
    return c;
  }

  function showToast(item) {
    var container = getContainer();
    var w = document.createElement('div');
    w.innerHTML = toastHTML(item);
    var t = w.firstElementChild;
    container.appendChild(t);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        t.classList.remove('opacity-0', 'translate-y-2');
        t.classList.add('opacity-100', 'translate-y-0');
      });
    });
    var btn = t.querySelector('.sp-close');
    if (btn) btn.addEventListener('click', function() { dismissToast(t); });
    setTimeout(function() { dismissToast(t); }, CONFIG.displayDuration);
  }

  function dismissToast(t) {
    if (!t || !t.parentElement) return;
    t.classList.remove('opacity-100', 'translate-y-0');
    t.classList.add('opacity-0', 'translate-y-2');
    setTimeout(function() { if (t.parentElement) t.remove(); }, 300);
  }

  async function startLoop() {
    var items = await fetchItems();
    if (!items.length) return;
    var shuffled = shuffle(items);
    var idx = 0;
    function next() {
      var item = shuffled[idx % shuffled.length]; idx++;
      if (idx >= shuffled.length) { shuffled = shuffle(items); idx = 0; }
      return item;
    }
    setTimeout(function() {
      showToast(next());
      (function schedule() {
        setTimeout(function() { showToast(next()); schedule(); }, randInt(CONFIG.intervalMin, CONFIG.intervalMax));
      })();
    }, CONFIG.initialDelay);
  }

  function boot() {
    if (window[POLL_KEY]) return;
    window[POLL_KEY] = true;
    if (db() && db().from) { startLoop(); return; }
    window.addEventListener('studihome:supabase-client-ready', function() { startLoop(); }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
