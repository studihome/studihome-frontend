(() => {
  'use strict';
  if (window.StudihomeDapurRuntimeV4) return;

  const RESERVED = new Set(['foyer', 'menu', 'hidangan', 'ambalan']);
  const normalizePath = () => (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const isRoot = () => normalizePath() === '/dapur';
  const getSlug = () => {
    const m = normalizePath().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);
    if (!m) return '';
    const slug = m[1].toLowerCase();
    return RESERVED.has(slug) ? '' : slug;
  };
  const isDapurPath = () => isRoot() || /^\/dapur\/[^/]+$/i.test(normalizePath()) || /^\/dapur\/(foyer|menu|hidangan|ambalan)$/i.test(normalizePath());
  const db = () => window.supabaseClient || null;
  const user = () => window.App?.state?.user || null;
  const isAdmin = () => String(user()?.role || '').toLowerCase() === 'admin';
  const esc = (value) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(value)
    : String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const waitReady = async (timeout = 12000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  };

  const ownCreator = async () => {
    const uid = user()?.id;
    if (!uid || !db()) return null;
    const { data, error } = await db().from('creator_profiles')
      .select('id,user_id,username,display_name,avatar_url,is_published,is_verified,managed_by_studihome,is_studihome_official,review_status')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  };

  const creatorBySlug = async (slug) => {
    const { data, error } = await db().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,contact_email,is_published,is_verified,managed_by_studihome,is_studihome_official,review_status')
      .eq('username', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Creator tidak ditemukan.');
    return data;
  };

  const renderStatusPill = (label, active) => `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}"><span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}"></span>${label}</span>`;

  const flowCard = (no, title, text, tone = 'blue') => `
    <div class="rounded-2xl border ${tone === 'amber' ? 'border-amber-100 bg-amber-50/70' : 'border-blue-100 bg-white/90'} p-4">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-xl ${tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-[#151c75]'} flex items-center justify-center text-[10px] font-black">${no}</span>
        <div class="text-[11px] font-black text-[#151c75]">${title}</div>
      </div>
      <div class="mt-2 pl-11 text-[10px] leading-relaxed text-slate-500">${text}</div>
    </div>`;

  async function renderRoot() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const currentUser = user();
    const own = currentUser ? await ownCreator().catch(() => null) : null;
    const admin = isAdmin();

    const memberContext = admin ? `
      <div class="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-white text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-shield-halved text-[11px]"></i></div>
        <div><div class="text-[10px] font-black text-[#151c75]">Mode Admin</div><p class="mt-1 text-[10px] leading-relaxed text-slate-600">Root <b>/dapur</b> hanya untuk program Creator. Untuk mengelola Creator tertentu, buka langsung <b>/dapur/{username}</b>.</p></div>
      </div>` : own ? `
      <div class="mt-6 rounded-2xl border border-blue-100 bg-white/95 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="w-11 h-11 rounded-2xl overflow-hidden border border-blue-100 bg-blue-50 shrink-0">
          ${own.avatar_url ? `<img src="${esc(own.avatar_url)}" alt="${esc(own.display_name || own.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-sm font-black text-[#151c75]">${esc(String(own.display_name || own.username || 'C').charAt(0).toUpperCase())}</div>`}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Dapurku</div>
          <div class="mt-0.5 text-sm font-black text-[#151c75] truncate">${esc(own.display_name || own.username)}</div>
          <div class="mt-0.5 text-[9px] text-slate-500 truncate">@${esc(own.username)} · ${own.is_published ? 'Sudah tayang' : 'Masih draft'}${own.is_verified ? ' · Verified' : ''}</div>
        </div>
        <a href="/dapur/${encodeURIComponent(own.username)}" class="btn-brand-gradient px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold shrink-0 text-center">Kelola Dapur</a>
      </div>` : `
      <div class="mt-6 rounded-2xl border border-slate-200 bg-white/95 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Belum punya Dapur</div><div class="mt-0.5 text-sm font-black text-[#151c75]">Skill kamu adalah bahan utamanya.</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Gabung Creator untuk mendapatkan alamat pengelolaan pribadi di <b>/dapur/{username}</b>.</p></div>
        <a href="/kamar" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-center shrink-0">Gabung Jadi Creator</a>
      </div>`;

    main.innerHTML = `
      <div class="max-w-6xl mx-auto px-3 sm:px-0 py-5 sm:py-8">
        <section class="relative overflow-hidden rounded-[34px] border border-blue-100 bg-gradient-to-br from-[#f7f9ff] via-white to-blue-50 p-5 sm:p-8 lg:p-10 shadow-sm">
          <div class="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="absolute -left-16 bottom-0 w-56 h-56 rounded-full bg-amber-100/50 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-[1.08fr_.92fr] gap-8 lg:gap-12 items-center">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white/90 border border-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-[#151c75]"><i class="fa-solid fa-kitchen-set text-amber-500"></i> Program Creator Studihome</div>
              <h1 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.04] tracking-tight text-[#151c75]">Dari skill menjadi <span class="text-[#4a54c7]">Koki Creator.</span></h1>
              <p class="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">Belajar menata keahlian, menyajikan karya, dan membangun identitas Creator yang siap ditemukan. Anggap saja Studihome sebagai dapur latihan: bahan utamanya tetap skill dan karya kamu.</p>
              <div class="mt-6 flex flex-wrap gap-2.5"><a href="/kamar" class="btn-brand-gradient px-4 py-3 rounded-xl text-[11px] font-extrabold">Mulai Jadi Creator</a><a href="#alur-koki" class="px-4 py-3 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[11px] font-extrabold">Lihat Alurnya</a></div>
              ${memberContext}
            </div>
            <div id="alur-koki" class="rounded-[28px] bg-white/90 border border-blue-100 p-5 sm:p-6 shadow-sm">
              <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">Resep program</div>
              <h2 class="mt-1 text-lg font-black text-[#151c75]">Empat langkah sampai siap ditawarkan.</h2>
              <div class="mt-5 grid gap-2.5">
                ${flowCard('01','Kenali skillmu','Tentukan fokus, keahlian, dan jenis karya yang paling ingin kamu bawa.')}
                ${flowCard('02','Masak identitasmu','Rapikan profil, kategori, kontak, dan positioning Creator.')}
                ${flowCard('03','Sajikan karya','Isi Hidangan dan Ambalan dengan karya yang benar-benar siap diperlihatkan.')}
                ${flowCard('04','Siap jadi Koki','Gunakan satu alamat pengelolaan: <b>/dapur/{username}</b>.','amber')}
              </div>
              <div class="mt-4 rounded-2xl bg-[#151c75] px-4 py-3 text-white"><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-300">Prinsipnya</div><div class="mt-1 text-[10px] leading-relaxed text-blue-100">Satu program di root. Satu Creator, satu alamat pengelolaan. Tidak perlu lagi mencari workspace dari halaman hub.</div></div>
            </div>
          </div>
        </section>
      </div>`;
    window.App?.ui?.renderNavigation?.();
  }

  async function ensureEditor() {
    if (window.AdminDapurUI) return;
    const existing = document.querySelector('script[data-studihome-dapur-editor-v4]');
    if (existing) return new Promise((resolve, reject) => { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', () => reject(new Error('Editor Dapur gagal dimuat.')), { once: true }); });
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/admin-dapur-ui.js?v=5';
      script.defer = true;
      script.dataset.studihomeDapurEditorV4 = '1';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Editor Dapur gagal dimuat.'));
      document.head.appendChild(script);
    });
  }

  async function bundle(creatorId) {
    const [services, categories, portfolios] = await Promise.all([
      db().from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id', creatorId).order('created_at', { ascending: true }),
      db().from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', creatorId),
      db().from('creator_portfolios').select('id,title,description,media_type,media_url,is_active,sort_order').eq('creator_id', creatorId).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    ]);
    if (services.error) throw services.error;
    if (categories.error) throw categories.error;
    if (portfolios.error) throw portfolios.error;
    return { services: services.data || [], categories: categories.data || [], portfolios: portfolios.data || [] };
  }

  const renderManageHeader = (creator, stats) => `
    <section class="rounded-[30px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 sm:p-7 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-16 h-16 rounded-3xl overflow-hidden border border-blue-100 bg-white shrink-0">${creator.avatar_url ? `<img src="${esc(creator.avatar_url)}" alt="${esc(creator.display_name || creator.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-xl font-black text-[#151c75]">${esc(String(creator.display_name || creator.username || 'C').charAt(0).toUpperCase())}</div>`}</div>
          <div class="min-w-0"><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">${isAdmin() ? 'Admin Studihome' : 'Dapurku'}</div><h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75] truncate">${esc(creator.display_name || creator.username)}</h1><div class="text-[10px] text-slate-500 truncate">@${esc(creator.username)} · ${creator.review_status || 'DRAFT'}</div><div class="mt-2 flex flex-wrap gap-1.5">${renderStatusPill(creator.is_published ? 'Published' : 'Draft', !!creator.is_published)} ${renderStatusPill(creator.is_verified ? 'Verified' : 'Belum Verified', !!creator.is_verified)}</div></div>
        </div>
        <div class="flex flex-wrap gap-2"><a href="/${encodeURIComponent(creator.username)}" class="px-3.5 py-2.5 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Lihat Profil Publik</a><a href="/dapur" class="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-extrabold">Program Creator</a></div>
      </div>
      <div class="grid grid-cols-3 gap-2.5 mt-5"><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Menu</div><div class="mt-1 text-xl font-black text-[#151c75]">${stats.categories}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Hidangan</div><div class="mt-1 text-xl font-black text-[#151c75]">${stats.services}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Ambalan</div><div class="mt-1 text-xl font-black text-[#151c75]">${stats.portfolios}</div></div></div>
    </section>`;

  async function renderUserRoute() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const slug = getSlug();
    if (!slug) {
      if (/^\/dapur\/(foyer|menu|hidangan|ambalan)$/i.test(normalizePath())) {
        window.history.replaceState({}, '', '/dapur');
        return renderRoot();
      }
      return;
    }

    if (!user()) {
      main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div class="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-lock"></i></div><h1 class="mt-4 text-lg font-black text-[#151c75]">Masuk untuk mengelola Dapur</h1><p class="mt-2 text-xs leading-relaxed text-slate-500">Halaman pengelolaan Creator memakai pola <b>/dapur/{username}</b>. Hanya pemilik Creator dan Admin Studihome yang dapat mengubah isinya.</p><a href="/kamar" class="btn-brand-gradient inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Masuk / Daftar</a></div></div>`;
      return;
    }

    const creator = await creatorBySlug(slug);
    const allowed = isAdmin() || creator.user_id === user().id;
    if (!allowed) {
      main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-red-100 bg-white p-7 shadow-sm"><div class="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center"><i class="fa-solid fa-shield-halved"></i></div><h1 class="mt-4 text-lg font-black text-slate-800">Akses tidak tersedia</h1><p class="mt-2 text-xs leading-relaxed text-slate-500">Dapur ini hanya dapat dikelola oleh pemilik Creator atau Admin Studihome.</p><a href="/dapur" class="btn-brand-gradient inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Kembali ke Program</a></div></div>`;
      return;
    }

    const data = await bundle(creator.id);
    await ensureEditor();
    main.innerHTML = `
      <div class="max-w-6xl mx-auto px-3 sm:px-0 py-5 sm:py-7 space-y-5">
        ${renderManageHeader(creator, { categories: data.categories.length, services: data.services.length, portfolios: data.portfolios.length })}
        <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button type="button" data-edit="profile" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Foyer</div><div class="text-[9px] text-slate-500 mt-1">Identitas, bio, kontak.</div></button>
          <button type="button" data-edit="categories" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Menu</div><div class="text-[9px] text-slate-500 mt-1">Kategori & fokus Creator.</div></button>
          <button type="button" data-edit="service" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500 mt-1">Kelola layanan & penawaran.</div></button>
          <button type="button" data-edit="portfolio" class="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500 mt-1">Kelola karya & bukti kerja.</div></button>
        </section>
        <section class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Single Creator Workspace</div><h2 class="mt-1 text-sm font-black text-[#151c75]">Semua pengelolaan ada di satu alamat.</h2><p class="mt-1.5 text-[10px] leading-relaxed text-slate-500">Creator <b>/dapur/${esc(creator.username)}</b> adalah workspace canonical untuk profil, Menu, Hidangan, dan Ambalan. Root <b>/dapur</b> bukan lagi dashboard atau hub.</p></section>
      </div>`;

    const rerender = () => boot();
    window.AdminDapur = window.AdminDapur || {};
    window.AdminDapur.render = rerender;
    main.querySelector('[data-edit="profile"]').onclick = () => window.AdminDapurUI?.profile(creator.id);
    main.querySelector('[data-edit="categories"]').onclick = () => window.AdminDapurUI?.categories(creator.id);
    main.querySelector('[data-edit="service"]').onclick = () => window.AdminDapurUI?.service(creator.id);
    main.querySelector('[data-edit="portfolio"]').onclick = () => window.AdminDapurUI?.portfolio(creator.id);
  }

  async function boot() {
    if (!isDapurPath()) return;
    if (!await waitReady()) return;
    try {
      if (isRoot()) await renderRoot();
      else await renderUserRoute();
    } catch (error) {
      const main = document.getElementById('main-content');
      if (!main) return;
      main.innerHTML = `<div class="max-w-xl mx-auto py-14 px-4 text-center"><div class="rounded-3xl border border-red-100 bg-white p-7 shadow-sm"><div class="text-3xl text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="mt-3 text-lg font-black text-[#151c75]">Dapur belum dapat dimuat</h1><p class="mt-1 text-xs leading-relaxed text-slate-500">${esc(error?.message || 'Terjadi kendala saat memuat workspace Creator.')}</p><button type="button" onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div></div>`;
      console.error('[Dapur V4]', error);
    }
  }

  window.StudihomeDapurRuntimeV4 = Object.freeze({ boot, isDapurPath });
  boot();
})();
