(() => {
  'use strict';

  const isAdminRoute = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const db = () => window.supabaseClient && typeof window.supabaseClient.from === 'function' ? window.supabaseClient : null;
  const esc = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  // Cache of the last loaded paid-transaction recap data (kept module-scoped
  // so the month filter can repaint instantly without refetching the server).
  let _paidOrders = [];

  async function requireAdmin() {
    const client = db();
    if (!client) throw new Error('Koneksi Supabase belum siap.');
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('Sesi Admin belum siap.');
    return client;
  }

  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');
  const rupiah = (n) => 'Rp ' + fmt(n);

  // Fetch every order whose payment is confirmed (PAID/CONFIRMED), paging in
  // chunks of 1000 so totals stay accurate even past Supabase's row cap.
  async function fetchPaidSales(client) {
    const all = [];
    const seen = new Set();
    const pageSize = 1000;
    let from = 0;
    for (;;) {
      const { data, error } = await client
        .from('orders')
        .select('id,product_id,total_amount,payment_status,created_at,products(title)')
        .in('payment_status', ['PAID', 'CONFIRMED'])
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) return { error };
      const batch = data || [];
      for (const o of batch) {
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        all.push({
          id: o.id,
          productId: o.product_id,
          title: o.products?.title || '',
          total: Number(o.total_amount) || 0,
          createdAt: o.created_at
        });
      }
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    return { data: all };
  }

  async function gudangData() {
    const client = await requireAdmin();
    const [cats, creators, services, pendingCreators, orders, entitlements, profiles, paid] = await Promise.all([
      client.from('ai_categories').select('id,name,slug,description,icon,is_active,updated_at').order('name', { ascending: true }),
      client.from('creator_profiles').select('id').eq('is_published', true),
      client.from('creator_services').select('id').eq('is_active', true),
      client.from('creator_profiles').select('id,review_status').in('review_status', ['PENDING','DRAFT']).order('updated_at', { ascending: false }).limit(500),
      client.from('orders').select('id,user_id,product_id,total_amount,status,payment_status,created_at').in('status', ['PAYMENT_REVIEW','PENDING_PAYMENT']).order('created_at', { ascending: false }).limit(12),
      client.from('entitlements').select('id,user_id,product_id,status,granted_at').order('granted_at', { ascending: false }).limit(500),
      client.from('profiles').select('id,name,email,role,status,created_at').order('created_at', { ascending: false }).limit(100),
      fetchPaidSales(client)
    ]);
    for (const r of [cats, creators, services, pendingCreators, orders, entitlements, profiles]) if (r.error) throw r.error;
    if (paid.error) throw paid.error;
    return { categories: cats.data || [], creators: creators.data || [], services: services.data || [], pendingCreators: pendingCreators.data || [], orders: orders.data || [], entitlements: entitlements.data || [], profiles: profiles.data || [], paid: paid.data || [] };
  }

  async function toggleCategory(id, nextValue) {
    const client = await requireAdmin();
    const { error } = await client.from('ai_categories').update({ is_active: nextValue }).eq('id', id);
    if (error) throw error;
  }

  const decodeCategoryValue = (value) => {
    try { return decodeURIComponent(value || ''); } catch (_) { return ''; }
  };

  function editCategory(form, button) {
    if (!form || !button) return;
    form.querySelector('#admin-cat-id').value = button.dataset.categoryId || '';
    form.querySelector('[name=name]').value = decodeCategoryValue(button.dataset.categoryName);
    form.querySelector('[name=slug]').value = decodeCategoryValue(button.dataset.categorySlug);
    form.querySelector('[name=description]').value = decodeCategoryValue(button.dataset.categoryDescription);
    const submit = form.querySelector('#admin-cat-submit-btn');
    if (submit) {
      submit.textContent = 'Simpan Perubahan';
      submit.dataset.editing = 'true';
    }
    form.querySelector('[name=name]')?.focus();
  }

  function resetCategoryForm(form) {
    form?.reset();
    const id = form?.querySelector('#admin-cat-id');
    if (id) id.value = '';
    const submit = form?.querySelector('#admin-cat-submit-btn');
    if (submit) {
      submit.textContent = '+ Tambah Kategori';
      delete submit.dataset.editing;
    }
  }

  async function saveCategory(form) {
    const client = await requireAdmin();
    const id = String(form.querySelector('#admin-cat-id')?.value || '').trim();
    const name = String(form.querySelector('[name=name]').value || '').trim();
    const slug = String(form.querySelector('[name=slug]').value || '').trim().toLowerCase();
    const description = String(form.querySelector('[name=description]').value || '').trim();
    if (!name || !slug) throw new Error('Nama dan slug kategori wajib diisi.');
    const request = id
      ? client.from('ai_categories').update({ name, slug, description }).eq('id', id)
      : client.from('ai_categories').insert({ name, slug, description, is_active: true });
    const { error } = await request;
    if (error) throw error;
    toast(id ? 'Kategori AI diperbarui.' : 'Kategori AI ditambahkan.', 'success');
    resetCategoryForm(form);
  }

  const localMonthKey = (iso) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    } catch (_) { return ''; }
  };

  const monthLabelOf = (key) => {
    if (!/^\d{4}-\d{2}$/.test(key || '')) return key || '';
    try {
      const y = Number(key.slice(0, 4));
      const m = Number(key.slice(5, 7));
      return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch (_) { return key; }
  };

  // Aggregate paid orders for a scope: 'all' (semua waktu) or 'YYYY-MM'.
  function paidRecap(paid, scopeKey) {
    const scoped = scopeKey === 'all'
      ? paid
      : paid.filter(o => localMonthKey(o.createdAt) === scopeKey);
    const count = scoped.length;
    const total = scoped.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const byProduct = new Map();
    scoped.forEach(o => {
      const key = o.productId || 'unlisted';
      const entry = byProduct.get(key) || { productId: key, title: String(o.title || '').trim() || 'Produk tanpa judul', count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(o.total) || 0;
      byProduct.set(key, entry);
    });
    const top = [...byProduct.values()]
      .sort((a, b) => (b.count - a.count) || (b.total - a.total))
      .slice(0, 6);
    return {
      scopeKey,
      scopeLabel: scopeKey === 'all' ? 'Keseluruhan (semua waktu)' : monthLabelOf(scopeKey),
      count,
      total,
      top,
      max: top.length ? top[0].count : 1
    };
  }

  function recapScopeHtml(rec) {
    const bars = rec.top.length
      ? rec.top.map(p => {
          const w = Math.max(4, Math.round((p.count / rec.max) * 100));
          return `<div><div class="flex items-center justify-between gap-2 mb-1"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-400">${fmt(p.count)} transaksi · ${rupiah(p.total)}</div></div></div><div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style="width:${w}%"></div></div></div>`;
        }).join('')
      : '<div class="text-[10px] text-slate-400">Belum ada transaksi pada periode ini.</div>';
    return `
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">Transaksi · ${esc(rec.scopeLabel)}</div><div class="mt-1.5 text-xl font-black text-[#151c75]">${fmt(rec.count)}</div></div>
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><div class="text-[9px] font-black uppercase tracking-[.1em] text-emerald-600">Total Harga · ${esc(rec.scopeLabel)}</div><div class="mt-1.5 text-xl font-black text-[#151c75]">${rupiah(rec.total)}</div></div>
      </div>
      <div class="mt-4"><div class="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">PRODUK TERLARIS · ${esc(rec.scopeLabel)}</div><div class="mt-2.5 space-y-3">${bars}</div></div>`;
  }

  function gudangView(data) {
    const pending = data.pendingCreators.filter(c => c.review_status === 'PENDING').length;
    const draft = data.pendingCreators.filter(c => c.review_status === 'DRAFT').length;
    const reviewingOrders = data.orders.filter(o => o.status === 'PAYMENT_REVIEW' || o.payment_status === 'REVIEWING').length;
    const activeEnt = data.entitlements.filter(e => e.status === 'ACTIVE').length;
    const blocked = data.profiles.filter(p => p.status === 'blocked').length;
    const stats = [
      ['Kategori AI', data.categories.length, 'fa-layer-group', 'blue'],
      ['Creator aktif', data.creators.length, 'fa-user-astronaut', 'blue'],
      ['Hidangan aktif', data.services.length, 'fa-bowl-food', 'amber'],
      ['Review Creator', pending, 'fa-user-check', 'blue'],
      ['Draft Creator', draft, 'fa-pen', 'slate'],
      ['Review Transaksi', reviewingOrders, 'fa-receipt', 'amber'],
      ['Akses Aktif', activeEnt, 'fa-key', 'emerald'],
      ['User Diblokir', blocked, 'fa-user-lock', 'red']
    ];

    const paid = data.paid || [];
    const overallCount = paid.length;
    const overallTotal = paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const monthKeys = [...new Set(paid.map(o => localMonthKey(o.createdAt)).filter(Boolean))].sort().reverse();
    const currentMonthKey = localMonthKey(new Date().toISOString());
    const initialScope = monthKeys.includes(currentMonthKey) ? currentMonthKey : 'all';

    return `
      <div class="space-y-5">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${stats.map(([l, v, i, t]) => `<div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500">${l}</span><i class="fa-solid ${i} text-[11px] text-${t === 'blue' ? 'blue-700' : t === 'amber' ? 'amber-600' : t === 'emerald' ? 'emerald-600' : t === 'red' ? 'red-600' : 'slate-600'}"></i></div><div class="mt-1.5 text-xl font-black text-[#151c75]">${fmt(v)}</div></div>`).join('')}
        </div>

        <section class="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <div class="mb-3"><div class="text-[9px] font-black uppercase tracking-[.1em] text-blue-600">MASTER DATA · KATALOG</div><h3 class="text-sm font-black text-[#151c75]">Kategori AI</h3></div>
          <form data-g-form="category" class="grid sm:grid-cols-3 gap-2 mb-3"><input type="hidden" id="admin-cat-id" value=""><input name="name" placeholder="Nama kategori" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="slug" placeholder="slug" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="description" placeholder="Deskripsi singkat" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><button id="admin-cat-submit-btn" class="sm:col-span-3 btn-brand-gradient rounded-xl px-3 py-2 text-[10px] font-extrabold">+ Tambah Kategori</button></form>
          <div class="space-y-2 max-h-[420px] overflow-auto pr-1">${data.categories.map(c => `<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(c.name)}</div><div class="text-[9px] text-slate-400 truncate">${esc(c.slug)} · ${c.is_active ? 'Aktif' : 'Nonaktif'}</div></div><div class="flex items-center gap-2 shrink-0"><button data-toggle-cat="${c.id}" data-next="${c.is_active ? 'false' : 'true'}" class="px-2.5 py-1.5 rounded-lg ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'} text-[9px] font-bold">${c.is_active ? 'Aktif' : 'Aktifkan'}</button><button type="button" data-edit-category="${esc(c.id)}" data-category-id="${esc(c.id)}" data-category-name="${encodeURIComponent(String(c.name || ''))}" data-category-slug="${encodeURIComponent(String(c.slug || ''))}" data-category-description="${encodeURIComponent(String(c.description || ''))}" class="w-7 h-7 rounded-lg bg-blue-50 text-[#151c75] hover:bg-blue-100 flex items-center justify-center transition-all" title="Edit Kategori" aria-label="Edit kategori ${esc(c.name)}"><i class="fa-solid fa-pen text-[10px]" aria-hidden="true"></i></button></div></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada kategori.</div>'}</div>
        </section>

        <section class="rounded-3xl border border-amber-100 bg-white p-4 sm:p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">REKAP TRANSAKSI</div>
                <h3 class="text-sm font-black text-[#151c75]">Penjualan & Produk Terlaris</h3>
              </div>
              <label class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-slate-500">Periode</span>
                <select id="g-recap-month" class="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-[10px] font-extrabold text-[#151c75] outline-none">
                  <option value="all" ${initialScope === 'all' ? 'selected' : ''}>Keseluruhan (semua waktu)</option>
                  ${monthKeys.map(k => `<option value="${k}" ${k === initialScope ? 'selected' : ''}>${esc(monthLabelOf(k))}</option>`).join('')}
                </select>
              </label>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div class="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Total Transaksi · Keseluruhan</div><div class="mt-1.5 text-xl font-black text-[#151c75]">${fmt(overallCount)}</div></div>
              <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div class="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Total Harga · Keseluruhan</div><div class="mt-1.5 text-xl font-black text-[#151c75]">${rupiah(overallTotal)}</div></div>
            </div>

            <div id="g-recap-scope" class="mt-3">${recapScopeHtml(paidRecap(paid, initialScope))}</div>

            ${reviewingOrders ? `<div class="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5 text-[10px] text-amber-800"><b>${fmt(reviewingOrders)}</b> transaksi menunggu review Admin — kelola lewat menu Transaksi.</div>` : ''}
        </section>

        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-[10px] text-slate-600 leading-relaxed"><b class="text-[#151c75]">Logic Gudang:</b> satu dashboard untuk master data Studio AI (kategori) dan rekap penjualan transaksi berstatus PAID/CONFIRMED. Review Creator dikelola di menu Dapur Creator; di sini hanya tampil indikator antrian yang menunggu tindakan.</div>
      </div>`;
  }

  async function renderGudang(area) {
    area.innerHTML = '<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Gudang…</div>';
    try {
      const data = await gudangData();
      _paidOrders = data.paid || [];
      area.innerHTML = gudangView(data);
      bindGudang(area);
    }
    catch (e) { area.innerHTML = `<div class="rounded-2xl bg-red-50 border border-red-100 p-5 text-xs text-red-700">Gudang gagal dimuat: ${esc(e.message || 'Unknown error')}</div>`; }
  }

  function bindGudang(area) {
    area.querySelectorAll('[data-toggle-cat]').forEach(b => b.onclick = async () => { try { await toggleCategory(b.dataset.toggleCat, b.dataset.next === 'true'); await renderGudang(area); toast('Status kategori diperbarui.', 'success'); } catch (e) { toast(e.message || 'Kategori gagal diubah.', 'error'); } });
    const categoryForm = area.querySelector('[data-g-form="category"]');
    area.querySelectorAll('[data-edit-category]').forEach(button => button.onclick = () => editCategory(categoryForm, button));
    categoryForm?.addEventListener('submit', async e => { e.preventDefault(); try { await saveCategory(e.currentTarget); await renderGudang(area); } catch (err) { toast(err.message || 'Kategori gagal disimpan.', 'error'); } });

    const monthSel = area.querySelector('#g-recap-month');
    const scopeWrap = area.querySelector('#g-recap-scope');
    if (monthSel && scopeWrap) {
      monthSel.addEventListener('change', () => { scopeWrap.innerHTML = recapScopeHtml(paidRecap(_paidOrders, monthSel.value)); });
    }
  }

  function shell() {
    return `
      <section id="admin-gudang-v2" class="space-y-5 sm:space-y-6">
        <div class="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 sm:p-6 shadow-sm">
          <div class="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div class="max-w-3xl"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">GUDANG · ADMIN CONTROL CENTER</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Studio AI + Governance, satu dashboard</h2><p class="mt-1.5 text-[10px] sm:text-xs text-slate-600 leading-relaxed">Semua kontrol dalam satu layar: kategori master AI, antrian review Creator, serta rekap transaksi dan kesehatan operasional.</p></div>
            <div class="flex flex-col items-stretch lg:items-end gap-3">
              <button data-g-action="refresh" class="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#151c75] shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"><i class="fa-solid fa-rotate text-[11px]" aria-hidden="true"></i> Muat Ulang Data</button>
            </div>
          </div>
        </div>
        <div id="gudang-workspace-area"></div>
      </section>`;
  }

  async function open() {
    if (!isAdminRoute()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = shell();
    const workspace = area.querySelector('#gudang-workspace-area');
    const reload = () => renderGudang(workspace);
    area.querySelectorAll('[data-g-action="refresh"]').forEach(b => b.addEventListener('click', reload));
    await reload();
  }

  window.StudihomeGudangV2 = Object.freeze({ open });
})();
