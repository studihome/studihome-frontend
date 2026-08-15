(() => {
  'use strict';
  if (window.StudihomeDapurAdminWizardV2) return;

  const db = () => window.supabaseClient || null;
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const slug = () => (path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i) || [,''])[1].toLowerCase();
  const $ = (s, root = document) => root.querySelector(s);

  let state = { creator: null, services: [], portfolios: [], categories: [], step: 1 };

  async function waitReady(timeout = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function loadCreator() {
    const username = slug();
    if (!username) throw new Error('Username Creator tidak valid.');
    const { data, error } = await db().from('creator_profiles')
      .select('*').eq('username', username).eq('managed_by_studihome', true).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Managed Creator tidak ditemukan.');
    state.creator = data;

    const [services, portfolios, categories] = await Promise.all([
      db().from('creator_services').select('*').eq('creator_id', data.id).order('created_at', { ascending: true }),
      db().from('creator_portfolios').select('*').eq('creator_id', data.id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      db().from('creator_category_members').select('category_id,is_primary').eq('creator_id', data.id)
    ]);
    if (services.error) throw services.error;
    if (portfolios.error) throw portfolios.error;
    if (categories.error) throw categories.error;
    state.services = services.data || [];
    state.portfolios = portfolios.data || [];
    state.categories = categories.data || [];
  }

  async function saveProfile(form) {
    const patch = {
      display_name: String(form.get('display_name') || '').trim(),
      bio: String(form.get('bio') || '').trim(),
      whatsapp: String(form.get('whatsapp') || '').trim(),
      location: String(form.get('location') || '').trim(),
      contact_email: String(form.get('contact_email') || '').trim(),
      is_published: form.get('is_published') === 'on'
    };
    if (!patch.display_name) throw new Error('Nama tampilan wajib diisi.');
    const { error } = await db().from('creator_profiles').update(patch).eq('id', state.creator.id).eq('managed_by_studihome', true);
    if (error) throw error;
    state.creator = { ...state.creator, ...patch };
  }

  async function saveCategories(form) {
    const ids = form.getAll('cat').map(String);
    if (!ids.length) throw new Error('Pilih minimal satu kategori.');
    let { error } = await db().from('creator_category_members').delete().eq('creator_id', state.creator.id);
    if (error) throw error;
    const rows = ids.map((id, i) => ({ creator_id: state.creator.id, category_id: id, is_primary: i === 0 }));
    ({ error } = await db().from('creator_category_members').insert(rows));
    if (error) throw error;
    state.categories = rows;
  }

  async function categoriesList() {
    const { data, error } = await db().from('ai_categories').select('id,name,slug,icon').eq('is_active', true).order('name');
    if (error) throw error;
    return data || [];
  }

  function stepMeta(step) {
    return [
      ['Foyer', 'Bikin identitas Creator terasa jelas dan meyakinkan.', 'Santai, isi yang paling penting dulu. Nanti sisanya bisa disempurnakan.'],
      ['Menu', 'Tentukan fokus dan kategori utama Creator.', 'Pilih yang paling relevan. Jangan kebanyakan—biar profilnya tajam.'],
      ['Hidangan', 'Tampilkan jasa yang benar-benar bisa dibeli/dipesan.', 'Mulai dari layanan unggulan. Sedikit tapi kuat lebih enak dilihat.'],
      ['Ambalan', 'Pamerkan karya terbaik dengan tautan yang bisa dibuka.', 'Tunjukkan proof. Ini bagian yang bikin orang makin percaya.']
    ][step - 1];
  }

  function progress() {
    const parts = [1,2,3,4].map(i => {
      const active = state.step === i;
      const done = state.step > i;
      return `<button type="button" data-step="${i}" class="flex items-center gap-2 group ${active ? 'text-[#151c75]' : 'text-slate-400'}"><span class="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : active ? 'bg-blue-50 border-blue-200 text-[#151c75]' : 'bg-white border-slate-200'}">${done ? '✓' : i}</span><span class="hidden sm:block text-[10px] font-extrabold">${stepMeta(i)[0]}</span></button>`;
    }).join('<div class="hidden sm:block flex-1 h-px bg-slate-200"></div>');
    return `<div class="flex items-center gap-2">${parts}</div>`;
  }

  async function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const [title, subtitle, tip] = stepMeta(state.step);
    const percent = Math.round(((state.step - 1) / 3) * 100);
    main.innerHTML = `
      <div class="max-w-5xl mx-auto py-4 sm:py-6 space-y-4">
        <section class="rounded-[28px] border border-blue-100 bg-white shadow-sm overflow-hidden">
          <div class="p-5 sm:p-7 bg-gradient-to-br from-white to-blue-50/60">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div class="min-w-0"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">MANAGED CREATOR OPERATIONS</div><h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75] truncate">${esc(state.creator.display_name || state.creator.username)}</h1><p class="mt-1 text-[10px] sm:text-xs text-slate-500">@${esc(state.creator.username)} · kelola satu Creator sampai siap tayang.</p></div>
              <a href="/${encodeURIComponent(state.creator.username)}" class="px-3.5 py-2.5 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Lihat Profil</a>
            </div>
            <div class="mt-5">${progress()}</div>
            <div class="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300" style="width:${Math.max(8,percent)}%"></div></div>
            <div class="mt-2 flex items-center justify-between text-[9px] font-bold"><span class="text-slate-400">Langkah ${state.step} dari 4</span><span class="text-[#151c75]">${percent}% selesai</span></div>
          </div>
          <div class="px-5 sm:px-7 py-4 border-t border-slate-100 bg-white"><div class="text-sm font-black text-[#151c75]">${title}</div><div class="text-[10px] text-slate-500 mt-1">${subtitle}</div><div class="mt-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">💡 ${tip}</div></div>
        </section>

        <section id="wizard-step" class="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 sm:p-7"></section>
        <div class="flex flex-col sm:flex-row gap-2 sm:justify-between"><button type="button" id="wiz-back" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold ${state.step === 1 ? 'invisible' : ''}">← Kembali</button><div class="flex gap-2"><button type="button" id="wiz-save-next" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold">${state.step === 4 ? 'Selesai & Kembali' : 'Simpan & Lanjut →'}</button></div></div>
      </div>`;
    renderStepContent();

    main.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', async () => {
      const next = Number(btn.dataset.step); if (!Number.isFinite(next)) return; state.step = next; await render();
    }));
    $('#wiz-back').onclick = async () => { if (state.step > 1) { state.step--; await render(); } };
    $('#wiz-save-next').onclick = async () => {
      const form = document.getElementById('wizard-form');
      try {
        const btn = $('#wiz-save-next'); btn.disabled = true; btn.textContent = 'Menyimpan…';
        if (state.step === 1) await saveProfile(new FormData(form));
        if (state.step === 2) await saveCategories(new FormData(form));
        if (state.step === 3 || state.step === 4) await loadCreator();
        if (state.step === 4) { window.location.href = '/admin'; return; }
        state.step++; await render();
      } catch (e) { window.App?.ui?.toast?.(e.message || 'Belum bisa disimpan.', 'error'); btn.disabled = false; btn.textContent = state.step === 4 ? 'Selesai & Kembali' : 'Simpan & Lanjut →'; }
    };
  }

  async function renderStepContent() {
    const host = document.getElementById('wizard-step'); if (!host) return;
    if (state.step === 1) {
      host.innerHTML = `<form id="wizard-form" class="space-y-4"><div class="grid sm:grid-cols-2 gap-4"><label class="block"><span class="text-[10px] font-bold text-slate-700">Nama tampilan</span><input name="display_name" required value="${esc(state.creator.display_name || '')}" class="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"></label><label class="block"><span class="text-[10px] font-bold text-slate-700">WhatsApp</span><input name="whatsapp" value="${esc(state.creator.whatsapp || '')}" class="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"></label></div><label class="block"><span class="text-[10px] font-bold text-slate-700">Bio singkat</span><textarea name="bio" rows="5" class="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 resize-y">${esc(state.creator.bio || '')}</textarea><span class="text-[9px] text-slate-400">Tip: jelaskan siapa Creator ini, keahliannya, dan nilai yang ditawarkan.</span></label><div class="grid sm:grid-cols-2 gap-4"><label class="block"><span class="text-[10px] font-bold text-slate-700">Lokasi</span><input name="location" value="${esc(state.creator.location || '')}" class="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"></label><label class="block"><span class="text-[10px] font-bold text-slate-700">Email kontak</span><input name="contact_email" type="email" value="${esc(state.creator.contact_email || '')}" class="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"></label></div><label class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3"><span><span class="block text-xs font-bold text-slate-700">Tampilkan ke publik</span><span class="block text-[9px] text-slate-400 mt-0.5">Publikasikan saat profil sudah siap.</span></span><input name="is_published" type="checkbox" ${state.creator.is_published ? 'checked' : ''} class="w-4 h-4"></label></form>`;
    } else if (state.step === 2) {
      const cats = await categoriesList(); const selected = new Set(state.categories.map(x => x.category_id));
      host.innerHTML = `<form id="wizard-form" class="space-y-4"><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">${cats.map(c => `<label class="flex items-center gap-2 rounded-xl border ${selected.has(c.id) ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-slate-50'} p-3 cursor-pointer"><input type="checkbox" name="cat" value="${c.id}" ${selected.has(c.id) ? 'checked' : ''} class="w-4 h-4"><span class="text-xs font-bold text-slate-700">${esc(c.name)}</span></label>`).join('')}</div><p class="text-[9px] text-slate-400">Kategori pertama yang dipilih menjadi kategori utama. Pilih yang benar-benar mewakili Creator.</p></form>`;
    } else if (state.step === 3) {
      host.innerHTML = `<div class="space-y-3"><div class="flex items-center justify-between gap-3"><div><h3 class="text-sm font-black text-[#151c75]">Hidangan Creator</h3><p class="text-[10px] text-slate-500 mt-0.5">${state.services.length} layanan saat ini.</p></div><button type="button" id="wiz-add-service" class="btn-brand-gradient px-3 py-2.5 rounded-xl text-[10px] font-extrabold">+ Tambah Hidangan</button></div><div class="space-y-2">${state.services.map(s => `<div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between gap-3"><div class="min-w-0"><div class="text-xs font-extrabold text-slate-700 truncate">${esc(s.title)}</div><div class="text-[9px] text-slate-400 mt-0.5">Rp ${Number(s.price_from || 0).toLocaleString('id-ID')} · ${Number(s.delivery_days || 1)} hari</div></div><button type="button" data-edit-service="${s.id}" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-extrabold text-[#151c75]">Edit</button></div>`).join('') || '<div class="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-[10px] text-slate-400">Belum ada Hidangan. Gas satu layanan unggulan dulu ✨</div>'}</div></div>`;
      $('#wiz-add-service').onclick = () => window.AdminDapurUI?.service(state.creator.id);
      host.querySelectorAll('[data-edit-service]').forEach(b => b.onclick = () => window.AdminDapurUI?.service(state.creator.id, b.dataset.editService));
    } else {
      host.innerHTML = `<div class="space-y-3"><div class="flex items-center justify-between gap-3"><div><h3 class="text-sm font-black text-[#151c75]">Ambalan Creator</h3><p class="text-[10px] text-slate-500 mt-0.5">${state.portfolios.length} karya saat ini.</p></div><button type="button" id="wiz-add-portfolio" class="btn-brand-gradient px-3 py-2.5 rounded-xl text-[10px] font-extrabold">+ Tambah Karya</button></div><div class="space-y-2">${state.portfolios.map(p => `<div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between gap-3"><div class="min-w-0"><div class="text-xs font-extrabold text-slate-700 truncate">${esc(p.title)}</div><div class="text-[9px] text-slate-400 mt-0.5">${esc(p.media_type)} · ${p.is_active ? 'Aktif' : 'Nonaktif'}</div></div><button type="button" data-edit-portfolio="${p.id}" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-extrabold text-[#151c75]">Edit</button></div>`).join('') || '<div class="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-[10px] text-slate-400">Belum ada Ambalan. Tunjukkan karya terbaikmu ✨</div>'}</div></div>`;
      $('#wiz-add-portfolio').onclick = () => window.AdminDapurUI?.portfolio(state.creator.id);
      host.querySelectorAll('[data-edit-portfolio]').forEach(b => b.onclick = () => window.AdminDapurUI?.portfolio(state.creator.id, b.dataset.editPortfolio));
    }
  }

  async function boot() {
    if (!isAdminPath()) return;
    const main = document.getElementById('main-content'); if (!main) return;
    if (!await waitReady()) return;
    if (String(window.App?.state?.user?.role || '').toLowerCase() !== 'admin') {
      main.innerHTML = '<div class="max-w-xl mx-auto my-10 rounded-3xl bg-white border border-slate-200 p-7 text-center"><div class="text-3xl text-amber-500">✦</div><h1 class="mt-3 text-lg font-black text-slate-800">Akses Admin Diperlukan</h1><p class="mt-1 text-xs text-slate-500">Workspace per-Creator hanya dapat dikelola oleh Admin.</p></div>';
      return;
    }
    if (!db()) throw new Error('Koneksi Admin belum siap.');
    try {
      const mainEl = document.getElementById('main-content');
      mainEl.innerHTML = '<div class="max-w-5xl mx-auto py-16 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan workspace…</div>';
      if (!window.AdminDapurUI) {
        await new Promise((resolve, reject) => { const s=document.createElement('script'); s.src='/admin-dapur-ui.js?v=3'; s.defer=true; s.onload=resolve; s.onerror=()=>reject(new Error('Editor Dapur belum tersedia.')); document.head.appendChild(s); });
      }
      await loadCreator();
      window.AdminDapur = window.AdminDapur || {};
      window.AdminDapur.render = async () => { await loadCreator(); await render(); };
      await render();
    } catch (e) {
      mainEl.innerHTML = `<div class="max-w-xl mx-auto my-10 rounded-3xl bg-white border border-red-100 p-7 text-center"><div class="text-3xl text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="mt-3 text-lg font-black text-slate-800">Dapur Creator belum dapat dimuat</h1><p class="mt-1 text-xs text-slate-500">${esc(e.message || 'Data Creator belum siap.')}</p><button onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div>`;
    }
  }

  function isAdminPath() { return /^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path()); }
  window.StudihomeDapurAdminWizardV2 = Object.freeze({ boot });
  boot();
})();
