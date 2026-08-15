(() => {
  'use strict';
  if (window.StudihomeDapurRouteV3) return;

  const path = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
  const root = () => path() === '/dapur';
  const userRoute = () => /^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
  const db = () => window.supabaseClient || null;
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function ready(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (window.App?.state && db()) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  function authUser() {
    const u = window.App?.state?.user;
    return u && u.id ? u : null;
  }

  async function loadCreatorCount() {
    try {
      const { count } = await db().from('creator_profiles').select('id', { count: 'exact', head: true }).eq('is_published', true);
      return Number(count || 0);
    } catch (_) { return 0; }
  }

  async function getOwnCreator() {
    const u = authUser();
    if (!u) return null;
    const { data, error } = await db().from('creator_profiles')
      .select('id,username,display_name,avatar_url,is_published,is_verified,managed_by_studihome,is_studihome_official')
      .eq('user_id', u.id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function renderRoot() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const u = authUser();
    const own = u ? await getOwnCreator().catch(() => null) : null;
    const publishedCount = u ? await loadCreatorCount() : 0;

    const memberPanel = own ? `
      <section class="mt-5 rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 shrink-0">${own.avatar_url ? `<img src="${esc(own.avatar_url)}" alt="${esc(own.display_name || own.username)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center font-black text-[#151c75]">${esc(String(own.display_name || own.username || 'C').charAt(0).toUpperCase())}</div>`}</div>
          <div class="min-w-0 flex-1"><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Dapurku</div><div class="text-sm font-black text-[#151c75] truncate">${esc(own.display_name || own.username)}</div><div class="text-[9px] text-slate-500 truncate">@${esc(own.username)} · ${own.is_published ? 'Sudah tayang' : 'Masih draft'}</div></div>
          <a href="/dapur/${encodeURIComponent(own.username)}" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-extrabold shrink-0">Kelola</a>
        </div>
        <div class="mt-3 text-[10px] text-slate-500 leading-relaxed">Profil singkatmu siap diedit. Tinggal rapikan identitas, Menu, Hidangan, dan Ambalan dari satu jalur pengelolaan.</div>
      </section>` : `
      <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Belum punya Dapur</div><div class="text-sm font-black text-[#151c75]">Yuk bangun ruang kreatormu sendiri.</div><div class="text-[10px] text-slate-500 mt-1">Daftar sebagai Creator untuk membuat profil, menawarkan Hidangan, dan menampilkan karya.</div></div><a href="/kamar" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-center">Gabung Jadi Creator</a></div>
      </section>`;

    main.innerHTML = `
      <div class="max-w-6xl mx-auto py-5 sm:py-8 px-3 sm:px-0">
        <section class="relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#f7f9ff] via-white to-blue-50 p-6 sm:p-10 lg:p-14 shadow-sm">
          <div class="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="absolute -left-20 bottom-0 w-56 h-56 rounded-full bg-amber-100/50 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-[1.15fr_.85fr] gap-8 lg:gap-12 items-center">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white border border-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-[#151c75]"><i class="fa-solid fa-kitchen-set text-amber-500"></i> Program Creator Studihome</div>
              <h1 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight text-[#151c75]">Dari jago bikin karya,<br><span class="text-[#4a54c7]">jadi koki digital.</span></h1>
              <p class="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">Bangun identitas Creator, susun Menu, tampilkan Hidangan, dan pajang Ambalan karya dalam satu halaman yang rapi. Fokus ke karya, Studihome bantu ruangnya.</p>
              <div class="mt-5 flex flex-wrap gap-2"><a href="/kamar" class="btn-brand-gradient px-4 py-3 rounded-xl text-[11px] font-extrabold">Mulai Jadi Creator</a><a href="#program-kreator" class="px-4 py-3 rounded-xl bg-white border border-blue-100 text-[#151c75] text-[11px] font-extrabold">Lihat Program</a></div>
              <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold text-slate-400"><span><i class="fa-solid fa-id-card text-[#151c75] mr-1"></i>Profil Creator</span><span><i class="fa-solid fa-bowl-food text-[#151c75] mr-1"></i>Hidangan</span><span><i class="fa-solid fa-images text-[#151c75] mr-1"></i>Ambalan</span></div>
            </div>
            <div class="rounded-3xl bg-white/90 border border-blue-100 p-5 sm:p-6 shadow-sm">
              <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">Alur sederhana</div>
              <div class="mt-4 space-y-3">
                <div class="flex gap-3"><span class="w-8 h-8 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center text-[10px] font-black">01</span><div><div class="text-xs font-black text-[#151c75]">Buat identitas</div><div class="text-[9px] text-slate-500 mt-0.5">Tentukan siapa kamu dan apa yang kamu kuasai.</div></div></div>
                <div class="flex gap-3"><span class="w-8 h-8 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center text-[10px] font-black">02</span><div><div class="text-xs font-black text-[#151c75]">Susun Menu & Hidangan</div><div class="text-[9px] text-slate-500 mt-0.5">Pilih fokus dan tawarkan layanan yang jelas.</div></div></div>
                <div class="flex gap-3"><span class="w-8 h-8 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center text-[10px] font-black">03</span><div><div class="text-xs font-black text-[#151c75]">Pamerkan karya</div><div class="text-[9px] text-slate-500 mt-0.5">Tampilkan bukti kerja yang bikin orang percaya.</div></div></div>
                <div class="flex gap-3"><span class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-black">04</span><div><div class="text-xs font-black text-[#151c75]">Siap ditemukan</div><div class="text-[9px] text-slate-500 mt-0.5">Satu alamat publik untuk memperkenalkan karya.</div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="program-kreator" class="mt-5 grid sm:grid-cols-3 gap-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-user-astronaut"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Identitas yang kuat</div><div class="mt-1 text-[10px] leading-relaxed text-slate-500">Profil ringkas, jelas, dan siap dibagikan.</div></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-blue-50 text-[#151c75] flex items-center justify-center"><i class="fa-solid fa-layer-group"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Menu yang fokus</div><div class="mt-1 text-[10px] leading-relaxed text-slate-500">Tampilkan kategori yang benar-benar kamu kuasai.</div></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><i class="fa-solid fa-trophy"></i></div><div class="mt-3 text-xs font-black text-[#151c75]">Karya yang meyakinkan</div><div class="mt-1 text-[10px] leading-relaxed text-slate-500">Ambalan membuat calon klien bisa melihat bukti kerja.</div></div>
        </section>

        ${u ? memberPanel : `
          <section class="mt-5 rounded-3xl border border-blue-100 bg-[#151c75] p-5 sm:p-7 text-white">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-300">Untuk kamu yang punya skill</div><h2 class="mt-1 text-xl sm:text-2xl font-black">Jadikan karya kamu punya rumah.</h2><p class="mt-2 text-[10px] sm:text-xs text-blue-100 leading-relaxed max-w-2xl">Gabung menjadi Creator Studihome dan kelola profil, layanan, serta portofolio dari satu ruang.</p></div><a href="/kamar" class="px-4 py-3 rounded-xl bg-white text-[#151c75] text-[10px] font-extrabold shrink-0">Gabung Sekarang</a></div>
          </section>`}
        ${u && own ? `<div class="mt-3 text-[9px] text-slate-400">${publishedCount > 0 ? 'Komunitas Creator sudah mulai ramai. Saatnya profilmu ikut terlihat.' : 'Profil Creator siap kamu kembangkan. Pelan-pelan, yang penting jadi.'}</div>` : ''}
      </div>`;
    window.App?.ui?.renderNavigation?.();
  }

  async function loadUserRoute() {
    const existing = document.querySelector('script[data-studihome-dapur-user-v3]');
    if (existing) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/dapur-user-route-v3.js?v=1';
      s.defer = true;
      s.dataset.studihomeDapurUserV3 = '1';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Halaman pengelolaan Creator belum dapat dimuat.'));
      document.head.appendChild(s);
    });
  }

  async function boot() {
    if (!root() && !userRoute()) return;
    const ok = await ready();
    if (!ok) return;
    if (userRoute()) return loadUserRoute();
    return renderRoot();
  }

  window.StudihomeDapurRouteV3 = Object.freeze({ boot });
  boot();
})();
