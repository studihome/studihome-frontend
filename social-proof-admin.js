(() => {
  'use strict';

  // ============================================================
  // STUDIHOME — Social Proof Admin Panel (CRUD for Dapur)
  // ============================================================
  // Version: 1.0.0
  // Branch: feat/live-social-proof
  // Date: 27 Aug 2026
  //
  // Renders a CRUD overlay in /admin for managing social_proof_items.
  // Follows the same pattern as under-construction-gudang.js.
  //
  // SECURITY:
  //   - esc() used for all user-supplied text
  //   - Admin-only: is_admin() enforced via Supabase RLS
  //   - No inline <style> — Tailwind utility classes only
  //   - No eval(), no innerHTML with unescaped data
  // ============================================================

  var PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/admin') return;

  var VERSION = '1';
  var LAUNCHER_ID = 'studihome-social-proof-admin-menu';
  var OVERLAY_ID = 'studihome-social-proof-admin-overlay';
  var SHARED_ID = 'studihome-social-proof-admin-shared-v' + VERSION;

  var sharedPromise = null;

  // --- Helpers ---
  var sleep = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };
  var connected = function(el) { return !!el && el.isConnected === true; };

  // --- XSS-safe escape (matches project convention) ---
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function db() {
    return window.supabaseClient || null;
  }

  function toast(m, t) {
    if (window.App && window.App.ui && window.App.ui.toast) {
      window.App.ui.toast(m, t);
    }
  }

  // --- Load shared under-construction module (reuse pattern) ---
  function loadShared() {
    if (window.StudihomeUnderConstruction) return Promise.resolve(window.StudihomeUnderConstruction);
    if (sharedPromise) return sharedPromise;

    var script = document.getElementById(SHARED_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SHARED_ID;
      script.src = '/under-construction.js?v=' + VERSION;
      script.defer = true;
      script.async = false;
      document.head.appendChild(script);
    }

    sharedPromise = (async function() {
      for (var i = 0; i < 160; i++) {
        if (window.StudihomeUnderConstruction) return window.StudihomeUnderConstruction;
        await sleep(50);
      }
      return null;
    })();

    return sharedPromise;
  }

  // --- Find admin sidebar container (same logic as gudang) ---
  function findContainer() {
    var selectors = [
      '#admin-sidebar', '.admin-sidebar', '[data-admin-sidebar]',
      '[data-sidebar]', 'aside', 'nav', '[role="navigation"]',
      'div[class*="sidebar" i]', 'div[class*="navigation" i]'
    ];
    var candidates = [];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (candidates.indexOf(el) === -1) candidates.push(el);
      });
    });
    return candidates
      .filter(function(el) { return connected(el); })
      .sort(function(a, b) { return b.querySelectorAll('a,button,[role="button"]').length - a.querySelectorAll('a,button,[role="button"]').length; })[0] || null;
  }

  // --- Create sidebar launcher button ---
  function buttonMarkup() {
    var button = document.createElement('button');
    button.id = LAUNCHER_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Kelola Social Proof');
    button.setAttribute('title', 'SP');
    button.innerHTML =
      '<span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-[#151c75] flex-shrink-0">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>' +
      '</span>' +
      '<span class="min-w-0 flex flex-col items-start gap-px leading-tight">' +
        '<span class="text-[11px] font-black whitespace-nowrap">Social Proof</span>' +
      '</span>';
    button.className = [
      'flex items-center gap-2.5 w-full min-h-[52px] px-3 py-2',
      'border border-blue-100 rounded-[14px] bg-white text-slate-700',
      'cursor-pointer text-left shadow-sm transition-colors',
      'hover:bg-blue-50 hover:border-blue-200'
    ].join(' ');
    button.addEventListener('click', function() { openPanel(); });
    return button;
  }

  function placeLauncher() {
    var launcher = document.getElementById(LAUNCHER_ID);
    var container = findContainer();
    if (!launcher) launcher = buttonMarkup();
    if (container && connected(container)) {
      if (connected(launcher)) launcher.remove();
      container.appendChild(launcher);
      return true;
    }
    if (!connected(launcher)) document.body.appendChild(launcher);
    return true;
  }

  // --- Overlay ---
  function closePanel() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  }

  function ensureOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = [
      'fixed inset-0 z-[2147482999] flex items-start justify-center',
      'p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-auto'
    ].join(' ');

    var sheet = document.createElement('section');
    sheet.className = [
      'w-full max-w-[1080px] mt-auto sm:mt-8 bg-[#f8fbff] border border-blue-100',
      'rounded-3xl shadow-2xl overflow-hidden'
    ].join(' ');

    // Header
    var head = document.createElement('div');
    head.className = 'flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#151c75] to-[#3f48bf] text-white';
    head.innerHTML =
      '<div>' +
        '<div class="text-[9px] font-black uppercase tracking-[.12em] opacity-80">SITE CONTROL</div>' +
        '<div class="text-lg font-black mt-0.5">Social Proof Items</div>' +
        '<div class="text-[10px] opacity-60 mt-0.5">Kelola notifikasi transaksi real-time</div>' +
      '</div>';

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Tutup');
    close.className = 'w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 text-white text-xl hover:bg-white/25 transition-colors';
    close.innerHTML = '&times;';
    close.addEventListener('click', closePanel);
    head.appendChild(close);

    // Body
    var body = document.createElement('div');
    body.id = OVERLAY_ID + '-body';
    body.className = 'p-4 sm:p-5 min-h-[200px] bg-[#f8fbff]';
    body.innerHTML = '<div class="flex items-center justify-center py-12 text-sm text-slate-400">Memuat data...</div>';

    sheet.appendChild(head);
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePanel(); });
    document.body.appendChild(overlay);

    return overlay;
  }

  // --- Data operations ---
  async function fetchAll() {
    var client = db();
    if (!client || !client.from) return [];
    var result = await client
      .from('social_proof_items')
      .select('*')
      .order('id', { ascending: true });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function insertItem(data) {
    var client = db();
    if (!client) throw new Error('Database belum siap');
    var result = await client.from('social_proof_items').insert(data).select();
    if (result.error) throw result.error;
    return result.data;
  }

  async function updateItem(id, patch) {
    var client = db();
    if (!client) throw new Error('Database belum siap');
    var result = await client.from('social_proof_items').update(patch).eq('id', id).select();
    if (result.error) throw result.error;
    return result.data;
  }

  async function deleteItem(id) {
    var client = db();
    if (!client) throw new Error('Database belum siap');
    var result = await client.from('social_proof_items').delete().eq('id', id);
    if (result.error) throw result.error;
  }

  // --- Render CRUD table ---
  function renderTable(items) {
    var body = document.getElementById(OVERLAY_ID + '-body');
    if (!body) return;

    var activeCount = items.filter(function(i) { return i.is_active; }).length;

    var html = '';

    // Summary + Add button
    html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">';
    html += '<div class="flex items-center gap-3">';
    html += '<span class="text-sm font-black text-[#151c75]">' + items.length + ' item</span>';
    html += '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">' + activeCount + ' aktif</span>';
    html += '</div>';
    html += '<button id="sp-add-new" type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#151c75] text-white text-[11px] font-extrabold hover:bg-[#1e2578] transition-colors">';
    html += '<span class="text-base leading-none">+</span> Tambah Baru';
    html += '</button>';
    html += '</div>';

    // Items grid
    if (!items.length) {
      html += '<div class="text-center py-12 text-sm text-slate-400">Belum ada data social proof. Klik "Tambah Baru" untuk memulai.</div>';
    } else {
      html += '<div class="grid gap-2.5">';
      items.forEach(function(item) {
        var statusBadge = item.is_active
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">Aktif</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">Nonaktif</span>';

        html += '<div class="flex items-center gap-3 p-3 rounded-2xl border border-blue-100 bg-white hover:border-blue-200 transition-colors">';
        html += '<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#151c75] to-[#3f48bf] text-[10px] font-black text-white">' + esc((item.name || '?').charAt(0)) + '</div>';
        html += '<div class="min-w-0 flex-1">';
        html += '<div class="text-xs font-bold text-[#151c75] truncate">' + esc(item.name) + '</div>';
        html += '<div class="text-[10px] text-slate-500 truncate">' + esc(item.brand_name) + ' &middot; ' + esc(item.package_name) + '</div>';
        html += '</div>';
        html += statusBadge;
        html += '<div class="flex items-center gap-1 shrink-0">';
        // Toggle active
        html += '<button type="button" data-sp-toggle="' + item.id + '" data-active="' + (item.is_active ? 'true' : 'false') + '" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="' + (item.is_active ? 'Nonaktifkan' : 'Aktifkan') + '">';
        html += item.is_active
          ? '<svg class="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
          : '<svg class="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/></svg>';
        html += '</button>';
        // Delete
        html += '<button type="button" data-sp-delete="' + item.id + '" class="p-1.5 rounded-lg hover:bg-red-50 transition-colors" aria-label="Hapus">';
        html += '<svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
        html += '</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    body.innerHTML = html;

    // Bind events
    bindEvents();
  }

  // --- Inline add form ---
  function showAddForm() {
    var body = document.getElementById(OVERLAY_ID + '-body');
    if (!body) return;

    var html = '<div class="rounded-2xl border border-blue-100 bg-white p-4 space-y-3">';
    html += '<h3 class="text-sm font-black text-[#151c75]">Tambah Social Proof Item</h3>';
    html += '<label class="block"><span class="text-[10px] font-bold text-slate-600">Nama Customer</span>';
    html += '<input id="sp-name" type="text" maxlength="100" placeholder="Bapak/Ibu ..." class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"></label>';
    html += '<label class="block"><span class="text-[10px] font-bold text-slate-600">Brand</span>';
    html += '<input id="sp-brand" type="text" maxlength="100" placeholder="Nama brand edukasi" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"></label>';
    html += '<label class="block"><span class="text-[10px] font-bold text-slate-600">Paket</span>';
    html += '<input id="sp-package" type="text" maxlength="100" placeholder="Nama paket Studihome" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"></label>';
    html += '<label class="inline-flex items-center gap-2 cursor-pointer">';
    html += '<input id="sp-active" type="checkbox" checked class="w-4 h-4 accent-[#151c75]">';
    html += '<span class="text-xs font-bold text-slate-700">Aktif</span>';
    html += '</label>';
    html += '<div class="flex gap-2 pt-1">';
    html += '<button id="sp-save-new" type="button" class="rounded-xl bg-[#151c75] px-4 py-2 text-[11px] font-extrabold text-white hover:bg-[#1e2578] transition-colors">Simpan</button>';
    html += '<button id="sp-cancel-add" type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-extrabold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>';
    html += '</div>';
    html += '</div>';

    body.innerHTML = html;

    document.getElementById('sp-cancel-add').addEventListener('click', function() { reloadPanel(); });
    document.getElementById('sp-save-new').addEventListener('click', async function() {
      var name = document.getElementById('sp-name').value.trim();
      var brand = document.getElementById('sp-brand').value.trim();
      var pkg = document.getElementById('sp-package').value.trim();
      var active = document.getElementById('sp-active').checked;

      if (!name || !brand || !pkg) {
        toast('Semua field wajib diisi.', 'error');
        return;
      }

      try {
        await insertItem({ name: name, brand_name: brand, package_name: pkg, is_active: active });
        toast('Item berhasil ditambahkan.', 'success');
        reloadPanel();
      } catch (e) {
        toast(e.message || 'Gagal menyimpan.', 'error');
      }
    });

    document.getElementById('sp-name').focus();
  }

  // --- Bind CRUD events ---
  function bindEvents() {
    // Add new
    var addBtn = document.getElementById('sp-add-new');
    if (addBtn) {
      addBtn.addEventListener('click', showAddForm);
    }

    // Toggle active
    document.querySelectorAll('[data-sp-toggle]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = parseInt(btn.getAttribute('data-sp-toggle'), 10);
        var isActive = btn.getAttribute('data-active') === 'true';
        try {
          await updateItem(id, { is_active: !isActive });
          toast(isActive ? 'Item dinonaktifkan.' : 'Item diaktifkan.', 'success');
          reloadPanel();
        } catch (e) {
          toast(e.message || 'Gagal mengubah status.', 'error');
        }
      });
    });

    // Delete
    document.querySelectorAll('[data-sp-delete]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = parseInt(btn.getAttribute('data-sp-delete'), 10);
        if (!confirm('Hapus item ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await deleteItem(id);
          toast('Item berhasil dihapus.', 'success');
          reloadPanel();
        } catch (e) {
          toast(e.message || 'Gagal menghapus.', 'error');
        }
      });
    });
  }

  // --- Reload panel ---
  async function reloadPanel() {
    try {
      var items = await fetchAll();
      renderTable(items);
    } catch (e) {
      var body = document.getElementById(OVERLAY_ID + '-body');
      if (body) {
        body.innerHTML = '<div class="text-center py-12 text-sm text-red-500">Gagal memuat data: ' + esc(e.message) + '</div>';
      }
    }
  }

  // --- Open panel ---
  async function openPanel() {
    ensureOverlay();
    await reloadPanel();
  }

  // --- Place sidebar launcher ---
  function place() {
    placeLauncher();
  }

  // --- Boot ---
  async function boot() {
    await loadShared();
    place();
    // Re-place periodically in case sidebar is dynamic
    setInterval(function() {
      var launcher = document.getElementById(LAUNCHER_ID);
      if (!connected(launcher)) place();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
