(() => {
  'use strict';

  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';

  function client() {
    return window.supabaseClient || window.supabase || window.App?.supabase || window.App?.db || window.App?.services?.supabase || null;
  }

  async function waitForClient(timeout = 10000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const c = client();
      if (c && typeof c.from === 'function') return c;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('Koneksi data Admin belum siap. Silakan tunggu sebentar lalu buka Dapur Creator lagi.');
  }

  async function currentUserId(db) {
    const direct = window.App?.state?.user?.id;
    if (direct) return direct;
    try {
      const { data } = await db.auth.getUser();
      return data?.user?.id || null;
    } catch (_) {
      return null;
    }
  }

  async function loadCreatorData() {
    const db = await waitForClient();
    const [{ data: creators, error: creatorError }, { data: likes, error: likesError }, { data: adjustments, error: adjustmentsError }] = await Promise.all([
      db.from('creator_profiles')
        .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,is_published,is_verified,review_status,updated_at,is_studihome_official,managed_by_studihome')
        .order('display_name', { ascending: true }),
      db.from('creator_likes').select('creator_id'),
      db.from('creator_like_adjustments').select('creator_id,delta_count')
    ]);
    if (creatorError) throw creatorError;
    if (likesError) throw likesError;
    if (adjustmentsError) throw adjustmentsError;

    const likeMap = new Map();
    (likes || []).forEach((row) => likeMap.set(row.creator_id, (likeMap.get(row.creator_id) || 0) + 1));
    (adjustments || []).forEach((row) => likeMap.set(row.creator_id, (likeMap.get(row.creator_id) || 0) + Number(row.delta_count || 0)));

    return (creators || []).map((creator) => ({ ...creator, like_count: likeMap.get(creator.id) || 0 }));
  }

  async function loadBundle(id) {
    const db = await waitForClient();
    const [services, portfolios, categories] = await Promise.all([
      db.from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      db.from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      db.from('creator_category_members').select('creator_id,category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id)
    ]);
    if (services.error) throw services.error;
    if (portfolios.error) throw portfolios.error;
    if (categories.error) throw categories.error;
    return { services: services.data || [], portfolios: portfolios.data || [], categories: categories.data || [] };
  }

  async function updateCreator(id, patch) {
    const db = await waitForClient();
    const { error } = await db.from('creator_profiles').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function adjustLikes(id, delta) {
    const db = await waitForClient();
    const userId = await currentUserId(db);
    if (!userId) throw new Error('Session Admin belum siap.');
    const reason = delta > 0 ? 'Penyesuaian like Admin (+1)' : 'Penyesuaian like Admin (-1)';
    const { error } = await db.from('creator_like_adjustments').insert({ creator_id: id, delta_count: delta, reason, created_by: userId });
    if (error) throw error;
    toast(delta > 0 ? 'Like Creator ditambah 1.' : 'Like Creator dikurangi 1.', 'success');
    await render();
  }

  async function toggleVerified(id, value) {
    try { await updateCreator(id, { is_verified: value }); toast(value ? 'Creator diverifikasi.' : 'Verifikasi Creator dicabut.', 'success'); await render(); }
    catch (e) { toast(e.message || 'Status verifikasi gagal diubah.', 'error'); }
  }

  async function togglePublished(id, value) {
    try { await updateCreator(id, { is_published: value, review_status: value ? 'APPROVED' : 'DRAFT' }); toast(value ? 'Creator dipublikasikan.' : 'Publikasi Creator ditarik.', 'success'); await render(); }
    catch (e) { toast(e.message || 'Status publikasi gagal diubah.', 'error'); }
  }

  async function editProfile(id) {
    try {
      const db = await waitForClient();
      const { data: c, error } = await db.from('creator_profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!c) throw new Error('Creator tidak ditemukan.');
      const name = prompt('Nama tampilan Creator:', c.display_name || ''); if (name === null) return;
      const bio = prompt('Bio Creator:', c.bio || ''); if (bio === null) return;
      const wa = prompt('WhatsApp:', c.whatsapp || ''); if (wa === null) return;
      const loc = prompt('Lokasi:', c.location || ''); if (loc === null) return;
      await updateCreator(id, { display_name: name.trim(), bio: bio.trim(), whatsapp: wa.trim(), location: loc.trim() });
      toast('Profil Creator diperbarui.', 'success');
      await render();
    } catch (e) { toast(e.message || 'Profil Creator belum bisa diperbarui.', 'error'); }
  }

  function actionButton(label, cls, onclick) {
    return `<button type="button" class="${cls}" onclick="${onclick}">${label}</button>`;
  }

  async function renderDetail(host, creator) {
    try {
      const bundle = await loadBundle(creator.id);
      host.dataset.loaded = '1';
      host.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">Creator Workspace</div>
              <div class="text-sm font-black text-[#151c75] mt-1">${esc(creator.display_name || creator.username)}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">@${esc(creator.username)} · ${creator.managed_by_studihome ? 'Managed Studihome' : 'Community/Member'}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="/${encodeURIComponent(creator.username)}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-bold text-[#151c75]"><i class="fa-solid fa-eye mr-1"></i>Dapurku</a>
              <a href="/dapur" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold"><i class="fa-solid fa-kitchen-set mr-1"></i>Kelola Dapur</a>
              ${actionButton(creator.is_verified ? 'Cabut Verified' : 'Verifikasi', creator.is_verified ? 'px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[10px] font-bold' : 'px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold', `window.AdminDapurCreatorV3.toggleVerified('${creator.id}',${!creator.is_verified})`)}
              ${actionButton(creator.is_published ? 'Tarik Publish' : 'Publish', creator.is_published ? 'px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[10px] font-bold' : 'px-3 py-2 rounded-xl btn-brand-gradient text-[10px] font-bold', `window.AdminDapurCreatorV3.togglePublished('${creator.id}',${!creator.is_published})`)}
            </div>
          </div>

          <div class="grid sm:grid-cols-3 gap-2">
            <div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Like</div><div class="text-lg font-black text-[#151c75]">${creator.like_count}</div></div>
            <div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Verifikasi</div><div class="text-sm font-black ${creator.is_verified ? 'text-emerald-600' : 'text-slate-500'}">${creator.is_verified ? 'Verified' : 'Belum'}</div></div>
            <div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Publikasi</div><div class="text-sm font-black ${creator.is_published ? 'text-emerald-600' : 'text-slate-500'}">${creator.is_published ? 'Published' : 'Draft'}</div></div>
          </div>

          <section class="rounded-2xl bg-blue-50/70 border border-blue-100 p-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div><div class="text-[10px] font-black text-[#151c75]">Kontrol cepat Like</div><div class="text-[9px] text-slate-500 mt-0.5">Penyesuaian tercatat sebagai audit admin.</div></div>
              <div class="flex gap-2">
                ${actionButton('−1', 'px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-black text-slate-700', `window.AdminDapurCreatorV3.adjustLikes('${creator.id}',-1)`)}
                ${actionButton('+1', 'px-3 py-2 rounded-xl btn-brand-gradient text-[10px] font-black', `window.AdminDapurCreatorV3.adjustLikes('${creator.id}',1)`)}
              </div>
            </div>
          </section>

          <div class="grid xl:grid-cols-2 gap-4">
            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between gap-2"><div class="text-xs font-black text-[#151c75]">Foyer</div><button type="button" class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapurCreatorV3.editProfile('${creator.id}')">Kelola Profil</button></div>
              <div class="grid sm:grid-cols-2 gap-2 mt-3 text-[10px]"><span class="text-slate-500">Nama</span><b class="text-right">${esc(creator.display_name || '-')}</b><span class="text-slate-500">Lokasi</span><b class="text-right">${esc(creator.location || '-')}</b><span class="text-slate-500">WhatsApp</span><b class="text-right">${esc(creator.whatsapp || '-')}</b></div>
            </section>
            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between gap-2 mb-2"><div class="text-xs font-black text-[#151c75]">Menu</div><button type="button" class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapur?.editCategories?.('${creator.id}')">Kelola</button></div>
              <div class="flex flex-wrap gap-1.5">${bundle.categories.length ? bundle.categories.map((x) => `<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-bold">${esc(x.ai_categories?.name || x.category_id)}${x.is_primary ? ' · utama' : ''}</span>`).join('') : '<span class="text-[10px] text-slate-400">Belum ada kategori.</span>'}</div>
            </section>
          </div>

          <section class="card-3d-inset rounded-2xl p-4">
            <div class="flex items-center justify-between gap-2 mb-3"><div><div class="text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500">${bundle.services.length} jasa</div></div><button type="button" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapur?.addService?.('${creator.id}')">+ Tambah</button></div>
            <div class="grid md:grid-cols-2 gap-2">${bundle.services.map((s) => `<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(s.title)}</div><div class="text-[9px] text-slate-500 mt-1 line-clamp-2">${esc(s.description)}</div></div><button type="button" class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapur?.editService?.('${s.id}')">Edit</button></div></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada jasa.</div>'}</div>
          </section>

          <section class="card-3d-inset rounded-2xl p-4">
            <div class="flex items-center justify-between gap-2 mb-3"><div><div class="text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500">${bundle.portfolios.length} portfolio</div></div><button type="button" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapur?.addPortfolio?.('${creator.id}')">+ Tambah</button></div>
            <div class="grid md:grid-cols-2 gap-2">${bundle.portfolios.map((p) => `<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(p.title)}</div><div class="text-[9px] text-slate-500 mt-1">${esc(p.media_type)}</div></div><button type="button" class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapur?.editPortfolio?.('${p.id}')">Edit</button></div></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada portfolio.</div>'}</div>
          </section>
        </div>`;
    } catch (e) {
      host.innerHTML = `<div class="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-700">${esc(e.message || 'Detail Creator gagal dimuat.')}</div>`;
    }
  }

  function renderShell(rows) {
    const managed = rows.filter((c) => c.managed_by_studihome).length;
    const community = rows.length - managed;
    const published = rows.filter((c) => c.is_published).length;
    const verified = rows.filter((c) => c.is_verified).length;
    const official = rows.filter((c) => c.is_studihome_official).length;

    return `
      <div class="space-y-5">
        <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">DAPUR CREATOR · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Semua Creator, satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">Kelola Creator komunitas dan Creator yang dikelola Studihome tanpa berpindah halaman.</p></div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 xl:min-w-[520px]">
              ${[['Total', rows.length], ['Managed', managed], ['Community', community], ['Published', published], ['Verified', verified]].map(([label, value]) => `<div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">${label}</div><div class="text-lg font-black text-[#151c75]">${value}</div></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="card-3d-inset rounded-2xl p-3 flex flex-col lg:flex-row gap-2">
          <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 flex-1"><i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i><input id="dc-v3-search" type="search" placeholder="Cari nama, username, bio, atau lokasi Creator…" class="w-full bg-transparent text-xs outline-none" oninput="window.AdminDapurCreatorV3.filter(this.value)"></div>
          <div class="flex flex-wrap gap-1.5"><button class="dc-v3-filter px-3 py-2 rounded-xl text-[10px] font-extrabold btn-brand-gradient" data-filter="all" onclick="window.AdminDapurCreatorV3.setFilter('all')">Semua ${rows.length}</button><button class="dc-v3-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700" data-filter="managed" onclick="window.AdminDapurCreatorV3.setFilter('managed')">Managed ${managed}</button><button class="dc-v3-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700" data-filter="community" onclick="window.AdminDapurCreatorV3.setFilter('community')">Community ${community}</button><button class="dc-v3-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700" data-filter="published" onclick="window.AdminDapurCreatorV3.setFilter('published')">Published ${published}</button></div>
        </div>
        <div class="flex items-center justify-between px-1"><div class="text-[10px] text-slate-500"><b class="text-[#151c75]">${official}</b> Official Studihome · <b class="text-[#151c75]">${verified}</b> terverifikasi</div><button type="button" class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapurCreatorV3.collapseAll()">Tutup semua</button></div>
        <div id="dc-v3-list" class="space-y-2">
          ${rows.map((c) => `
            <details class="dc-v3-item card-3d rounded-2xl bg-white overflow-hidden" data-creator-id="${c.id}" data-type="${c.managed_by_studihome ? 'managed' : 'community'}" data-published="${c.is_published ? '1' : '0'}" data-search="${esc(`${c.display_name || ''} ${c.username || ''} ${c.bio || ''} ${c.location || ''}`).toLowerCase()}">
              <summary class="list-none cursor-pointer p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">${c.avatar_url ? `<img src="${esc(c.avatar_url)}" alt="" class="w-full h-full object-contain bg-white">` : `<span class="font-black text-[#151c75]">${esc(String(c.display_name || 'C').charAt(0).toUpperCase())}</span>`}</div>
                  <div class="min-w-0"><div class="text-xs sm:text-sm font-extrabold text-[#151c75] truncate flex items-center gap-1.5">${esc(c.display_name || c.username)} ${c.is_studihome_official ? '<span class="text-amber-500">✦</span>' : ''}</div><div class="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5">@${esc(c.username)} · ${c.is_published ? 'Published' : 'Draft'} · ${c.is_verified ? 'Verified' : 'Belum verified'} · ♥ ${c.like_count}</div></div>
                </div>
                <div class="flex items-center gap-2 shrink-0"><span class="px-2 py-1 rounded-lg text-[9px] font-bold ${c.is_studihome_official ? 'bg-amber-50 text-amber-700' : c.managed_by_studihome ? 'bg-blue-50 text-[#151c75]' : 'bg-slate-100 text-slate-600'}">${c.is_studihome_official ? '✦ Official' : c.managed_by_studihome ? 'Managed' : 'Community'}</span><i class="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i></div>
              </summary>
              <div class="border-t border-slate-100 p-4" data-detail-host><div class="py-5 text-center text-[10px] text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Menyiapkan Creator…</div></div>
            </details>`).join('') || '<div class="card-3d-inset rounded-2xl p-8 text-center text-xs text-slate-500">Belum ada Creator.</div>'}
        </div>
      </div>`;
  }

  async function render() {
    if (!isAdmin()) return;
    const root = document.getElementById('admin-dapur-creator-content');
    if (!root) return;
    root.innerHTML = '<div class="py-14 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan daftar Creator…</div>';
    try {
      const rows = await loadCreatorData();
      root.innerHTML = renderShell(rows);
      root.querySelectorAll('.dc-v3-item').forEach((details) => {
        details.addEventListener('toggle', async () => {
          if (!details.open) return;
          const host = details.querySelector('[data-detail-host]');
          if (!host || host.dataset.loaded === '1') return;
          const creator = rows.find((item) => item.id === details.dataset.creatorId);
          if (creator) await renderDetail(host, creator);
        });
      });
    } catch (e) {
      root.innerHTML = `<div class="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"><div class="font-black">Dapur Creator belum dapat dimuat.</div><div class="text-xs mt-1">${esc(e.message || 'Koneksi data belum siap.')}</div><button type="button" class="mt-3 px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-700" onclick="window.AdminDapurCreatorV3.render()">Coba lagi</button></div>`;
    }
  }

  function filter(query) {
    const value = String(query || '').trim().toLowerCase();
    document.querySelectorAll('#dc-v3-list .dc-v3-item').forEach((row) => {
      row.style.display = !value || (row.dataset.search || '').includes(value) ? '' : 'none';
    });
  }

  function setFilter(kind) {
    document.querySelectorAll('.dc-v3-filter').forEach((button) => {
      const active = button.dataset.filter === kind;
      button.classList.toggle('btn-brand-gradient', active);
      button.classList.toggle('bg-white', !active);
      button.classList.toggle('text-slate-700', !active);
    });
    document.querySelectorAll('#dc-v3-list .dc-v3-item').forEach((row) => {
      const show = kind === 'all' || kind === row.dataset.type || (kind === 'published' && row.dataset.published === '1');
      row.style.display = show ? '' : 'none';
    });
  }

  function collapseAll() {
    document.querySelectorAll('#dc-v3-list details').forEach((row) => { row.open = false; });
  }

  function open() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = '<div id="admin-dapur-creator-content"></div>';
    render();
  }

  window.AdminDapurCreatorV3 = { render, open, filter, setFilter, collapseAll, adjustLikes, toggleVerified, togglePublished, editProfile };
  window.AdminDapurCreatorRuntime = window.AdminDapurCreatorV3;

  function boot() {
    if (!isAdmin()) return;
    const starter = () => { if (window.App?.state?.user || client()) render(); };
    window.addEventListener('studi:ready', starter, { once: false });
    starter();
  }

  boot();
})();
