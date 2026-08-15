(() => {
  'use strict';
  if (window.StudihomeAdminDapurUserRoute) return;

  const RESERVED = new Set(['foyer', 'menu', 'hidangan', 'ambalan']);
  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const isRoot = () => path() === '/dapur';
  const targetSlug = () => {
    const m = path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);
    if (!m) return '';
    const slug = m[1].toLowerCase();
    return RESERVED.has(slug) ? '' : slug;
  };
  const esc = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);
  const db = () => window.supabaseClient;

  async function waitReady(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && window.supabaseClient) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function ensureAdmin() {
    const ready = await waitReady();
    if (!ready) throw new Error('Koneksi Admin belum siap. Muat ulang halaman sekali lagi.');
    const user = window.App?.state?.user;
    if (!user || String(user.role || '').toLowerCase() !== 'admin') return false;
    return true;
  }

  async function loadScript(src, marker) {
    if (window.AdminDapurUI) return;
    const existing = document.querySelector(`script[data-${marker}]`);
    if (existing) {
      await new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
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

  async function getCreator(slug) {
    const { data, error } = await db().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,contact_email,is_published,is_verified,review_status,review_note,managed_by_studihome,is_studihome_official')
      .eq('username', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Creator dengan username tersebut tidak ditemukan.');
    if (!data.managed_by_studihome) throw new Error('Creator ini bukan Managed Creator Studihome.');
    return data;
  }

  async function getBundle(id) {
    const [s, c, p] = await Promise.all([
      db().from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      db().from('creator_category_members').select('category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id),
      db().from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    ]);
    if (s.error) throw s.error;
    if (c.error) throw c.error;
    if (p.error) throw p.error;
    return { services: s.data || [], categories: c.data || [], portfolios: p.data || [] };
  }

  async function loadManagedCreators() {
    const { data, error } = await db().from('creator_profiles')
      .select('id,username,display_name,bio,avatar_url,is_published,is_verified,is_studihome_official,review_status,updated_at')
      .eq('managed_by_studihome', true)
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function avatar(c) {
    return c.avatar_url
      ? `<img src="${esc(c.avatar_url)}" alt="${esc(c.display_name || c.username)}" class="w-12 h-12 rounded-2xl object-cover border border-blue-100 bg-white" loading="lazy">`
      : `<div class="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-base font-black text-[#151c75]">${esc(String(c.display_name || c.username || 'C').charAt(0).toUpperCase())}</div>`;
  }

  async function renderAdminHub(main) {
    if (!(await ensureAdmin())) return false;
    const creators = await loadManagedCreators();
    main.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        <section class="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 sm:p-7 shadow-sm">
          <div class="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">DAPUR STUDIHOME · ADMIN</div>
              <h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75]">Managed Creator Operations</h1>
              <p class="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">Pilih Creator yang dikelola Studihome. Setelah dipilih, Anda langsung masuk ke ruang operasional Creator tersebut.</p>
            </div>
            <div class="grid grid-cols-3 gap-2 min-w-[260px]">
              <div class="rounded-2xl bg-white border border-blue-100 px-3 py-3"><div class="text-[9px] text-slate-500">Managed</div><div class="text-xl font-black text-[#151c75]">${creators.length}</div></div>
              <div class="rounded-2xl bg-white border border-blue-100 px-3 py-3"><div class="text-[9px] text-slate-500">Live</div><div class="text-xl font-black text-emerald-700">${creators.filter(c=>c.is_published).length}</div></div>
              <div class="rounded-2xl bg-white border border-blue-100 px-3 py-3"><div class="text-[9px] text-slate-500">Verified</div><div class="text-xl font-black text-[#151c75]">${creators.filter(c=>c.is_verified).length}</div></div>
            </div>
          </div>
        </section>
        <section class="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div><h2 class="text-sm font-black text-[#151c75]">Managed Creator</h2><p class="text-[10px] text-slate-500 mt-0.5">Klik nama untuk membuka detail dan operasi.</p></div>
            <label class="relative block sm:w-72"><i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i><input id="managed-search" type="search" placeholder="Cari Creator…" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-blue-100 bg-white text-xs outline-none focus:ring-2 focus:ring-blue-100"></label>
          </div>
          <div id="managed-list" class="mt-4 space-y-2">
            ${creators.map(c => `
              <article class="managed-card rounded-2xl border border-slate-200 bg-white overflow-hidden" data-search="${esc(`${c.display_name || ''} ${c.username || ''}`)}">
                <button type="button" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50/50 transition" data-toggle="${esc(c.id)}" aria-expanded="false">
                  ${avatar(c)}
                  <span class="min-w-0 flex-1"><span class="flex items-center gap-1.5"><strong class="text-sm font-black text-[#151c75] truncate">${esc(c.display_name || c.username)}</strong>${c.is_studihome_official ? '<span class="text-amber-600 text-[9px]">✦</span>' : ''}</span><span class="block text-[10px] text-slate-500 mt-0.5">@${esc(c.username || '-')} · ${c.is_verified ? 'Verified' : 'Belum verified'} · ${c.is_published ? 'Published' : 'Draft'}</span></span>
                  <i class="fa-solid fa-chevron-down text-slate-400 text-xs" data-chevron="${esc(c.id)}"></i>
                </button>
                <div class="hidden border-t border-slate-100 bg-slate-50/60 px-4 py-4" data-panel="${esc(c.id)}">
                  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">MANAGED CREATOR</div><div class="mt-1 text-xs font-extrabold text-[#151c75]">${esc(c.display_name || c.username)}</div><p class="text-[10px] text-slate-500 mt-1">Profil publik: /${esc(c.username || '')} · Operations: /dapur/${esc(c.username || '')}</p></div><div class="flex flex-wrap gap-2"><a href="/${encodeURIComponent(c.username || '')}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-extrabold text-[#151c75]">Lihat Profil</a><a href="/dapur/${encodeURIComponent(c.username || '')}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[10px] font-extrabold">Kelola Dapur</a></div></div>
                </div>
              </article>`).join('') || '<div class="py-12 text-center text-xs text-slate-400">Belum ada Managed Creator.</div>'}
          </div>
          <div id="managed-empty" class="hidden py-10 text-center text-xs text-slate-400">Creator yang dicari belum ditemukan.</div>
        </section>
      </div>`;

    main.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.toggle;
      const panel = main.querySelector(`[data-panel="${id}"]`);
      const icon = main.querySelector(`[data-chevron="${id}"]`);
      const isOpen = !panel.classList.contains('hidden');
      panel.classList.toggle('hidden', isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      icon.style.transform = isOpen ? '' : 'rotate(180deg)';
    }));

    main.querySelector('#managed-search')?.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      let count = 0;
      main.querySelectorAll('.managed-card').forEach(card => { const ok = !q || card.dataset.search.toLowerCase().includes(q); card.classList.toggle('hidden', !ok); if (ok) count++; });
      main.querySelector('#managed-empty').classList.toggle('hidden', count !== 0);
    });
    return true;
  }

  function progress(steps, current) {
    return `<div class="flex items-center gap-1.5 sm:gap-2">${steps.map((s,i)=>`<div class="flex-1"><div class="h-1.5 rounded-full ${i <= current ? 'bg-[#3f48bf]' : 'bg-slate-200'}"></div><div class="mt-1 text-[8px] sm:text-[9px] font-bold ${i===current ? 'text-[#151c75]' : 'text-slate-400'}">${i+1}. ${s}</div></div>`).join('')}</div>`;
  }

  async function renderWizard(main, creator) {
    await loadScript('/admin-dapur-ui.js?v=3', 'studihomeAdminDapurUI');
    let bundle = await getBundle(creator.id);
    const steps = ['Foyer', 'Menu', 'Hidangan', 'Ambalan'];
    let current = 0;

    const saveProfile = async (form) => {
      const patch = {
        display_name: String(form.get('display_name') || '').trim(),
        bio: String(form.get('bio') || '').trim(),
        whatsapp: String(form.get('whatsapp') || '').trim(),
        location: String(form.get('location') || '').trim(),
        contact_email: String(form.get('contact_email') || '').trim(),
        is_published: form.get('is_published') === 'on'
      };
      if (!patch.display_name) throw new Error('Nama tampilan wajib diisi.');
      const { error } = await db().from('creator_profiles').update(patch).eq('id', creator.id);
      if (error) throw error;
      Object.assign(creator, patch);
    };

    const saveMenu = async (form) => {
      const ids = [...form.querySelectorAll('input[name="category"]:checked')].map(x => x.value);
      if (!ids.length) throw new Error('Pilih minimal satu kategori agar Creator mudah ditemukan.');
      let r = await db().from('creator_category_members').delete().eq('creator_id', creator.id);
      if (r.error) throw r.error;
      r = await db().from('creator_category_members').insert(ids.map((id,i)=>({creator_id:creator.id, category_id:id, is_primary:i===0})));
      if (r.error) throw r.error;
    };

    async function renderStep() {
      bundle = await getBundle(creator.id);
      const categories = await db().from('ai_categories').select('id,name,slug,icon').eq('is_active', true).order('name');
      if (categories.error) throw categories.error;
      const selected = new Set(bundle.categories.map(x => x.category_id));
      const root = document.createElement('div');
      root.className = 'max-w-6xl mx-auto space-y-5 sm:space-y-6';
      root.innerHTML = `
        <section class="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 sm:p-7 shadow-sm">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">MANAGED CREATOR OPERATIONS</div><h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75]">${esc(creator.display_name || creator.username)}</h1><p class="mt-1 text-xs text-slate-500">/dapur/${esc(creator.username)} · ruang kerja pengelolaan Admin.</p></div><div class="rounded-2xl bg-white border border-blue-100 px-4 py-3 text-right"><div class="text-[9px] text-slate-400">Progress</div><div class="text-base font-black text-[#151c75]">${Math.round(((current+1)/steps.length)*100)}%</div></div></div>
          <div class="mt-5">${progress(steps, current)}</div>
        </section>
        <section class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="p-5 sm:p-7">
            ${current === 0 ? `
              <div class="flex items-start gap-3 mb-5"><div class="w-11 h-11 rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-id-card"></i></div><div><h2 class="text-base font-black text-[#151c75]">Foyer · rapikan identitas</h2><p class="text-[10px] text-slate-500 mt-1">Isi yang penting dulu. Nanti tampilannya jauh lebih meyakinkan.</p></div></div>
              <form id="wizard-form" class="grid sm:grid-cols-2 gap-4">
                <label class="sm:col-span-2"><span class="field-label">Nama tampilan</span><input name="display_name" value="${esc(creator.display_name)}" required class="field-input"><span class="field-hint">Nama yang paling mudah dikenali pelanggan.</span></label>
                <label class="sm:col-span-2"><span class="field-label">Bio singkat</span><textarea name="bio" rows="4" class="field-input resize-y">${esc(creator.bio)}</textarea><span class="field-hint">1–3 kalimat. Fokus pada manfaat dan keahlian utama.</span></label>
                <label><span class="field-label">WhatsApp</span><input name="whatsapp" value="${esc(creator.whatsapp)}" class="field-input"><span class="field-hint">Nomor yang dipakai untuk handoff pelanggan.</span></label>
                <label><span class="field-label">Lokasi</span><input name="location" value="${esc(creator.location)}" class="field-input"><span class="field-hint">Kota/area layanan agar lebih relevan.</span></label>
                <label><span class="field-label">Email kontak</span><input type="email" name="contact_email" value="${esc(creator.contact_email)}" class="field-input"><span class="field-hint">Gunakan email operasional Creator yang sudah terdaftar.</span></label>
                <label class="sm:col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4"><span><b class="block text-xs text-[#151c75]">Tampilkan ke publik</b><small class="text-[9px] text-slate-500">Aktifkan setelah isi profil siap.</small></span><input type="checkbox" name="is_published" ${creator.is_published ? 'checked' : ''} class="w-5 h-5"></label>
              </form>` : current === 1 ? `
              <div class="flex items-start gap-3 mb-5"><div class="w-11 h-11 rounded-2xl bg-indigo-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div><h2 class="text-base font-black text-[#151c75]">Menu · biar gampang ditemukan</h2><p class="text-[10px] text-slate-500 mt-1">Pilih kategori yang paling nyambung. Kategori pertama jadi utama.</p></div></div>
              <form id="wizard-form"><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">${(categories.data || []).map(c=>`<label class="flex items-center gap-3 rounded-2xl border ${selected.has(c.id)?'border-blue-200 bg-blue-50/60':'border-slate-100 bg-slate-50'} p-3 cursor-pointer hover:border-blue-200"><input type="checkbox" name="category" value="${c.id}" ${selected.has(c.id)?'checked':''} class="w-4 h-4"><span class="text-[10px] font-bold text-slate-700">${esc(c.name)}</span></label>`).join('')}</div></form>` : current === 2 ? `
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><div class="flex items-start gap-3"><div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-bowl-food"></i></div><div><h2 class="text-base font-black text-[#151c75]">Hidangan · bikin penawaran makin jelas</h2><p class="text-[10px] text-slate-500 mt-1">Tambah jasa yang benar-benar siap ditawarkan. Sedikit tapi tajam lebih mantap.</p></div></div><button type="button" id="wizard-add-service" class="btn-brand-gradient px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold">+ Tambah Hidangan</button></div>
              <div class="space-y-2">${bundle.services.map(s=>`<div class="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between gap-3"><div class="min-w-0"><div class="text-[10px] font-extrabold text-[#151c75] truncate">${esc(s.title)}</div><div class="text-[9px] text-slate-500 mt-0.5">Rp ${Number(s.price_from||0).toLocaleString('id-ID')} · ${s.delivery_days||1} hari · ${s.is_active?'Aktif':'Nonaktif'}</div></div><button type="button" class="text-[9px] font-extrabold text-[#151c75]" data-edit-service="${s.id}">Edit</button></div>`).join('') || '<div class="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-[10px] text-slate-400">Belum ada Hidangan. Santai, mulai dari satu jasa yang paling siap dijual.</div>'}</div>` : `
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><div class="flex items-start gap-3"><div class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center"><i class="fa-solid fa-images"></i></div><div><h2 class="text-base font-black text-[#151c75]">Ambalan · tunjukkan karya</h2><p class="text-[10px] text-slate-500 mt-1">Tempel tautan karya. Tidak perlu ribet upload file besar.</p></div></div><button type="button" id="wizard-add-portfolio" class="btn-brand-gradient px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold">+ Tambah Ambalan</button></div>
              <div class="grid sm:grid-cols-2 gap-2">${bundle.portfolios.map(p=>`<div class="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between gap-3"><div class="min-w-0"><div class="text-[10px] font-extrabold text-[#151c75] truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-500 mt-0.5 truncate">${esc(p.media_type)} · ${esc(p.media_url)}</div></div><button type="button" class="text-[9px] font-extrabold text-[#151c75]" data-edit-portfolio="${p.id}">Edit</button></div>`).join('') || '<div class="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-[10px] text-slate-400">Belum ada Ambalan. Tambahkan 1–3 karya terbaik dulu, gas pelan-pelan.</div>'}</div>`}
          </div>
          <div class="border-t border-slate-100 px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div class="text-[10px] text-slate-500"><b class="text-[#151c75]">${current < 3 ? ['Mantap, fondasinya dulu.','Nice, sekarang bikin makin gampang ditemukan.','Oke, tinggal tunjukkan karya terbaik.'][current] : 'Nice, tinggal final check dan Creator siap tampil.'}</b><span class="block mt-0.5">Langkah ${current+1} dari ${steps.length}. Santai, progresnya aman.</span></div>
            <div class="flex gap-2"><button type="button" id="wizard-back" class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-extrabold ${current===0?'invisible':''}">Kembali</button><button type="button" id="wizard-next" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-[10px] font-extrabold">${current===steps.length-1?'Selesai':'Simpan & Lanjut'}</button></div>
          </div>
        </section>
      `;

      root.querySelectorAll('.field-label').forEach(x=>x.className='block text-[10px] font-extrabold text-[#151c75] mb-1');
      root.querySelectorAll('.field-input').forEach(x=>x.className='w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100');
      root.querySelectorAll('.field-hint').forEach(x=>x.className='block mt-1 text-[9px] text-slate-400');
      root.querySelector('#wizard-back').onclick = () => { if(current>0){current--;renderStep();} };
      root.querySelector('#wizard-next').onclick = async () => {
        const button = root.querySelector('#wizard-next');
        button.disabled = true; button.textContent = current===3 ? 'Menyimpan…' : 'Menyimpan…';
        try {
          const form = root.querySelector('#wizard-form');
          if (current === 0) await saveProfile(new FormData(form));
          if (current === 1) await saveMenu(form);
          if (current < 3) { current++; await renderStep(); }
          else { toast('Managed Creator selesai diperiksa. Mantap, sudah siap dikelola.', 'success'); window.location.href = `/admin`; }
        } catch (e) { toast(e.message || 'Data belum dapat disimpan.', 'error'); button.disabled = false; button.textContent = current===3 ? 'Selesai' : 'Simpan & Lanjut'; }
      };
      root.querySelector('#wizard-add-service')?.addEventListener('click', () => window.AdminDapurUI?.service(creator.id));
      root.querySelector('#wizard-add-portfolio')?.addEventListener('click', () => window.AdminDapurUI?.portfolio(creator.id));
      root.querySelectorAll('[data-edit-service]').forEach(btn=>btn.onclick=()=>window.AdminDapurUI?.service(creator.id,btn.dataset.editService));
      root.querySelectorAll('[data-edit-portfolio]').forEach(btn=>btn.onclick=()=>window.AdminDapurUI?.portfolio(creator.id,btn.dataset.editPortfolio));
    }

    const shell = document.createElement('div');
    shell.id = 'admin-dapur-wizard-root';
    main.innerHTML = '';
    main.appendChild(shell);
    await renderStep();
  }

  async function boot() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const isAdmin = await ensureAdmin();
    if (!isAdmin) return;
    try {
      if (isRoot()) {
        await renderAdminHub(main);
        return;
      }
      const slug = targetSlug();
      if (!slug) return;
      const creator = await getCreator(slug);
      await renderWizard(main, creator);
    } catch (e) {
      main.innerHTML = `<div class="card-3d p-7 rounded-3xl bg-white max-w-xl mx-auto my-10 text-center"><div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="text-lg font-black text-[#151c75]">Dapur Creator belum dapat dimuat</h1><p class="text-xs text-slate-500 mt-1 leading-relaxed">${esc(e.message || 'Koneksi atau data Creator belum siap.')}</p><div class="mt-4 flex justify-center gap-2"><button onclick="history.back()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Kembali</button><button onclick="location.reload()" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div></div>`;
    }
  }

  window.StudihomeAdminDapurUserRoute = Object.freeze({ boot, targetSlug });
  boot();
})();
