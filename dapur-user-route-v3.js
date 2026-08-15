(() => {
  'use strict';
  if (window.StudihomeDapurUserRouteV3) return;

  const db = () => window.supabaseClient || null;
  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const slug = () => (path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i) || [,''])[1].toLowerCase();
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function ready(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  function user() { return window.App?.state?.user || null; }
  function isAdmin() { return String(user()?.role || '').toLowerCase() === 'admin'; }

  async function getCreator() {
    const { data, error } = await db().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,contact_email,is_published,is_verified,managed_by_studihome,is_studihome_official,review_status')
      .eq('username', slug())
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Creator tidak ditemukan.');
    return data;
  }

  async function allowed(creator) {
    const u = user();
    if (!u) return false;
    if (isAdmin()) return true;
    return creator.user_id === u.id;
  }

  async function bundle(id) {
    const [s, c, p] = await Promise.all([
      db().from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id', id).order('created_at', {ascending:true}),
      db().from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id),
      db().from('creator_portfolios').select('id,title,description,media_type,media_url,is_active,sort_order').eq('creator_id', id).order('sort_order', {ascending:true}).order('created_at', {ascending:true})
    ]);
    if (s.error) throw s.error; if (c.error) throw c.error; if (p.error) throw p.error;
    return { services: s.data || [], categories: c.data || [], portfolios: p.data || [] };
  }

  async function loadEditor() {
    if (window.AdminDapurUI) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/admin-dapur-ui.js?v=4';
      s.defer = true;
      s.dataset.studihomeDapurUserEditor = '1';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Editor Dapur belum tersedia.'));
      document.head.appendChild(s);
    });
  }

  async function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!user()) {
      main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div class="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-lock"></i></div><h1 class="mt-4 text-lg font-black text-[#151c75]">Masuk untuk mengelola Dapur</h1><p class="mt-1 text-xs text-slate-500 leading-relaxed">Halaman pengelolaan Creator berada di <b>/dapur/${esc(slug())}</b> dan hanya dapat diakses oleh pemilik Creator atau Admin.</p><a href="/kamar" class="btn-brand-gradient inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Masuk / Daftar</a></div></div>`;
      return;
    }
    const creator = await getCreator();
    if (!(await allowed(creator))) {
      main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-red-100 bg-white p-7 shadow-sm"><div class="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center"><i class="fa-solid fa-shield-halved"></i></div><h1 class="mt-4 text-lg font-black text-slate-800">Akses tidak tersedia</h1><p class="mt-1 text-xs text-slate-500">Dapur ini hanya dapat dikelola oleh pemilik Creator atau Admin Studihome.</p><a href="/dapur" class="btn-brand-gradient inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Kembali ke Dapur</a></div></div>`;
      return;
    }

    await loadEditor();
    const data = await bundle(creator.id);
    const adminLabel = isAdmin() ? 'Admin Studihome' : 'Dapurku';
    main.innerHTML = `
      <div class="max-w-6xl mx-auto py-5 sm:py-7 px-3 sm:px-0 space-y-5">
        <section class="rounded-[30px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 sm:p-7 shadow-sm">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div class="flex items-center gap-4 min-w-0"><div class="w-16 h-16 rounded-3xl overflow-hidden border border-blue-100 bg-white shrink-0">${creator.avatar_url ? `<img src="${esc(creator.avatar_url)}" alt="${esc(creator.display_name || creator.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-xl font-black text-[#151c75]">${esc(String(creator.display_name || creator.username || 'C').charAt(0).toUpperCase())}</div>`}</div><div class="min-w-0"><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">${adminLabel}</div><h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75] truncate">${esc(creator.display_name || creator.username)}</h1><div class="text-[10px] text-slate-500 truncate">@${esc(creator.username)} · ${creator.is_published ? 'Published' : 'Draft'} · ${creator.is_verified ? 'Verified' : 'Belum Verified'}</div></div></div>
            <div class="flex flex-wrap gap-2"><a href="/${encodeURIComponent(creator.username)}" class="px-3.5 py-2.5 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Lihat Profil Publik</a><a href="/dapur" class="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-extrabold">Dapur</a></div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-5"><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Menu</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.categories.length}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Hidangan</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.services.length}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Ambalan</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.portfolios.length}</div></div></div>
        </section>

        <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button type="button" data-edit="profile" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Foyer</div><div class="text-[9px] text-slate-500 mt-1">Identitas & kontak.</div></button>
          <button type="button" data-edit="categories" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Menu</div><div class="text-[9px] text-slate-500 mt-1">Kategori & fokus.</div></button>
          <button type="button" data-edit="service" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500 mt-1">Kelola layanan.</div></button>
          <button type="button" data-edit="portfolio" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500 mt-1">Kelola karya.</div></button>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 class="text-sm font-black text-[#151c75]">Pengelolaan Creator</h2><p class="text-[10px] text-slate-500 mt-1">Semua pekerjaan Creator sekarang memiliki satu alamat pengelolaan: <b>/dapur/${esc(creator.username)}</b>.</p></div><div class="text-[9px] font-bold text-slate-400">${adminLabel}</div></div><div class="mt-4 rounded-2xl bg-blue-50/70 border border-blue-100 px-4 py-3 text-[10px] text-slate-600 leading-relaxed">💡 Mulai dari Foyer, lanjutkan ke Menu, isi Hidangan, lalu tampilkan Ambalan. Nggak perlu lompat-lompat halaman.</div></section>
      </div>`;

    const rerender = () => render().catch(e => window.App?.ui?.toast?.(e.message || 'Dapur belum bisa diperbarui.', 'error'));
    window.AdminDapur = window.AdminDapur || {};
    window.AdminDapur.render = rerender;
    main.querySelector('[data-edit="profile"]').onclick = () => window.AdminDapurUI?.profile(creator.id);
    main.querySelector('[data-edit="categories"]').onclick = () => window.AdminDapurUI?.categories(creator.id);
    main.querySelector('[data-edit="service"]').onclick = () => window.AdminDapurUI?.service(creator.id);
    main.querySelector('[data-edit="portfolio"]').onclick = () => window.AdminDapurUI?.portfolio(creator.id);
  }

  async function boot() {
    if (!/^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path())) return;
    if (!await ready()) return;
    try { await render(); } catch (e) {
      const main = document.getElementById('main-content');
      if (main) main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-red-100 bg-white p-7 shadow-sm"><div class="text-3xl text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="mt-3 text-lg font-black text-slate-800">Dapur Creator belum dapat dimuat</h1><p class="mt-1 text-xs text-slate-500">${esc(e.message || 'Data Creator belum siap.')}</p><button onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div></div>`;
    }
  }

  window.StudihomeDapurUserRouteV3 = Object.freeze({ boot });
  boot();
})();
