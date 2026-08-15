(() => {
  'use strict';
  if (window.StudihomeAdminDapurUserRoute) return;

  const RESERVED = new Set(['foyer','menu','hidangan','ambalan']);
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const getDb = () => window.supabaseClient || null;

  function targetSlug() {
    const m = String(location.pathname || '').match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})\/?$/i);
    if (!m) return '';
    const slug = m[1].toLowerCase();
    return RESERVED.has(slug) ? '' : slug;
  }

  async function loadScript(src, marker) {
    if (window.AdminDapurUI) return;
    const existing = document.querySelector(`script[data-${marker}]`);
    if (existing) {
      await new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', reject, {once:true});
      });
      return;
    }
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.dataset[marker] = '1';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Editor Creator belum dapat dimuat.'));
      document.head.appendChild(s);
    });
  }

  async function waitUntilReady(timeout=12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && getDb()) return true;
      await new Promise(r => setTimeout(r, 80));
    }
    return false;
  }

  async function getCreator(slug) {
    const { data, error } = await getDb().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,contact_email,is_published,is_verified,review_status,review_note,managed_by_studihome,is_studihome_official')
      .eq('username', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Creator dengan username tersebut tidak ditemukan.');
    return data;
  }

  async function getBundle(id) {
    const db = getDb();
    const [s,c,p] = await Promise.all([
      db.from('creator_services').select('*').eq('creator_id', id).order('created_at', {ascending:true}),
      db.from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id),
      db.from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', {ascending:true}).order('created_at', {ascending:true})
    ]);
    if (s.error) throw s.error;
    if (c.error) throw c.error;
    if (p.error) throw p.error;
    return {services:s.data||[], categories:c.data||[], portfolios:p.data||[]};
  }

  async function refresh(container, slug) {
    const creator = await getCreator(slug);
    const bundle = await getBundle(creator.id);
    container.innerHTML = `
      <div class="space-y-5">
        <div class="card-3d rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">DAPUR CREATOR · ADMIN</div>
              <h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75] truncate">${esc(creator.display_name || creator.username)}</h1>
              <p class="text-[10px] sm:text-xs text-slate-500 mt-1">${creator.is_studihome_official ? '✦ Creator Official Studihome · ' : ''}@${esc(creator.username)} · ${creator.managed_by_studihome ? 'Managed Studihome' : 'Community'}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="/${encodeURIComponent(creator.username)}" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Dapurku · Profil Publik</a>
              <button type="button" id="dc-user-refresh" class="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-extrabold">Muat Ulang</button>
              <button type="button" id="dc-user-back" class="px-3 py-2 rounded-xl btn-brand-gradient text-[10px] font-extrabold">Kembali Admin</button>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            <div class="rounded-xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-500">Menu</div><div class="text-lg font-black text-[#151c75]">${bundle.categories.length}</div></div>
            <div class="rounded-xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-500">Hidangan</div><div class="text-lg font-black text-[#151c75]">${bundle.services.length}</div></div>
            <div class="rounded-xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-500">Ambalan</div><div class="text-lg font-black text-[#151c75]">${bundle.portfolios.length}</div></div>
            <div class="rounded-xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-500">Status</div><div class="text-xs font-black text-[#151c75]">${creator.is_published ? 'Published' : 'Draft'} · ${creator.is_verified ? 'Verified' : 'Belum Verified'}</div></div>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button type="button" data-edit="profile" class="card-3d rounded-2xl p-4 text-left bg-white hover:border-blue-200"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Foyer</div><div class="text-[9px] text-slate-500 mt-1">Identitas, bio, kontak, publikasi.</div></button>
          <button type="button" data-edit="categories" class="card-3d rounded-2xl p-4 text-left bg-white hover:border-blue-200"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Menu</div><div class="text-[9px] text-slate-500 mt-1">Kategori dan keahlian Creator.</div></button>
          <button type="button" data-edit="service" class="card-3d rounded-2xl p-4 text-left bg-white hover:border-blue-200"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500 mt-1">Tambah atau edit jasa Creator.</div></button>
          <button type="button" data-edit="portfolio" class="card-3d rounded-2xl p-4 text-left bg-white hover:border-blue-200"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500 mt-1">Tambah atau edit portfolio.</div></button>
        </div>

        <div class="card-3d rounded-3xl p-4 sm:p-5 bg-white">
          <div class="flex items-center justify-between gap-3"><div><h2 class="text-sm font-black text-[#151c75]">Ringkasan Creator</h2><p class="text-[10px] text-slate-500 mt-1">Klik item untuk membuka editor instan.</p></div></div>
          <div class="mt-4 space-y-2">
            ${bundle.services.slice(0,4).map(s => `<div class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(s.title)}</div><div class="text-[9px] text-slate-400">Rp ${Number(s.price_from||0).toLocaleString('id-ID')} · ${Number(s.delivery_days||1)} hari</div></div><button type="button" class="text-[9px] font-extrabold text-[#151c75]" data-service-id="${s.id}">Edit</button></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada Hidangan.</div>'}
            ${bundle.portfolios.slice(0,4).map(p => `<div class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-400">${esc(p.media_type)}</div></div><button type="button" class="text-[9px] font-extrabold text-[#151c75]" data-portfolio-id="${p.id}">Edit</button></div>`).join('') || ''}
          </div>
        </div>
      </div>`;

    const rerender = () => refresh(container, slug).catch(e => window.App?.ui?.toast?.(e.message || 'Dapur Creator belum bisa diperbarui.', 'error'));
    window.AdminDapur = window.AdminDapur || {};
    window.AdminDapur.render = rerender;
    container.querySelector('#dc-user-refresh').onclick = rerender;
    container.querySelector('#dc-user-back').onclick = () => { location.href = '/admin'; };
    container.querySelector('[data-edit="profile"]').onclick = () => window.AdminDapurUI?.profile(creator.id);
    container.querySelector('[data-edit="categories"]').onclick = () => window.AdminDapurUI?.categories(creator.id);
    container.querySelector('[data-edit="service"]').onclick = () => window.AdminDapurUI?.service(creator.id);
    container.querySelector('[data-edit="portfolio"]').onclick = () => window.AdminDapurUI?.portfolio(creator.id);
    container.querySelectorAll('[data-service-id]').forEach(btn => btn.onclick = () => window.AdminDapurUI?.service(creator.id, btn.dataset.serviceId));
    container.querySelectorAll('[data-portfolio-id]').forEach(btn => btn.onclick = () => window.AdminDapurUI?.portfolio(creator.id, btn.dataset.portfolioId));
  }

  async function boot() {
    const slug = targetSlug();
    if (!slug) return;
    const ready = await waitUntilReady();
    if (!ready) return;
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!window.App?.state?.user || String(window.App.state.user.role || '').toLowerCase() !== 'admin') {
      main.innerHTML = '<div class="card-3d p-7 rounded-3xl bg-white max-w-xl mx-auto my-8 text-center"><div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-shield-halved"></i></div><h1 class="text-lg font-black text-slate-800">Akses Admin Diperlukan</h1><p class="text-xs text-slate-500 mt-1">Halaman Dapur Creator per-user hanya dapat dikelola oleh Admin.</p><button onclick="location.href=\'/\'" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Kembali ke Teras</button></div>';
      return;
    }
    try {
      await loadScript('/admin-dapur-ui.js?v=2','studihomeAdminDapurUI');
      if (!getDb()) throw new Error('Koneksi Admin belum siap.');
      main.innerHTML = '<div class="max-w-5xl mx-auto"><div id="admin-dapur-user-root" class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan Dapur Creator…</div></div>';
      App.ui.renderNavigation();
      await refresh(document.getElementById('admin-dapur-user-root'), slug);
    } catch (e) {
      main.innerHTML = `<div class="card-3d p-7 rounded-3xl bg-white max-w-xl mx-auto my-8 text-center"><div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="text-lg font-black text-slate-800">Dapur Creator belum dapat dimuat</h1><p class="text-xs text-slate-500 mt-1 leading-relaxed">${esc(e.message || 'Koneksi atau data Creator belum siap.')}</p><button onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div>`;
    }
  }

  const api = { boot, targetSlug };
  window.StudihomeAdminDapurUserRoute = Object.freeze(api);
  boot();
})();
