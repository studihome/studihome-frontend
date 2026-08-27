(() => {
  'use strict';

  // ============================================================
  // STUDIHOME — Social Proof Admin Panel
  // ============================================================
  // Version: 2.0.0 (renders into admin-content-area)
  // Date: 27 Aug 2026
  //
  // Registers App.admin.renderSocialProof() which renders the
  // real premium member list into the existing admin tab content area.
  //
  // SECURITY:
  //   - esc() used for all user-supplied text
  //   - Admin-only: is_admin() enforced via Supabase RLS
  //   - No inline <style> — Tailwind utility classes only
  //   - No eval(), no innerHTML with unescaped data
  // ============================================================

  var PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/admin') return;

  // --- Helpers ---
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

  // --- Fetch real data: entitlements + profiles + products ---
  async function fetchMembers() {
    var client = db();
    if (!client || !client.from) return [];

    try {
      var entRes = await client
        .from('entitlements')
        .select('id, user_id, product_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (entRes.error) throw entRes.error;
      var entitlements = entRes.data || [];
      if (!entitlements.length) return [];

      var userIds = [];
      var productIds = [];
      for (var i = 0; i < entitlements.length; i++) {
        if (userIds.indexOf(entitlements[i].user_id) === -1) userIds.push(entitlements[i].user_id);
        if (productIds.indexOf(entitlements[i].product_id) === -1) productIds.push(entitlements[i].product_id);
      }

      var profileRes = await client.from('profiles').select('id, name, email').in('id', userIds);
      var productRes = await client.from('products').select('id, title, price, is_active').in('id', productIds);

      var profileMap = {};
      (profileRes.data || []).forEach(function(p) { profileMap[p.id] = p; });
      var productMap = {};
      (productRes.data || []).forEach(function(p) { productMap[p.id] = p; });

      return entitlements.map(function(e) {
        var profile = profileMap[e.user_id] || {};
        var product = productMap[e.product_id] || {};
        return {
          id: e.id,
          name: profile.name || 'Member Studihome',
          email: profile.email || '',
          product_title: product.title || 'Produk Premium',
          product_price: product.price || 0,
          product_active: product.is_active !== false,
          created_at: e.created_at
        };
      });
    } catch (e) {
      console.warn('[Studihome SP Admin] Fetch error:', e);
      return [];
    }
  }

  // --- Render into admin-content-area ---
  async function renderSocialProof() {
    var area = document.getElementById('admin-content-area');
    if (!area) return;

    // Loading state
    area.innerHTML = '<div class="flex items-center justify-center py-12 text-sm text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Memuat data Social Proof...</div>';

    var members = await fetchMembers();

    var html = '';
    // Header
    html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">';
    html += '<div>';
    html += '<h3 class="text-sm font-extrabold text-[#151c75]">🔔 Social Proof — Member Premium Terbaru</h3>';
    html += '<p class="text-[10px] text-slate-500 mt-0.5">Data otomatis dari entitlements (pembelian premium). 5 member terbaru tampil di homepage.</p>';
    html += '</div>';
    html += '</div>';

    if (!members.length) {
      html += '<div class="text-center py-12">';
      html += '<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-300 mb-3"><i class="fa-solid fa-users-slash text-2xl"></i></div>';
      html += '<p class="text-sm text-slate-500">Belum ada member premium.</p>';
      html += '<p class="text-[10px] text-slate-400 mt-1">Widget akan otomatis menampilkan data setelah ada pembelian produk premium.</p>';
      html += '</div>';
    } else {
      // Stats
      var activeProducts = 0;
      for (var i = 0; i < members.length; i++) {
        if (members[i].product_active) activeProducts++;
      }

      html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">';
      html += '<div class="card-3d p-3 rounded-xl bg-white">';
      html += '<div class="text-lg font-black text-[#151c75]">' + members.length + '</div>';
      html += '<div class="text-[9px] text-slate-500 font-bold uppercase">Total Entitlements</div>';
      html += '</div>';
      html += '<div class="card-3d p-3 rounded-xl bg-white">';
      html += '<div class="text-lg font-black text-green-600">' + activeProducts + '</div>';
      html += '<div class="text-[9px] text-slate-500 font-bold uppercase">Produk Aktif</div>';
      html += '</div>';
      html += '<div class="card-3d p-3 rounded-xl bg-white">';
      html += '<div class="text-lg font-black text-[#151c75]">5</div>';
      html += '<div class="text-[9px] text-slate-500 font-bold uppercase">Tampil di Widget</div>';
      html += '</div>';
      html += '</div>';

      // Member list
      html += '<div class="space-y-2">';
      for (var j = 0; j < members.length; j++) {
        var m = members[j];
        var parts = (m.name || '').trim().split(/\s+/);
        var initials = '';
        for (var k = 0; k < parts.length && k < 2; k++) initials += parts[k].charAt(0);
        initials = initials.toUpperCase() || '✦';

        var isInWidget = j < 5;
        var dateStr = m.created_at ? new Date(m.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        var priceStr = m.product_price ? 'Rp ' + Number(m.product_price).toLocaleString('id-ID') : '-';

        html += '<div class="flex items-center gap-3 p-3 rounded-xl border ' + (isInWidget ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white') + '">';
        html += '<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#151c75] to-[#3f48bf] text-[10px] font-black text-white">' + esc(initials) + '</div>';
        html += '<div class="min-w-0 flex-1">';
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-xs font-bold text-[#151c75]">' + esc(m.name) + '</span>';
        if (isInWidget) {
          html += '<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-100 text-blue-700">WIDGET</span>';
        }
        html += '</div>';
        html += '<div class="text-[9px] text-slate-500 mt-0.5">' + esc(m.product_title) + ' · ' + esc(priceStr) + '</div>';
        html += '<div class="text-[8px] text-slate-400 mt-0.5">' + esc(dateStr) + '</div>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';

      // Note
      html += '<div class="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">';
      html += '<div class="flex items-start gap-2">';
      html += '<i class="fa-solid fa-info-circle text-amber-500 mt-0.5 text-xs"></i>';
      html += '<div class="text-[10px] text-amber-700 leading-relaxed">';
      html += '<strong>Catatan:</strong> Widget homepage secara otomatis menampilkan <strong>5 pembelian premium terbaru</strong> berdasarkan data entitlements. ';
      html += 'Data diperbarui secara real-time dari database.';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    area.innerHTML = html;
  }

  // --- Register on App.admin ---
  function register() {
    if (!window.App) {
      setTimeout(register, 100);
      return;
    }
    if (!window.App.admin) {
      setTimeout(register, 100);
      return;
    }
    window.App.admin.renderSocialProof = renderSocialProof;
    window.App.admin.openSocialProof = function() {
      window.App.admin.switchTab('social-proof');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();
