(() => {
  'use strict';
  if (window.StudihomeDapurAdminRouterV2) return;

  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const isDapurRoot = () => path() === '/dapur';
  const isDapurUser = () => /^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
  const db = () => window.supabaseClient || null;
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function waitBoot(timeout = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function loadWizard() {
    if (window.StudihomeDapurAdminWizardV2) return;
    if (document.querySelector('script[data-studihome-admin-dapur-wizard-v2]')) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/dapur-admin-wizard-v2.js?v=1';
      s.defer = true;
      s.dataset.studihomeAdminDapurWizardV2 = '1';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Wizard Creator belum dapat dimuat.'));
      document.head.appendChild(s);
    });
  }

  function role() { return String(window.App?.state?.user?.role || '').toLowerCase(); }
  function isAdmin() { return role() === 'admin'; }

  async function getManagedCreators() {
    const [{ data: rows, error }, { data: likes, error: le }, { data: adjustments, error: ae }] = await Promise.all([
      db().from('creator_profiles').select('id,username,display_name,bio,avatar_url,location,is_published,is_verified,is_studihome_official,updated_at').eq('managed_by_studihome', true).order('display_name', { ascending: true }),
      db().from('creator_likes').select('creator_id'),
      db().from('creator_like_adjustments').select('creator_id,delta_count')
    ]);
    if (error) throw error; if (le) throw le; if (ae) throw ae;
    const likeMap = new Map();
    (likes || []).forEach(r => likeMap.set(r.creator_id, (likeMap.get(r.creator_id) || 0) + 1));
    (adjustments || []).forEach(r => likeMap.set(r.creator_id, Math.max(0, (likeMap.get(r.creator_id) || 0) + Number(r.delta_count || 0))));
    return { rows: rows || [], likeMap };
  }

  function renderHub(rows, likeMap) {
    const main = document.getElementById('main-content');
    if (!main) return;
    const published = rows.filter(r => r.is_published).length;
    const verified = rows.filter(r => r.is_verified).length;
    main.innerHTML = `
      <div class="max-w-6xl mx-auto py-4 sm:py-6 space-y-5">
        <section class="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 sm:p-7 shadow-sm">
          <div class="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div class="max-w-3xl"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">DAPUR STUDIHOME · ADMIN</div><h1 class="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-[#151c75]">Managed Creator</h1><p class="mt-2 text-[11px] sm:text-sm text-slate-600 leading-relaxed">Satu tempat untuk memilih Creator, mengecek kesiapan, lalu masuk ke pengelolaan detailnya. Praktis, rapi, dan nggak bikin muter-muter.</p></div>
            <div class="grid grid-cols-3 gap-2 min-w-[280px]"><div class="rounded-2xl bg-white/90 border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Managed</div><div class="mt-1 text-xl font-black text-[#151c75]">${rows.length}</div></div><div class="rounded-2xl bg-white/90 border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Published</div><div class="mt-1 text-xl font-black text-[#151c75]">${published}</div></div><div class="rounded-2xl bg-white/90 border border-blue-100 p-3"><div class="text-[9px] text-slate-400">Verified</div><div class="mt-1 text-xl font-black text-[#151c75]">${verified}</div></div></div>
          </div>
        </section>
        <section class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"><div><h2 class="text-sm sm:text-base font-black text-[#151c75]">Pilih Creator</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-0.5">Klik nama Creator untuk melihat detail singkat dan masuk ke Dapur Creator.</p></div><label class="relative block sm:w-72"><i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i><input id="dah-search" class="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-300" placeholder="Cari Creator…" autocomplete="off"></label></div><div id="dah-list" class="divide-y divide-slate-100"></div></section>
        <div class="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-[10px] text-slate-500 flex gap-2 items-start"><i class="fa-solid fa-circle-info text-[#151c75] mt-0.5"></i><span>Tips: mulai dari Creator yang statusnya masih Draft/Belum Verified. Dari sini tinggal klik <b>Kelola Dapur</b> dan lanjut step-by-step.</span></div>
      </div>`;
    const list = main.querySelector('#dah-list'); const search = main.querySelector('#dah-search');
    const paint = () => {
      const q = String(search.value || '').trim().toLowerCase();
      const filtered = rows.filter(r => `${r.display_name || ''} ${r.username || ''} ${r.location || ''}`.toLowerCase().includes(q));
      list.innerHTML = filtered.map(r => {
        const likes = likeMap.get(r.id) || 0; const state = r.is_published ? 'Published' : 'Draft'; const verify = r.is_verified ? 'Verified' : 'Belum verified';
        return `<details class="group"><summary class="list-none cursor-pointer px-4 sm:px-5 py-4 flex items-center gap-3 hover:bg-slate-50/80"><div class="w-11 h-11 rounded-2xl overflow-hidden border border-blue-100 bg-blue-50 shrink-0">${r.avatar_url ? `<img src="${esc(r.avatar_url)}" alt="${esc(r.display_name || r.username)}" class="w-full h-full object-cover" loading="lazy">` : `<div class="w-full h-full flex items-center justify-center text-sm font-black text-[#151c75]">${esc(String(r.display_name || r.username || 'C').charAt(0).toUpperCase())}</div>`}</div><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-1.5"><span class="text-xs sm:text-sm font-black text-[#151c75] truncate">${esc(r.display_name || r.username)}</span>${r.is_studihome_official ? '<span class="text-[9px] font-black text-amber-600">✦</span>' : ''}</div><div class="text-[9px] sm:text-[10px] text-slate-500 truncate">@${esc(r.username)} · ${esc(r.location || 'Lokasi belum diisi')}</div></div><div class="hidden sm:flex items-center gap-2 text-[9px] font-bold text-slate-400"><span>${likes} like</span><span>·</span><span>${state}</span></div><i class="fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform group-open:rotate-180"></i></summary><div class="px-4 sm:px-5 pb-4 sm:pb-5 pl-[68px] sm:pl-[76px]"><div class="grid sm:grid-cols-3 gap-2 mb-3"><div class="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><div class="text-[9px] text-slate-400">Status</div><div class="mt-1 text-[10px] font-black text-slate-700">${state}</div></div><div class="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><div class="text-[9px] text-slate-400">Review</div><div class="mt-1 text-[10px] font-black ${r.is_verified ? 'text-emerald-700' : 'text-amber-700'}">${verify}</div></div><div class="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><div class="text-[9px] text-slate-400">Engagement</div><div class="mt-1 text-[10px] font-black text-slate-700">${likes} like</div></div></div><div class="flex flex-wrap gap-2"><a href="/${encodeURIComponent(r.username)}" class="px-3.5 py-2.5 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[10px] font-extrabold">Dapurku · Lihat Profil</a><a href="/dapur/${encodeURIComponent(r.username)}" class="btn-brand-gradient px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold">Kelola Dapur</a></div></div></details>`;
      }).join('') || '<div class="p-8 text-center text-xs text-slate-400">Creator yang dicari belum ditemukan.</div>';
    };
    search.addEventListener('input', paint); paint();
  }

  async function openRootAdmin() {
    const main = document.getElementById('main-content'); if (!main) return;
    if (!await waitBoot()) return;
    if (!window.App?.state?.user || !isAdmin()) { main.innerHTML = '<div class="max-w-xl mx-auto my-10 rounded-3xl bg-white border border-slate-200 p-7 text-center shadow-sm"><div class="text-3xl text-amber-500">✦</div><h1 class="mt-3 text-lg font-black text-slate-800">Dapur Creator</h1><p class="mt-1 text-xs text-slate-500">Halaman ini khusus Admin. Member tetap memakai Dapur pribadi dari Kamar.</p><button class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold" onclick="location.href='/kamar'">Ke Kamar</button></div>'; return; }
    main.innerHTML = '<div class="max-w-6xl mx-auto py-16 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan Managed Creator…</div>';
    try { const { rows, likeMap } = await getManagedCreators(); renderHub(rows, likeMap); } catch (e) { main.innerHTML = `<div class="max-w-xl mx-auto my-10 rounded-3xl bg-white border border-red-100 p-7 text-center shadow-sm"><div class="text-3xl text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="mt-3 text-lg font-black text-slate-800">Managed Creator belum dapat dimuat</h1><p class="mt-1 text-xs text-slate-500 leading-relaxed">${esc(e.message || 'Koneksi data Admin belum siap.')}</p><button class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold" onclick="location.reload()">Muat Ulang</button></div>`; }
  }

  async function boot() {
    if (!isAdmin()) return;
    if (isDapurUser()) { await loadWizard(); window.StudihomeDapurAdminWizardV2?.boot?.(); return; }
    if (isDapurRoot()) return openRootAdmin();
  }

  window.StudihomeDapurAdminRouterV2 = Object.freeze({ boot });
  boot();
})();
