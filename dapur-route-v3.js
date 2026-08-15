(() => {
  'use strict';
  if (window.StudihomeDapurRouteV3) return;

  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const root = () => path() === '/dapur';
  const userRoute = () => /^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
  const db = () => window.supabaseClient || null;
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function ready(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  function authUser() { const u = window.App?.state?.user; return u && u.id ? u : null; }
  function role() { return String(authUser()?.role || '').toLowerCase(); }

  async function getOwnCreator() {
    const u = authUser(); if (!u) return null;
    const { data, error } = await db().from('creator_profiles')
      .select('id,username,display_name,avatar_url,is_published,is_verified,managed_by_studihome,is_studihome_official')
      .eq('user_id', u.id).maybeSingle();
    if (error) throw error; return data || null;
  }

  function heroFlow() {
    return `
      <div class="mt-5 grid sm:grid-cols-2 gap-2.5">
        <div class="rounded-2xl bg-white/85 border border-blue-100 p-3.5"><div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-blue-50 text-[#151c75] flex items-center justify-center text-[9px] font-black">01</span><div class="text-[10px] font-black text-[#151c75]">Kenali skillmu</div></div><div class="mt-1.5 pl-9 text-[9px] leading-relaxed text-slate-500">Tentukan fokus dan gaya kerja yang ingin kamu bawa.</div></div>
        <div class="rounded-2xl bg-white/85 border border-blue-100 p-3.5"><div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-blue-50 text-[#151c75] flex items-center justify-center text-[9px] font-black">02</span><div class="text-[10px] font-black text-[#151c75]">Masak profilmu</div></div><div class="mt-1.5 pl-9 text-[9px] leading-relaxed text-slate-500">Susun identitas, Menu, dan Hidangan dengan rapi.</div></div>
        <div class="rounded-2xl bg-white/85 border border-blue-100 p-3.5"><div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-blue-50 text-[#151c75] flex items-center justify-center text-[9px] font-black">03</span><div class="text-[10px] font-black text-[#151c75]">Tampilkan karya</div></div><div class="mt-1.5 pl-9 text-[9px] leading-relaxed text-slate-500">Pilih karya terbaik untuk bikin orang cepat percaya.</div></div>
        <div class="rounded-2xl bg-white/85 border border-amber-100 p-3.5"><div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-[9px] font-black">04</span><div class="text-[10px] font-black text-[#151c75]">Siap jadi Koki</div></div><div class="mt-1.5 pl-9 text-[9px] leading-relaxed text-slate-500">Satu alamat publik untuk memperkenalkan karya dan layanan.</div></div>
      </div>`;
  }

  async function renderRoot() {
    const main = document.getElementById('main-content'); if (!main) return;
    const u = authUser();
    const own = u ? await getOwnCreator().catch(() => null) : null;
    const isAdmin = role() === 'admin';

    const context = isAdmin ? `
      <div class="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 flex items-start gap-3"><div class="w-8 h-8 rounded-xl bg-white text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-shield-halved text-[11px]"></i></div><div><div class="text-[10px] font-black text-[#151c75]">Mode Admin</div><div class="mt-0.5 text-[9px] leading-relaxed text-slate-600">Halaman ini tetap menjadi landing program. Pengelolaan Creator dilakukan langsung melalui <b>/dapur/{username}</b> untuk Creator yang dipilih.</div></div></div>` : own ? `
      <div class="mt-5 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 flex items-center gap-3"><div class="w-10 h-10 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 shrink-0">${own.avatar_url ? `<img src="${esc(own.avatar_url)}" alt="${esc(own.display_name || own.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center font-black text-[#151c75]">${esc(String(own.display_name || own.username || 'C').charAt(0).toUpperCase())}</div>`}</div><div class="min-w-0 flex-1"><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Dapurku</div><div class="text-xs font-black text-[#151c75] truncate">${esc(own.display_name || own.username)}</div><div class="text-[9px] text-slate-500 truncate">@${esc(own.username)} · ${own.is_published ? 'Sudah tayang' : 'Masih draft'}${own.is_verified ? ' · Verified' : ''}</div></div><a href="/dapur/${encodeURIComponent(own.username)}" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-extrabold shrink-0">Kelola Dapur</a></div>` : `
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Belum punya Dapur</div><div class="text-xs font-black text-[#151c75]">Skill dulu, tempatnya belakangan. Yuk mulai.</div><div class="mt-0.5 text-[9px] text-slate-500">Gabung Creator untuk punya alamat pengelolaan sendiri.</div></div><a href="/kamar" class="btn-brand-gradient px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold text-center shrink-0">Gabung Jadi Creator</a></div>`;

    main.innerHTML = `
      <div class="max-w-6xl mx-auto py-5 sm:py-8 px-3 sm:px-0">
        <section class="relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#f7f9ff] via-white to-blue-50 p-5 sm:p-8 lg:p-10 shadow-sm">
          <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-200/40 blur-3xl"></div><div class="absolute -left-20 bottom-0 w-52 h-52 rounded-full bg-amber-100/50 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-[1.08fr_.92fr] gap-7 lg:gap-10 items-center">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white border border-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-[#151c75]"><i class="fa-solid fa-kitchen-set text-amber-500"></i> Program Creator Studihome</div>
              <h1 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.04] tracking-tight text-[#151c75]">Belajar jadi <span class="text-[#4a54c7]">Koki Creator.</span></h1>
              <p class="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">Di Studihome, skill kamu adalah bahan utamanya. Kami bantu kamu menata identitas, Menu, Hidangan, dan karya sampai siap dilihat calon klien.</p>
              <div class="mt-5 flex flex-wrap gap-2"><a href="/kamar" class="btn-brand-gradient px-4 py-3 rounded-xl text-[11px] font-extrabold">Mulai Jadi Creator</a><a href="#alur-koki" class="px-4 py-3 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[11px] font-extrabold">Lihat Alurnya</a></div>
              ${context}
            </div>
            <div id="alur-koki" class="rounded-3xl bg-white/90 border border-blue-100 p-5 sm:p-6 shadow-sm">
              <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Resep singkatnya</div>
              <div class="mt-1 text-base font-black text-[#151c75]">Dari skill → jadi Creator yang siap ditemukan.</div>
              ${heroFlow()}
              <div class="mt-4 rounded-2xl bg-[#151c75] px-4 py-3 text-white"><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-300">Catatan koki</div><div class="mt-1 text-[10px] leading-relaxed text-blue-100">Nggak harus langsung sempurna. Rapikan sedikit demi sedikit—yang penting konsisten dan karya nyata ikut bicara.</div></div>
            </div>
          </div>
        </section>
      </div>`;
    window.App?.ui?.renderNavigation?.();
  }

  async function loadUserRoute() {
    const existing = document.querySelector('script[data-studihome-dapur-user-v3]');
    if (existing) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = '/dapur-user-route-v3.js?v=1'; s.defer = true; s.dataset.studihomeDapurUserV3 = '1'; s.onload = resolve; s.onerror = () => reject(new Error('Halaman pengelolaan Creator belum dapat dimuat.')); document.head.appendChild(s);
    });
  }

  async function boot() {
    if (!root() && !userRoute()) return;
    if (!await ready()) return;
    if (userRoute()) return loadUserRoute();
    return renderRoot();
  }

  window.StudihomeDapurRouteV3 = Object.freeze({ boot });
  boot();
})();
