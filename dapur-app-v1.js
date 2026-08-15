(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const app = () => window.supabaseClient;
  const path = () => (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const slug = () => {
    const match = path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);
    return match ? match[1].toLowerCase() : '';
  };
  const isRoot = () => path() === '/dapur';
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  const initials = (v) => String(v || 'C').trim().charAt(0).toUpperCase();

  function toast(message, type = 'info') {
    let host = document.getElementById('dapur-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'dapur-toast-host';
      host.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[min(92vw,32rem)]';
      document.body.appendChild(host);
    }
    const tone = type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : type === 'error' ? 'border-red-100 bg-red-50 text-red-800' : 'border-blue-100 bg-white text-slate-700';
    const node = document.createElement('div');
    node.className = `rounded-2xl border ${tone} shadow-2xl px-4 py-3 text-xs font-bold mb-2`;
    node.textContent = message;
    host.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  window.App = window.App || {};
  window.App.ui = window.App.ui || {};
  window.App.ui.toast = toast;
  window.App.utils = window.App.utils || {};
  window.App.utils.escapeHtml = esc;

  let currentUser = null;
  let currentIsAdmin = false;
  let currentCreator = null;
  let editorPromise = null;

  async function session() {
    if (!app()) throw new Error('Supabase belum siap.');
    const { data, error } = await app().auth.getUser();
    if (error && !/auth session missing/i.test(error.message || '')) throw error;
    return data?.user || null;
  }

  async function isAdmin() {
    if (!currentUser) return false;
    const { data, error } = await app().rpc('is_admin');
    if (error) {
      console.warn('[Dapur] is_admin RPC unavailable:', error.message);
      return false;
    }
    return data === true;
  }

  async function loadOwnCreator() {
    if (!currentUser) return null;
    const { data, error } = await app().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,is_published,is_verified,managed_by_studihome,is_studihome_official,review_status')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  async function loadCreatorBySlug(value) {
    const clean = String(value || '').toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(clean)) throw new Error('Alamat Creator tidak valid.');
    const { data, error } = await app().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,contact_email,is_published,is_verified,managed_by_studihome,is_studihome_official,review_status')
      .ilike('username', clean)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Creator tidak ditemukan.');
    return data;
  }

  async function loadBundle(creatorId) {
    const [services, categories, portfolios] = await Promise.all([
      app().from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id', creatorId).order('created_at', { ascending: true }),
      app().from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', creatorId),
      app().from('creator_portfolios').select('id,title,description,media_type,media_url,is_active,sort_order').eq('creator_id', creatorId).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    ]);
    if (services.error) throw services.error;
    if (categories.error) throw categories.error;
    if (portfolios.error) throw portfolios.error;
    return { services: services.data || [], categories: categories.data || [], portfolios: portfolios.data || [] };
  }

  function userLabel() {
    const meta = currentUser?.user_metadata || {};
    return meta.display_name || meta.full_name || meta.name || currentUser?.email?.split('@')[0] || 'Member';
  }

  function topAction() {
    const host = $('#top-action');
    if (!host) return;
    host.innerHTML = currentUser
      ? `<div class="flex items-center gap-2"><span class="hidden sm:inline text-[10px] font-bold text-slate-500 truncate max-w-48">${esc(userLabel())}</span><a href="/kamar" class="focus-ring px-3 py-2 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Kamar</a></div>`
      : `<a href="/kamar" class="focus-ring btn-brand px-3 py-2 rounded-xl text-[10px] font-extrabold">Masuk / Daftar</a>`;
  }

  function statusChip(label, active) {
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}"><span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}"></span>${label}</span>`;
  }

  function rootHtml() {
    const identity = currentCreator ? `
      <div class="mt-6 rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-soft">
        <div class="w-12 h-12 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 shrink-0">
          ${currentCreator.avatar_url ? `<img src="${esc(currentCreator.avatar_url)}" alt="${esc(currentCreator.display_name || currentCreator.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-lg font-black text-[#151c75]">${initials(currentCreator.display_name || currentCreator.username)}</div>`}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">Dapurku</div>
          <div class="mt-1 text-sm font-black text-[#151c75] truncate">${esc(currentCreator.display_name || currentCreator.username)}</div>
          <div class="mt-1 text-[9px] text-slate-500 truncate">@${esc(currentCreator.username)} · ${currentCreator.is_published ? 'Sudah tayang' : 'Masih draft'}${currentCreator.is_verified ? ' · Verified' : ''}</div>
        </div>
        <a href="/dapur/${encodeURIComponent(currentCreator.username)}" class="focus-ring btn-brand px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-center shrink-0">Kelola Dapur</a>
      </div>` : currentUser ? `
      <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center shrink-0"><i class="fa-solid fa-user"></i></div>
        <div class="flex-1"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">Anda sedang login</div><div class="mt-1 text-sm font-black text-[#151c75]">${esc(userLabel())}</div><div class="mt-1 text-[10px] text-slate-500">Belum memiliki Dapur Creator.</div></div>
        <a href="/kamar" class="focus-ring btn-brand px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-center shrink-0">Mulai Bergabung</a>
      </div>` : `
      <div class="mt-6 rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-soft">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-utensils"></i></div>
        <div class="flex-1"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">Buka kesempatanmu</div><div class="mt-1 text-sm font-black text-[#151c75]">Gabung Creator dan siapkan Dapurmu.</div><div class="mt-1 text-[10px] leading-relaxed text-slate-500">Setelah punya username Creator, pengelolaanmu selalu berada di <b>/dapur/{username}</b>.</div></div>
        <a href="/kamar" class="focus-ring btn-amber px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-center shrink-0">Gabung Creator</a>
      </div>`;

    return `
      <div class="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <section class="relative overflow-hidden rounded-[34px] border border-blue-100 bg-gradient-to-br from-[#f7f9ff] via-white to-blue-50 p-6 sm:p-10 lg:p-12 shadow-soft">
          <div class="absolute -right-28 -top-24 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl"></div>
          <div class="absolute -left-24 bottom-0 w-72 h-72 rounded-full bg-amber-100/45 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-[1.05fr_.95fr] gap-9 lg:gap-12 items-center">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white border border-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.13em] text-[#151c75]"><i class="fa-solid fa-kitchen-set text-amber-500"></i> Program Creator Studihome</div>
              <h1 class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] text-[#151c75]">Masak skillmu.<br><span class="text-[#4a54c7]">Jadi Koki Creator.</span></h1>
              <p class="mt-5 text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl">Program untuk membantu kamu merapikan keahlian, menyajikan karya, dan membangun identitas Creator yang siap ditemukan. Satu Creator, satu Dapur, satu alamat pengelolaan.</p>
              <div class="mt-6 flex flex-wrap gap-2.5"><a href="/kamar" class="focus-ring btn-brand px-5 py-3 rounded-xl text-[11px] font-extrabold">Mulai Jadi Creator</a><a href="#alur" class="focus-ring px-5 py-3 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[11px] font-extrabold">Lihat Alur</a></div>
              ${identity}
            </div>
            <div id="alur" class="rounded-[30px] bg-white/95 border border-blue-100 p-5 sm:p-6">
              <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">Resep program</div>
              <h2 class="mt-1 text-lg font-black text-[#151c75]">Empat langkah menuju Dapurmu.</h2>
              <div class="mt-5 space-y-2.5">
                <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><div class="flex gap-3"><b class="w-8 h-8 rounded-xl bg-white text-[#151c75] flex items-center justify-center text-[10px]">01</b><div><div class="text-[11px] font-black text-[#151c75]">Kenali skill</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Tentukan keahlian, fokus, dan karya yang ingin kamu tampilkan.</p></div></div></div>
                <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><div class="flex gap-3"><b class="w-8 h-8 rounded-xl bg-white text-[#151c75] flex items-center justify-center text-[10px]">02</b><div><div class="text-[11px] font-black text-[#151c75]">Masak identitas</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Rapikan nama, bio, kategori, kontak, dan positioning Creator.</p></div></div></div>
                <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><div class="flex gap-3"><b class="w-8 h-8 rounded-xl bg-white text-[#151c75] flex items-center justify-center text-[10px]">03</b><div><div class="text-[11px] font-black text-[#151c75]">Sajikan karya</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Isi Hidangan dan Ambalan dengan penawaran serta bukti kerja terbaik.</p></div></div></div>
                <div class="rounded-2xl border border-amber-100 bg-amber-50/80 p-4"><div class="flex gap-3"><b class="w-8 h-8 rounded-xl bg-white text-amber-700 flex items-center justify-center text-[10px]">04</b><div><div class="text-[11px] font-black text-[#151c75]">Siap jadi Koki</div><p class="mt-1 text-[10px] leading-relaxed text-slate-600">Semua pengelolaan berada di <b>/dapur/{username}</b>. Tidak ada hub Creator di root.</p></div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section class="grid md:grid-cols-3 gap-3 mt-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Identitas yang jelas</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Profil Creator tersusun untuk memudahkan orang memahami kamu.</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Penawaran siap jual</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Hidangan untuk layanan, harga, deskripsi, dan estimasi pengerjaan.</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Portofolio yang terlihat</div><p class="mt-1 text-[10px] leading-relaxed text-slate-500">Ambalan untuk menyusun karya dan bukti kerja dalam satu tempat.</p></div>
        </section>
      </div>`;
  }

  function managerHeader(c, data) {
    return `<section class="rounded-[30px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 sm:p-7 shadow-soft"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"><div class="flex items-center gap-4 min-w-0"><div class="w-16 h-16 rounded-3xl overflow-hidden bg-white border border-blue-100 shrink-0">${c.avatar_url ? `<img src="${esc(c.avatar_url)}" class="w-full h-full object-cover" alt="">` : `<div class="w-full h-full flex items-center justify-center text-xl font-black text-[#151c75]">${initials(c.display_name || c.username)}</div>`}</div><div class="min-w-0"><div class="text-[9px] font-black uppercase tracking-[.13em] text-amber-600">${currentIsAdmin ? 'Admin Studihome' : 'Dapurku'}</div><h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75] truncate">${esc(c.display_name || c.username)}</h1><div class="text-[10px] text-slate-500 truncate">@${esc(c.username)} · ${esc(c.review_status || 'DRAFT')}</div><div class="mt-2 flex flex-wrap gap-1.5">${statusChip(c.is_published ? 'Published' : 'Draft', c.is_published)} ${statusChip(c.is_verified ? 'Verified' : 'Belum Verified', c.is_verified)}</div></div></div><div class="flex flex-wrap gap-2"><a href="/${encodeURIComponent(c.username)}" class="focus-ring px-3.5 py-2.5 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Profil Publik</a><a href="/dapur" class="focus-ring px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-extrabold">Program Creator</a></div></div><div class="grid grid-cols-3 gap-2.5 mt-5"><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Menu</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.categories.length}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Hidangan</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.services.length}</div></div><div class="rounded-2xl bg-white border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Ambalan</div><div class="mt-1 text-xl font-black text-[#151c75]">${data.portfolios.length}</div></div></div></section>`;
  }

  function itemList(title, items, icon, emptyText, action) {
    return `<section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between gap-3"><div><div class="text-[9px] font-black uppercase tracking-[.13em] text-amber-600">${title}</div><div class="mt-1 text-sm font-black text-[#151c75]">${title === 'Hidangan' ? 'Penawaran yang bisa kamu sajikan' : 'Karya yang siap ditampilkan'}</div></div><button type="button" data-add="${action}" class="focus-ring btn-brand px-3 py-2 rounded-xl text-[10px] font-extrabold"><i class="fa-solid fa-plus mr-1"></i>Tambah</button></div><div class="mt-4 grid sm:grid-cols-2 gap-2.5">${items.length ? items.map(x => `<div class="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="text-xs font-black text-[#151c75] truncate">${esc(x.title)}</div><div class="mt-1 text-[9px] leading-relaxed text-slate-500 line-clamp-3">${esc(x.description || '')}</div></div><button type="button" data-edit="${action}" data-id="${esc(x.id)}" class="focus-ring w-8 h-8 rounded-xl bg-white border border-blue-100 text-[#151c75] shrink-0"><i class="fa-solid fa-pen text-[9px]"></i></button></div><div class="mt-2 text-[9px] font-bold ${x.is_active ? 'text-emerald-600' : 'text-slate-400'}">${x.is_active ? 'Aktif' : 'Nonaktif'}</div></div>`).join('') : `<div class="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-[10px] text-slate-400">${emptyText}</div>`}</div></section>`;
  }

  async function ensureEditor() {
    if (window.AdminDapurUI) return;
    if (editorPromise) return editorPromise;
    editorPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/admin-dapur-ui.js?v=5';
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Editor Dapur gagal dimuat.'));
      document.head.appendChild(script);
    });
    await editorPromise;
  }

  async function renderRoot() {
    currentCreator = currentUser ? await loadOwnCreator() : null;
    document.title = 'Program Creator — Studihome';
    $('#app').innerHTML = rootHtml();
  }

  async function renderManager() {
    if (!currentUser) {
      $('#app').innerHTML = `<div class="max-w-xl mx-auto px-4 py-14"><div class="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-soft"><div class="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-lock"></i></div><h1 class="mt-4 text-lg font-black text-[#151c75]">Masuk untuk mengelola Dapur</h1><p class="mt-2 text-xs leading-relaxed text-slate-500">Alamat ini khusus untuk pengelolaan Creator. Pemilik Creator dan Admin Studihome memiliki akses sesuai perannya.</p><a href="/kamar" class="focus-ring btn-brand inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Masuk / Daftar</a></div></div>`;
      return;
    }

    const creator = await loadCreatorBySlug(slug());
    const allowed = currentIsAdmin || creator.user_id === currentUser.id;
    if (!allowed) {
      $('#app').innerHTML = `<div class="max-w-xl mx-auto px-4 py-14"><div class="rounded-3xl border border-red-100 bg-white p-7 text-center shadow-soft"><div class="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center"><i class="fa-solid fa-shield-halved"></i></div><h1 class="mt-4 text-lg font-black text-slate-800">Dapur ini bukan milik akunmu</h1><p class="mt-2 text-xs leading-relaxed text-slate-500">Untuk keamanan, hanya pemilik Creator dan Admin Studihome yang dapat mengubah data Dapur.</p><a href="/dapur" class="focus-ring btn-brand inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Kembali ke Program</a></div></div>`;
      return;
    }

    await ensureEditor();
    currentCreator = creator;
    const data = await loadBundle(creator.id);
    document.title = `Dapur @${creator.username} — Studihome`;
    $('#app').innerHTML = `<div class="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-4">${managerHeader(creator, data)}<section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><button type="button" data-section="profile" class="focus-ring text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Foyer</div><div class="mt-1 text-[9px] text-slate-500">Identitas, bio, kontak, publish.</div></button><button type="button" data-section="categories" class="focus-ring text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Menu</div><div class="mt-1 text-[9px] text-slate-500">Kategori dan fokus Creator.</div></button><button type="button" data-section="service" class="focus-ring text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Hidangan</div><div class="mt-1 text-[9px] text-slate-500">Layanan, harga, estimasi.</div></button><button type="button" data-section="portfolio" class="focus-ring text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div class="w-10 h-10 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Ambalan</div><div class="mt-1 text-[9px] text-slate-500">Karya dan bukti kerja.</div></button></section>${itemList('Hidangan', data.services, 'fa-bowl-food', 'Belum ada Hidangan. Tambahkan penawaran pertama.', 'service')}${itemList('Ambalan', data.portfolios, 'fa-images', 'Belum ada Ambalan. Tambahkan karya pertama.', 'portfolio')}<section class="rounded-3xl border border-blue-100 bg-[#151c75] p-5 text-white"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-300">Alamat canonical</div><div class="mt-1 text-sm font-black">/dapur/${esc(creator.username)}</div><p class="mt-1.5 text-[10px] leading-relaxed text-blue-100">Semua pengelolaan Creator berada di sini. Root /dapur hanya untuk Program Creator.</p></section></div>`;

    $$('[data-section]').forEach(button => {
      button.addEventListener('click', async () => {
        try {
          if (button.dataset.section === 'profile') await window.AdminDapurUI.profile(creator.id);
          if (button.dataset.section === 'categories') await window.AdminDapurUI.categories(creator.id);
          if (button.dataset.section === 'service') await window.AdminDapurUI.service(creator.id);
          if (button.dataset.section === 'portfolio') await window.AdminDapurUI.portfolio(creator.id);
        } catch (error) { toast(error.message || 'Editor belum bisa dibuka.', 'error'); }
      });
    });
    $$('[data-add]').forEach(button => button.addEventListener('click', async () => {
      try { if (button.dataset.add === 'service') await window.AdminDapurUI.service(creator.id); else await window.AdminDapurUI.portfolio(creator.id); }
      catch (error) { toast(error.message || 'Editor belum bisa dibuka.', 'error'); }
    }));
    $$('[data-edit]').forEach(button => button.addEventListener('click', async () => {
      try { if (button.dataset.edit === 'service') await window.AdminDapurUI.service(creator.id, button.dataset.id); else await window.AdminDapurUI.portfolio(creator.id, button.dataset.id); }
      catch (error) { toast(error.message || 'Editor belum bisa dibuka.', 'error'); }
    }));
    window.AdminDapur = { render: renderManager };
  }

  async function render() {
    topAction();
    if (isRoot()) return renderRoot();
    if (slug()) return renderManager();
    $('#app').innerHTML = `<div class="max-w-xl mx-auto px-4 py-16 text-center"><div class="rounded-3xl border border-slate-200 bg-white p-7"><h1 class="text-lg font-black text-[#151c75]">Alamat Dapur tidak valid.</h1><a href="/dapur" class="focus-ring btn-brand inline-flex mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Ke Program Creator</a></div></div>`;
  }

  async function boot() {
    try {
      if (!app()) throw new Error('Supabase belum siap.');
      currentUser = await session();
      currentIsAdmin = await isAdmin();
      await render();
    } catch (error) {
      console.error('[Dapur]', error);
      $('#app').innerHTML = `<div class="max-w-xl mx-auto px-4 py-16"><div class="rounded-3xl border border-red-100 bg-white p-7 text-center"><div class="text-3xl text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="mt-3 text-lg font-black text-[#151c75]">Dapur belum dapat dimuat.</h1><p class="mt-2 text-xs leading-relaxed text-slate-500">${esc(error.message || 'Terjadi kendala saat memuat halaman.')}</p><button class="focus-ring btn-brand mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold" onclick="location.reload()">Muat Ulang</button></div></div>`;
    }
  }

  app()?.auth?.onAuthStateChange(() => setTimeout(() => boot(), 50));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
