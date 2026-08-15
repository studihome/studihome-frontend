(() => {
  'use strict';

  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  function getClient() {
    return window.supabaseClient || window.App?.supabase || window.App?.db || null;
  }

  async function waitForClient(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const db = getClient();
      if (db && typeof db.from === 'function') return db;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error('Koneksi data Admin belum siap. Silakan tunggu sebentar lalu buka Dapur Creator lagi.');
  }

  async function loadData() {
    const db = await waitForClient();
    const [profiles, likes, adjustments] = await Promise.all([
      db.from('creator_profiles').select('id,user_id,username,display_name,bio,avatar_url,whatsapp,location,is_published,is_verified,review_status,is_studihome_official,managed_by_studihome,updated_at').order('display_name', { ascending: true }),
      db.from('creator_likes').select('creator_id'),
      db.from('creator_like_adjustments').select('creator_id,delta_count')
    ]);
    if (profiles.error) throw profiles.error;
    if (likes.error) throw likes.error;
    if (adjustments.error) throw adjustments.error;

    const likeMap = new Map();
    (likes.data || []).forEach(row => likeMap.set(row.creator_id, (likeMap.get(row.creator_id) || 0) + 1));
    (adjustments.data || []).forEach(row => likeMap.set(row.creator_id, (likeMap.get(row.creator_id) || 0) + Number(row.delta_count || 0)));

    return (profiles.data || []).map(c => ({ ...c, likeCount: Math.max(0, likeMap.get(c.id) || 0) }));
  }

  async function updateProfile(id, patch) {
    const db = await waitForClient();
    const { error } = await db.from('creator_profiles').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function adjustLikes(id, delta) {
    const db = await waitForClient();
    const uid = window.App?.state?.user?.id;
    if (!uid) throw new Error('Sesi Admin belum siap.');
    const { error } = await db.from('creator_like_adjustments').insert({
      creator_id: id,
      delta_count: delta,
      reason: delta > 0 ? 'Penyesuaian like oleh Admin' : 'Koreksi like oleh Admin',
      created_by: uid
    });
    if (error) throw error;
  }

  async function loadBundle(id) {
    const db = await waitForClient();
    const [services, portfolios, categories] = await Promise.all([
      db.from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      db.from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      db.from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id)
    ]);
    if (services.error) throw services.error;
    if (portfolios.error) throw portfolios.error;
    if (categories.error) throw categories.error;
    return {
      services: services.data || [],
      portfolios: portfolios.data || [],
      categories: categories.data || []
    };
  }

  function openAdminCreator(id) {
    const row = document.querySelector(`#admin-dc-v4-list .dc-v4-row[data-creator-id="${CSS.escape(id)}"]`);
    if (!row) return;
    row.open = true;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function renderDetail(host, creator) {
    if (!host || host.dataset.loaded === '1') return;
    try {
      const bundle = await loadBundle(creator.id);
      host.dataset.loaded = '1';
      host.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">Creator Workspace</div>
              <div class="mt-1 text-sm font-black text-[#151c75]">${esc(creator.display_name || creator.username)}</div>
              <div class="mt-0.5 text-[9px] text-slate-500">@${esc(creator.username || '-')} · ${creator.managed_by_studihome ? 'Managed Studihome' : 'Community'}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="/${encodeURIComponent(creator.username)}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-extrabold text-[#151c75]">Dapurku</a>
              <a href="/dapur" class="px-3 py-2 rounded-xl btn-brand-gradient text-[10px] font-extrabold">Kelola Dapur</a>
              <button type="button" class="px-3 py-2 rounded-xl ${creator.is_verified ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'} text-[10px] font-extrabold" data-v4-action="verify">${creator.is_verified ? 'Cabut Verifikasi' : 'Verifikasi'}</button>
              <button type="button" class="px-3 py-2 rounded-xl ${creator.is_published ? 'bg-red-50 text-red-700' : 'btn-brand-gradient'} text-[10px] font-extrabold" data-v4-action="publish">${creator.is_published ? 'Tarik Publish' : 'Publish'}</button>
            </div>
          </div>

          <div class="grid xl:grid-cols-2 gap-3">
            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between gap-2 mb-3"><h4 class="text-xs font-black text-[#151c75]">Foyer</h4><button type="button" data-v4-action="profile" class="text-[10px] font-bold text-[#151c75]">Kelola Profil</button></div>
              <div class="grid sm:grid-cols-2 gap-2 text-[10px]">
                <span class="text-slate-500">Nama</span><b class="text-right">${esc(creator.display_name || '-')}</b>
                <span class="text-slate-500">Lokasi</span><b class="text-right">${esc(creator.location || '-')}</b>
                <span class="text-slate-500">WhatsApp</span><b class="text-right">${esc(creator.whatsapp || '-')}</b>
              </div>
            </section>
            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between gap-2 mb-3"><h4 class="text-xs font-black text-[#151c75]">Status & Like</h4><div class="text-sm font-black text-[#151c75]">♥ ${creator.likeCount}</div></div>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-v4-action="like-minus" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold">− Like</button>
                <button type="button" data-v4-action="like-plus" class="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[10px] font-bold text-[#151c75]">+ Like</button>
                <span class="px-3 py-2 rounded-xl ${creator.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold">${creator.is_verified ? 'Verified' : 'Belum Verified'}</span>
                <span class="px-3 py-2 rounded-xl ${creator.is_published ? 'bg-blue-50 text-[#151c75]' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold">${creator.is_published ? 'Published' : 'Draft'}</span>
              </div>
            </section>

            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black text-[#151c75]">Menu</h4><span class="text-[9px] text-slate-400">${bundle.categories.length} kategori</span></div>
              <div class="flex flex-wrap gap-1.5">${bundle.categories.length ? bundle.categories.map(c => `<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-bold">${esc(c.ai_categories?.name || c.category_id)}${c.is_primary ? ' · utama' : ''}</span>`).join('') : '<span class="text-[10px] text-slate-400">Belum ada kategori.</span>'}</div>
            </section>

            <section class="card-3d-inset rounded-2xl p-4">
              <div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black text-[#151c75]">Hidangan</h4><span class="text-[9px] text-slate-400">${bundle.services.length} jasa</span></div>
              <div class="space-y-1.5">${bundle.services.slice(0,4).map(s => `<div class="flex items-center justify-between gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2"><span class="text-[10px] font-bold text-slate-700 truncate">${esc(s.title)}</span><span class="text-[9px] text-slate-400">${s.is_active ? 'Aktif' : 'Off'}</span></div>`).join('') || '<span class="text-[10px] text-slate-400">Belum ada jasa.</span>'}</div>
            </section>

            <section class="card-3d-inset rounded-2xl p-4 xl:col-span-2">
              <div class="flex items-center justify-between gap-2 mb-2"><h4 class="text-xs font-black text-[#151c75]">Ambalan</h4><span class="text-[9px] text-slate-400">${bundle.portfolios.length} portfolio</span></div>
              <div class="grid md:grid-cols-2 gap-2">${bundle.portfolios.slice(0,6).map(p => `<a href="${esc(p.media_url)}" target="_blank" rel="noopener" class="rounded-xl bg-white border border-slate-100 px-3 py-2 hover:border-blue-200"><div class="text-[10px] font-bold text-[#151c75] truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-400 mt-0.5">${esc(p.media_type)}</div></a>`).join('') || '<span class="text-[10px] text-slate-400">Belum ada portfolio.</span>'}</div>
            </section>
          </div>
        </div>`;

      host.querySelector('[data-v4-action="verify"]').addEventListener('click', async () => {
        try { await updateProfile(creator.id, { is_verified: !creator.is_verified }); toast(creator.is_verified ? 'Verifikasi Creator dicabut.' : 'Creator berhasil diverifikasi.', 'success'); await render(); } catch (e) { toast(e.message || 'Status verifikasi gagal diubah.', 'error'); }
      });
      host.querySelector('[data-v4-action="publish"]').addEventListener('click', async () => {
        try { await updateProfile(creator.id, { is_published: !creator.is_published, review_status: !creator.is_published ? 'APPROVED' : 'DRAFT' }); toast(creator.is_published ? 'Creator ditarik dari publik.' : 'Creator dipublikasikan.', 'success'); await render(); } catch (e) { toast(e.message || 'Status publish gagal diubah.', 'error'); }
      });
      host.querySelector('[data-v4-action="profile"]').addEventListener('click', () => window.open('/dapur/foyer', '_blank', 'noopener'));
      host.querySelector('[data-v4-action="like-plus"]').addEventListener('click', async () => { try { await adjustLikes(creator.id, 1); toast('1 like ditambahkan untuk Creator.', 'success'); await render(); openAdminCreator(creator.id); } catch (e) { toast(e.message || 'Like gagal diperbarui.', 'error'); } });
      host.querySelector('[data-v4-action="like-minus"]').addEventListener('click', async () => { try { await adjustLikes(creator.id, -1); toast('1 like dikurangi untuk Creator.', 'success'); await render(); openAdminCreator(creator.id); } catch (e) { toast(e.message || 'Like gagal diperbarui.', 'error'); } });
    } catch (e) {
      host.innerHTML = `<div class="rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-[10px] text-red-700">${esc(e.message || 'Detail Creator belum dapat dimuat.')}</div>`;
    }
  }

  async function render() {
    if (!isAdmin()) return;
    const root = document.getElementById('admin-dapur-creator-v4');
    if (!root) return;
    root.innerHTML = '<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan daftar Creator…</div>';
    try {
      const rows = await loadData();
      root.innerHTML = `
        <div class="space-y-4">
          <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">DAPUR CREATOR · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Semua Creator, satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1 max-w-2xl">Buka nama Creator untuk verifikasi, like, profil, dan akses langsung ke Dapur Creator.</p></div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:min-w-[420px]">${[['Total',rows.length],['Managed',rows.filter(x=>x.managed_by_studihome).length],['Community',rows.filter(x=>!x.managed_by_studihome).length],['Published',rows.filter(x=>x.is_published).length]].map(([l,v])=>`<div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">${l}</div><div class="text-lg font-black text-[#151c75]">${v}</div></div>`).join('')}</div>
            </div>
          </div>
          <div class="card-3d-inset rounded-2xl p-3 flex items-center gap-2"><i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i><input id="admin-dc-v4-search" type="search" placeholder="Cari nama, username, bio, atau lokasi Creator…" class="w-full bg-transparent text-xs outline-none"></div>
          <div id="admin-dc-v4-list" class="space-y-2">
            ${rows.map(c => `<details class="dc-v4-row card-3d rounded-2xl bg-white overflow-hidden" data-creator-id="${c.id}" data-search="${esc(`${c.display_name || ''} ${c.username || ''} ${c.bio || ''} ${c.location || ''}`).toLowerCase()}">
              <summary class="list-none cursor-pointer p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0"><div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">${c.avatar_url ? `<img src="${esc(c.avatar_url)}" alt="" class="w-full h-full object-contain bg-white">` : `<span class="font-black text-[#151c75]">${esc(String(c.display_name || 'C').charAt(0).toUpperCase())}</span>`}</div><div class="min-w-0"><div class="text-xs sm:text-sm font-extrabold text-[#151c75] truncate">${esc(c.display_name || c.username)} ${c.is_studihome_official ? '<span class="text-amber-500">✦</span>' : ''}</div><div class="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5">@${esc(c.username)} · ${c.is_published ? 'Published' : 'Draft'} · ${c.is_verified ? 'Verified' : 'Belum verified'} · ♥ ${c.likeCount}</div></div></div><div class="flex items-center gap-2 shrink-0"><span class="hidden sm:inline px-2 py-1 rounded-lg text-[9px] font-bold ${c.managed_by_studihome ? 'bg-blue-50 text-[#151c75]' : 'bg-slate-100 text-slate-600'}">${c.managed_by_studihome ? 'Managed' : 'Community'}</span><i class="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i></div>
              </summary>
              <div class="border-t border-slate-100 p-4" data-detail-host="1"><div class="py-5 text-center text-[10px] text-slate-400">Klik untuk memuat detail…</div></div>
            </details>`).join('') || '<div class="card-3d-inset rounded-2xl p-8 text-center text-xs text-slate-500">Belum ada Creator.</div>'}
          </div>
        </div>`;

      const search = root.querySelector('#admin-dc-v4-search');
      search?.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        root.querySelectorAll('.dc-v4-row').forEach(row => { row.style.display = !q || (row.dataset.search || '').includes(q) ? '' : 'none'; });
      });

      root.querySelectorAll('.dc-v4-row').forEach(row => {
        row.addEventListener('toggle', () => {
          if (!row.open) return;
          const host = row.querySelector('[data-detail-host="1"]');
          const creator = rows.find(c => c.id === row.dataset.creatorId);
          if (host && creator && host.dataset.loaded !== '1') renderDetail(host, creator);
        });
      });
    } catch (e) {
      root.innerHTML = `<div class="rounded-2xl bg-red-50 border border-red-100 px-4 py-4 text-xs text-red-700"><b>Dapur Creator belum dapat dimuat.</b><div class="mt-1">${esc(e.message || 'Koneksi data belum siap.')}</div></div>`;
    }
  }

  function open() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = '<div id="admin-dapur-creator-v4"></div>';
    render();
  }

  window.StudihomeAdminDapurCreatorV4 = { open, render };
  window.addEventListener('studi:ready', () => { if (isAdmin()) render(); });
})();
