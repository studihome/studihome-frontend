(() => {
  'use strict';

  // ============================================================
  // STUDIHOME — Social Proof Widget (Live Toast Notifications)
  // ============================================================
  // Version: 3.0.0 (uses orders table — entitlements has no created_at)
  // Date: 27 Aug 2026
  //
  // Fetches the 5 most recent paid orders from Supabase
  // (orders → products + profiles) and displays toasts.
  //
  // TIMING (organik/psikologis):
  //   Initial delay: 4000ms (4s after page load)
  //   Display duration: 5000ms (5s visible)
  //   Interval: random 12000–25000ms (12–25s between toasts)
  //
  // SECURITY:
  //   - esc() used for all user-supplied text (XSS prevention)
  //   - No inline <style> — Tailwind utility classes only
  //   - No eval(), no innerHTML with unescaped data
  // ============================================================

  var VERSION = '3';
  var WIDGET_ID = 'studihome-social-proof-widget';
  var POLL_KEY = 'studihome-social-proof-items-v' + VERSION;

  var CONFIG = {
    initialDelay: 4000,
    displayDuration: 5000,
    intervalMin: 12000,
    intervalMax: 25000,
    maxMembers: 5
  };

  // --- XSS-safe escape (matches project convention) ---
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // --- Supabase client accessor ---
  function db() {
    return window.supabaseClient || null;
  }

  // --- Fetch 5 latest paid orders with profile + product info ---
  async function fetchItems() {
    var client = db();
    if (!client || !client.from) return [];

    try {
      // Query orders with Supabase foreign-key joins (same pattern as admin panel)
      // orders → profiles(name) via orders_user_id_fkey
      // orders → products(title) via orders_product_id_fkey
      var result = await client
        .from('orders')
        .select('id, user_id, product_id, created_at, products(title), profiles!orders_user_id_fkey(name)')
        .in('payment_status', ['PAID', 'CONFIRMED'])
        .order('created_at', { ascending: false })
        .limit(CONFIG.maxMembers);

      if (result.error) {
        console.warn('[Studihome Social Proof] Orders error:', result.error.message);
        return [];
      }

      var orders = result.data || [];
      if (!orders.length) {
        console.info('[Studihome Social Proof] No paid orders found — widget idle.');
        return [];
      }

      // Map to toast items
      var items = [];
      for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var name = (o.profiles && o.profiles.name) || 'Member Studihome';
        var productTitle = (o.products && o.products.title) || 'Produk Premium';
        items.push({
          name: name,
          product_title: productTitle,
          created_at: o.created_at
        });
      }

      return items;
    } catch (e) {
      console.warn('[Studihome Social Proof] Fetch failed:', e);
      return [];
    }
  }

  // --- Random integer between min and max (inclusive) ---
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // --- Shuffle array (Fisher-Yates) ---
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // --- Build toast markup using Tailwind utility classes only ---
  function toastHTML(item) {
    // Extract initials for avatar
    var parts = (item.name || '').trim().split(/\s+/);
    var initials = '';
    for (var i = 0; i < parts.length && i < 2; i++) {
      initials += parts[i].charAt(0);
    }
    initials = initials.toUpperCase() || '✦';

    return (
      '<div class="pointer-events-auto flex items-start gap-3 max-w-xs rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 opacity-0 translate-y-2">' +
        '<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#151c75] to-[#3f48bf] text-[10px] font-black text-white">' +
          esc(initials) +
        '</span>' +
        '<div class="min-w-0 flex-1">' +
          '<p class="truncate text-xs font-bold text-[#151c75]">' + esc(item.name) + '</p>' +
          '<p class="mt-0.5 truncate text-[10px] text-slate-500">' +
            'baru saja membeli <span class="font-semibold text-amber-600">' + esc(item.product_title) + '</span>' +
          '</p>' +
          '<p class="mt-0.5 text-[9px] font-medium text-blue-400">Studihome</p>' +
        '</div>' +
        '<button type="button" aria-label="Tutup notifikasi" class="sp-close shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors">' +
          '&times;' +
        '</button>' +
      '</div>'
    );
  }

  // --- Create / reuse container ---
  function getContainer() {
    var container = document.getElementById(WIDGET_ID);
    if (container) return container;

    container = document.createElement('div');
    container.id = WIDGET_ID;
    // Desktop: bottom-left. Mobile: bottom center, full-width padding.
    container.className = [
      'fixed z-[9999] flex flex-col-reverse gap-2.5',
      'bottom-4 left-4',
      'sm:bottom-4 sm:left-4',
      'max-w-[calc(100vw-2rem)]',
      'pointer-events-none'
    ].join(' ');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifikasi pembelian terkini');
    document.body.appendChild(container);
    return container;
  }

  // --- Show a single toast ---
  function showToast(item) {
    var container = getContainer();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = toastHTML(item);
    var toast = wrapper.firstElementChild;
    container.appendChild(toast);

    // Animate in (after paint)
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.classList.remove('opacity-0', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
      });
    });

    // Close button
    var closeBtn = toast.querySelector('.sp-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        dismissToast(toast);
      });
    }

    // Auto-dismiss after displayDuration
    setTimeout(function() {
      dismissToast(toast);
    }, CONFIG.displayDuration);
  }

  // --- Dismiss with animation ---
  function dismissToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(function() {
      if (toast.parentElement) toast.remove();
    }, 300);
  }

  // --- Main loop: fetch items, then show random toasts on schedule ---
  async function startLoop() {
    var items = await fetchItems();
    if (!items.length) return;

    var shuffled = shuffle(items);
    var index = 0;

    function nextItem() {
      var item = shuffled[index % shuffled.length];
      index++;
      if (index >= shuffled.length) {
        shuffled = shuffle(items);
        index = 0;
      }
      return item;
    }

    // Wait for initialDelay, then start showing
    setTimeout(function() {
      showToast(nextItem());

      function scheduleNext() {
        var delay = randInt(CONFIG.intervalMin, CONFIG.intervalMax);
        setTimeout(function() {
          showToast(nextItem());
          scheduleNext();
        }, delay);
      }
      scheduleNext();
    }, CONFIG.initialDelay);
  }

  // --- Boot: wait for Supabase client, then start ---
  function boot() {
    if (window[POLL_KEY]) return;
    window[POLL_KEY] = true;

    if (db() && db().from) {
      startLoop();
      return;
    }

    window.addEventListener('studihome:supabase-client-ready', function() {
      startLoop();
    }, { once: true });
  }

  // --- IIFE entry ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
