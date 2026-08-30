(() => {
  'use strict';

  const SUPABASE_URL = 'https://hbfmhwwxbgidsnljupca.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_134slHOJ_kcw5-kxDQDVaw_y1jFO4Lv';
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  let clientPromise = null;
  let rowsCache = [];

  function getExistingClient() {
    const candidates = [window.supabaseClient, window.App?.supabase, window.App?.db];
    return candidates.find(db => db && typeof db.from === 'function') || null;
  }

  function loadSupabaseSdk() {
    if (window.supabase?.createClient) return Promise.resolve();
    if (clientPromise) return clientPromise;
    clientPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-studihome-supabase-sdk]');
      if (existing) {
        existing.addEventListener('load', () => window.supabase?.createClient ? resolve() : reject(new Error('Library Supabase gagal dimuat.')), { once: true });
        existing.addEventListener('error', () => reject(new Error('Library Supabase gagal dimuat.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.studihomeSupabaseSdk = '1';
      script.onload = () => window.supabase?.createClient ? resolve() : reject(new Error('Library Supabase tidak tersedia.'));
      script.onerror = () => reject(new Error('Library Supabase gagal dimuat.'));
      document.head.appendChild(script);
    });
    return clientPromise;
  }

  async function getClient() {
    const existing = getExistingClient();
    if (existing) return existing;
    await loadSupabaseSdk();
    if (!window.__studihomeAdminSupabase) {
      window.__studihomeAdminSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.__studihomeAdminSupabase;
  }

  async function requireAdminClient() {
    const db = await getClient();
    const { data, error } = await db.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('Sesi Admin belum siap. Silakan muat ulang halaman Admin.');
    return db;
  }

  async function loadData() {
    const db = await requireAdminClient();
    const [profiles, likes, adjustments] = await Promise.all([
      db.from('creator_profiles').select('id,user_id,username,display_name,bio,avatar_url,whatsapp,location,is_published,is_verified,review_status,is_studihome_official,managed_by_studihome,updated_at').order('display_name', { ascending: true }),
      db.from('creator_likes').select('creator_id'),
      db.from('creator_like_adjustments').select('creator_id,delta_count')
    ]);
    if (profiles.error) throw profiles.error;
    if (likes.error) throw likes.error;
    if (adjustments.error) throw adjustments.error;
    const likeMap = new Map();
    (likes.data || []).forEach(r => likeMap.set(r.creator_id, (likeMap.get(r.creator_id) || 0) + 1));
    (adjustments.data || []).forEach(r => likeMap.set(r.creator_id, (likeMap.get(r.creator_id) || 0) + Number(r.delta_count || 0)));
    rowsCache = (profiles.data || []).map(c => ({ ...c, likeCount: Math.max(0, likeMap.get(c.id) || 0) }));
    return rowsCache;
  }

  async function loadBundle(id) {
    const db = await requireAdminClient();
    const [services, portfolios, categories] = await Promise.all([
      db.from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      db.from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      db.from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id)
    ]);
    if (services.error) throw services.error;
    if (portfolios.error) throw portfolios.error;
    if (categories.error) throw categories.error;
    return { services: services.data || [], portfolios: portfolios.data || [], categories: categories.data || [] };
  }

  async function patchProfile(id, patch) {
    const db = await requireAdminClient();
    const { error } = await db.from('creator_profiles').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function adjustCreatorLike(creatorId, type) {
    try {
      const inputEl = document.getElementById(`like-input-${creatorId}`);
      const parsed = inputEl ? parseInt(inputEl.value, 10) : 1;
      const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
      const finalDelta = type === 'minus' ? -amount : amount;

      if (typeof window.App?.api?.post !== 'function') throw new Error('Layanan penyesuaian Like belum siap.');
      await window.App.api.post('ADMIN_ADD_CREATOR_LIKE_ADJUSTMENT', {
        creatorId,
        delta: finalDelta,
        reason: 'Admin manual adjustment'
      });

      if (inputEl) inputEl.value = '1';

      const countEl = document.getElementById(`admin-like-count-${creatorId}`);
      if (countEl) {
        const currentText = countEl.innerText || '';
        const currentNumber = parseInt(currentText.replace(/[^0-9-]/g, ''), 10) || 0;
        const newNumber = currentNumber + finalDelta;
        countEl.innerHTML = `♥ ${newNumber}`;
        countEl.classList.add('text-amber-500', 'scale-110');
        setTimeout(() => countEl.classList.remove('text-amber-500', 'scale-110'), 400);
      }

      toast(`${amount} like ${type === 'minus' ? 'dikurangi.' : 'ditambahkan.'}`, 'success');
      return true;
    } catch (error) {
      console.error('[Admin Like Error]', error);
      toast('Gagal memperbarui Like. Cek koneksi.', 'error');
      return false;
    }
  }

  function renderDetail(row, creator) {
    row.innerHTML = '<div class="p-4 text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat workspace Creator…</div>';
    loadBundle(creator.id).then(bundle => {
      row.innerHTML = `
        <div class="p-4 border-t border-blue-50 bg-slate-50/50 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">Dapur Creator</div><div class="mt-1 text-sm font-black text-[#151c75]">${esc(creator.display_name || creator.username)}</div><div class="text-[9px] text-slate-500">@${esc(creator.username || '-')} · ${creator.managed_by_studihome ? 'Managed Studihome' : 'Community'}</div></div>
            <div class="flex flex-wrap gap-2">
              <a href="/${encodeURIComponent(creator.username || '')}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-extrabold text-[#151c75]">Dapurku</a>
              <a href="/dapur/${encodeURIComponent(creator.username || "")}" rel="noopener" class="px-3 py-2 rounded-xl bg-[#151c75] text-white text-[10px] font-extrabold" aria-label="Kelola Dapur ${esc(creator.display_name || creator.username)}">Kelola Dapur</a>
              <button type="button" data-action="verify" class="px-3 py-2 rounded-xl ${creator.is_verified ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'} text-[10px] font-extrabold">${creator.is_verified ? 'Cabut Verifikasi' : 'Verifikasi'}</button>
              <button type="button" data-action="publish" class="px-3 py-2 rounded-xl ${creator.is_published ? 'bg-red-50 text-red-700' : 'bg-[#3f48bf] text-white'} text-[10px] font-extrabold">${creator.is_published ? 'Tarik Publish' : 'Publish'}</button>
            </div>
          </div>
          <div class="grid xl:grid-cols-2 gap-3">
            <section class="rounded-2xl p-4 bg-white border border-slate-100"><div class="flex items-center justify-between mb-3"><h4 class="text-xs font-black text-[#151c75]">Profil</h4><span class="text-[9px] text-slate-400">${creator.review_status || 'DRAFT'}</span></div><div class="grid sm:grid-cols-2 gap-2 text-[10px]"><span class="text-slate-500">Nama</span><b class="text-right">${esc(creator.display_name || '-')}</b><span class="text-slate-500">Lokasi</span><b class="text-right">${esc(creator.location || '-')}</b><span class="text-slate-500">WhatsApp</span><b class="text-right">${esc(creator.whatsapp || '-')}</b></div></section>
            <section class="rounded-2xl p-4 bg-white border border-slate-100"><div class="flex items-center justify-between mb-3"><h4 class="text-xs font-black text-[#151c75]">Status & Like</h4><span id="admin-like-count-${creator.id}" class="font-bold text-sm text-[#151c75] transition-all duration-300">♥ ${creator.likeCount}</span></div><div class="flex flex-wrap items-center gap-2"><div class="flex items-center gap-1.5"><button type="button" data-action="minus" class="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-extrabold transition-all">− Like</button><input type="number" id="like-input-${creator.id}" data-like-input value="1" min="1" step="1" inputmode="numeric" class="w-16 px-2 py-1.5 text-[10px] font-bold text-center border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" title="Jumlah Like" aria-label="Jumlah penyesuaian Like"><button type="button" data-action="plus" class="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-extrabold transition-all">+ Like</button></div><span class="px-3 py-2 rounded-xl ${creator.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold">${creator.is_verified ? 'Verified' : 'Belum Verified'}</span><span class="px-3 py-2 rounded-xl ${creator.is_published ? 'bg-blue-50 text-[#151c75]' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold">${creator.is_published ? 'Published' : 'Draft'}</span></div></section>
            <section class="rounded-2xl p-4 bg-white border border-slate-100"><div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black text-[#151c75]">Menu</h4><span class="text-[9px] text-slate-400">${bundle.categories.length} kategori</span></div><div class="flex flex-wrap gap-1.5">${bundle.categories.length ? bundle.categories.map(c => `<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-bold">${esc(c.ai_categories?.name || c.category_id)}${c.is_primary ? ' · utama' : ''}</span>`).join('') : '<span class="text-[10px] text-slate-400">Belum ada kategori.</span>'}</div></section>
            <section class="rounded-2xl p-4 bg-white border border-slate-100"><div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black text-[#151c75]">Hidangan</h4><span class="text-[9px] text-slate-400">${bundle.services.length} jasa</span></div><div class="space-y-1.5">${bundle.services.slice(0,4).map(s => `<div class="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"><span class="text-[10px] font-bold text-slate-700 truncate">${esc(s.title)}</span><span class="text-[9px] text-slate-400">${s.is_active ? 'Aktif' : 'Off'}</span></div>`).join('') || '<span class="text-[10px] text-slate-400">Belum ada jasa.</span>'}</div></section>
            <section class="rounded-2xl p-4 bg-white border border-slate-100 xl:col-span-2"><div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black text-[#151c75]">Ambalan</h4><span class="text-[9px] text-slate-400">${bundle.portfolios.length} portfolio</span></div><div class="grid md:grid-cols-2 gap-2">${bundle.portfolios.slice(0,6).map(p => `<a href="${esc(p.media_url)}" target="_blank" rel="noopener" class="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2"><div class="text-[10px] font-bold text-[#151c75] truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-400 mt-0.5">${esc(p.media_type)}</div></a>`).join('') || '<span class="text-[10px] text-slate-400">Belum ada portfolio.</span>'}</div></section>
          </div>
        </div>`;
      const run = async (fn, ok, fail) => { try { await fn(); toast(ok, 'success'); await render(); } catch (e) { toast(e?.message || fail, 'error'); } };
      row.querySelector('[data-action="verify"]').onclick = () => run(() => patchProfile(creator.id, { is_verified: !creator.is_verified }), creator.is_verified ? 'Verifikasi Creator dicabut.' : 'Creator berhasil diverifikasi.', 'Verifikasi gagal diubah.');
      row.querySelector('[data-action="publish"]').onclick = () => run(() => patchProfile(creator.id, { is_published: !creator.is_published, review_status: !creator.is_published ? 'APPROVED' : 'DRAFT' }), creator.is_published ? 'Creator ditarik dari publik.' : 'Creator dipublikasikan.', 'Status publish gagal diubah.');
      row.querySelector('[data-action="plus"]').onclick = () => adjustCreatorLike(creator.id, 'plus');
      row.querySelector('[data-action="minus"]').onclick = () => adjustCreatorLike(creator.id, 'minus');
    }).catch(e => {
      row.innerHTML = `<div class="p-4 rounded-xl bg-red-50 border border-red-100 text-[10px] text-red-700">${esc(e?.message || 'Workspace Creator belum dapat dimuat.')}</div>`;
    });
  }

  async function render() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = '<div id="admin-dapur-creator-v5" class="space-y-4"><div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan Dapur Creator…</div></div>';
    try {
      const rows = await loadData();
      const root = document.getElementById('admin-dapur-creator-v5');
      root.innerHTML = `
        <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100"><div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">DAPUR CREATOR · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Semua Creator, satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1">Kelola status, like, profil, jasa, kategori dan portfolio dari satu workspace.</p></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:min-w-[420px]">${[['Total',rows.length],['Managed',rows.filter(x=>x.managed_by_studihome).length],['Community',rows.filter(x=>!x.managed_by_studihome).length],['Published',rows.filter(x=>x.is_published).length]].map(([l,v])=>`<div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">${l}</div><div class="text-lg font-black text-[#151c75]">${v}</div></div>`).join('')}</div></div></div>
        <div class="card-3d-inset rounded-2xl p-3 flex items-center gap-2"><i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i><input id="admin-dc-v5-search" type="search" placeholder="Cari nama, username, bio, atau lokasi Creator…" class="w-full bg-transparent text-xs outline-none"></div>
        <div id="admin-dc-v5-list" class="space-y-2">${rows.map(c => `<details class="dc-v5-row card-3d rounded-2xl bg-white overflow-hidden" data-id="${esc(c.id)}" data-search="${esc(`${c.display_name || ''} ${c.username || ''} ${c.bio || ''} ${c.location || ''}`).toLowerCase()}"><summary class="list-none cursor-pointer p-3.5 sm:p-4 flex items-center justify-between gap-3"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center shrink-0"><i class="fa-solid fa-user"></i></div><div class="min-w-0"><div class="text-xs font-black text-[#151c75] truncate">${esc(c.display_name || c.username || '-')}</div><div class="text-[9px] text-slate-500 truncate">@${esc(c.username || '-')} · ${c.managed_by_studihome ? 'Managed' : 'Community'}</div></div></div><div class="flex items-center gap-2 shrink-0"><span class="text-[10px] font-black text-[#151c75]">♥ ${c.likeCount}</span><span class="px-2 py-1 rounded-lg ${c.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'} text-[9px] font-bold">${c.is_verified ? 'Verified' : 'Belum'}</span><i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i></div></summary><div data-detail class="px-0 pb-0"></div></details>`).join('') || '<div class="rounded-2xl bg-white border border-slate-100 p-8 text-center text-xs text-slate-500">Belum ada Creator.</div>'}</div>`;
      root.querySelectorAll('.dc-v5-row').forEach(row => row.addEventListener('toggle', () => { if (row.open) { const c = rows.find(x => x.id === row.dataset.id); const detail = row.querySelector('[data-detail]'); if (c && detail && !detail.dataset.loaded) { detail.dataset.loaded = '1'; renderDetail(detail, c); } } }));
      root.querySelector('#admin-dc-v5-search')?.addEventListener('input', e => { const q = String(e.target.value || '').trim().toLowerCase(); root.querySelectorAll('.dc-v5-row').forEach(row => { row.hidden = q && !String(row.dataset.search || '').includes(q); }); });
    } catch (e) {
      const root = document.getElementById('admin-dapur-creator-v5');
      if (root) root.innerHTML = `<div class="rounded-2xl bg-red-50 border border-red-100 p-5 text-xs text-red-700"><div class="font-black">Dapur Creator belum dapat dimuat.</div><div class="mt-1">${esc(e?.message || 'Terjadi kesalahan koneksi data.')}</div><button type="button" id="admin-dc-v5-retry" class="mt-3 px-3 py-2 rounded-xl bg-white border border-red-200 text-[10px] font-extrabold">Coba lagi</button></div>`;
      root?.querySelector('#admin-dc-v5-retry')?.addEventListener('click', render);
    }
  }

  function open() {
    try {
      if (window.App?.admin) window.App.admin.adjustCreatorLike = adjustCreatorLike;
    } catch (_) {}
    if (isAdmin()) render();
  }
  window.StudihomeAdminDapurCreatorV5 = { open, render, adjustCreatorLike };
})();
