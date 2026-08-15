(() => {
  'use strict';
  if (window.StudihomeAdminDapurManagedHub) return;

  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const isDapurRoot = () => path() === '/dapur';
  const esc = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  async function waitReady(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state?.user && window.supabaseClient) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function loadCreators() {
    const db = window.supabaseClient;
    const { data, error } = await db.from('creator_profiles')
      .select('id,username,display_name,bio,avatar_url,is_published,is_verified,is_studihome_official,managed_by_studihome,review_status,updated_at')
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

  function row(c) {
    const verified = !!c.is_verified;
    const published = !!c.is_published;
    return `
      <article class="managed-creator-row rounded-2xl border border-slate-200 bg-white overflow-hidden" data-name="${esc((c.display_name || '') + ' ' + (c.username || ''))}">
        <button type="button" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50/50 transition" data-toggle="${esc(c.id)}" aria-expanded="false">
          ${avatar(c)}
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-1.5">
              <strong class="text-sm font-black text-[#151c75] truncate">${esc(c.display_name || c.username)}</strong>
              ${c.is_studihome_official ? '<span class="text-[9px] font-black text-amber-600">✦</span>' : ''}
            </span>
            <span class="block text-[10px] text-slate-500 truncate mt-0.5">@${esc(c.username || '-')} · ${verified ? 'Verified' : 'Belum verified'} · ${published ? 'Published' : 'Draft'}</span>
          </span>
          <i class="fa-solid fa-chevron-down text-slate-400 text-xs transition-transform" data-chevron="${esc(c.id)}"></i>
        </button>
        <div class="hidden border-t border-slate-100 bg-slate-50/60 px-4 py-4" data-panel="${esc(c.id)}">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">MANAGED CREATOR</div>
              <div class="mt-1 text-xs font-extrabold text-[#151c75]">Kelola ${esc(c.display_name || c.username)} dari satu ruang.</div>
              <p class="text-[10px] text-slate-500 mt-1">Buka profil publik atau lanjutkan ke Managed Creator Operations.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="/${encodeURIComponent(c.username || '')}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-extrabold text-[#151c75]">Lihat Profil</a>
              <a href="/dapur/${encodeURIComponent(c.username || '')}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[10px] font-extrabold">Kelola Dapur</a>
            </div>
          </div>
        </div>
      </article>`;
  }

  async function open() {
    if (!isDapurRoot()) return false;
    const user = window.App?.state?.user;
    if (!user || String(user.role || '').toLowerCase() !== 'admin') return false;
    const main = document.getElementById('main-content');
    if (!main) return false;
    const ready = await waitReady();
    if (!ready) {
      main.innerHTML = '<div class="max-w-xl mx-auto my-10 rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm"><div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="text-lg font-black text-[#151c75]">Dapur Studihome belum siap</h1><p class="text-xs text-slate-500 mt-1">Koneksi Admin belum siap. Coba muat ulang halaman.</p><button onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div>';
      return true;
    }
    try {
      const creators = await loadCreators();
      main.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          <section class="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 sm:p-7 shadow-sm overflow-hidden relative">
            <div class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-blue-200/40 blur-3xl"></div>
            <div class="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">DAPUR STUDIHOME · ADMIN</div>
                <h1 class="mt-1 text-xl sm:text-2xl font-black text-[#151c75]">Managed Creator Operations</h1>
                <p class="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">Pilih Creator yang dikelola Studihome, lalu lanjutkan ke ruang operasional per Creator.</p>
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
              <div><h2 class="text-sm font-black text-[#151c75]">Managed Creator</h2><p class="text-[10px] text-slate-500 mt-0.5">Klik nama untuk membuka aksi cepat.</p></div>
              <label class="relative block sm:w-72"><i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i><input id="managed-creator-search" type="search" placeholder="Cari Creator…" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-blue-100 bg-white text-xs outline-none focus:ring-2 focus:ring-blue-100"></label>
            </div>
            <div id="managed-creator-list" class="mt-4 space-y-2">
              ${creators.length ? creators.map(row).join('') : '<div class="py-10 text-center text-xs text-slate-400">Belum ada Managed Creator.</div>'}
            </div>
            <div id="managed-creator-empty" class="hidden py-10 text-center text-xs text-slate-400">Creator yang dicari belum ditemukan.</div>
          </section>
        </div>`;

      main.querySelectorAll('[data-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.toggle;
          const panel = main.querySelector(`[data-panel="${id}"]`);
          const chevron = main.querySelector(`[data-chevron="${id}"]`);
          const openState = !panel.classList.contains('hidden');
          panel.classList.toggle('hidden', openState);
          btn.setAttribute('aria-expanded', String(!openState));
          chevron.style.transform = openState ? '' : 'rotate(180deg)';
        });
      });

      const search = main.querySelector('#managed-creator-search');
      const empty = main.querySelector('#managed-creator-empty');
      search?.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let visible = 0;
        main.querySelectorAll('.managed-creator-row').forEach(card => {
          const ok = !q || card.dataset.name.toLowerCase().includes(q);
          card.classList.toggle('hidden', !ok);
          if (ok) visible++;
        });
        empty.classList.toggle('hidden', visible !== 0);
      });
      return true;
    } catch (e) {
      main.innerHTML = `<div class="max-w-xl mx-auto my-10 rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm"><div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-triangle-exclamation"></i></div><h1 class="text-lg font-black text-[#151c75]">Dapur Studihome belum dapat dimuat</h1><p class="text-xs text-slate-500 mt-1">${esc(e.message || 'Data Creator belum siap.')}</p><button onclick="location.reload()" class="btn-brand-gradient mt-4 px-4 py-2.5 rounded-xl text-xs font-extrabold">Muat Ulang</button></div>`;
      toast(e.message || 'Dapur Studihome belum dapat dimuat.', 'error');
      return true;
    }
  }

  window.StudihomeAdminDapurManagedHub = Object.freeze({ open });
  open();
})();
