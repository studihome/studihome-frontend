(() => {
  'use strict';

  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const safe = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');

  function openNative(key) {
    try { window.App?.admin?.switchTab?.(key); } catch (_) {}
  }

  function open() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = `
      <div id="admin-gudang-v1" class="space-y-5">
        <div class="card-3d rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">GUDANG · ADMIN CONTROL CENTER</div>
              <h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Studio AI & Governance dalam satu tempat</h2>
              <p class="mt-1 max-w-2xl text-[10px] sm:text-xs text-slate-500 leading-relaxed">Gudang menyatukan pengelolaan ekosistem AI dan governance. Gunakan satu pintu untuk membuka workspace teknis yang sudah ada.</p>
            </div>
          </div>
        </div>

        <div class="grid xl:grid-cols-2 gap-4">
          <section class="card-3d rounded-3xl p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-11 h-11 rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center shrink-0"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div><h3 class="text-sm font-black text-[#151c75]">Studio AI</h3><p class="mt-1 text-[10px] text-slate-500 leading-relaxed">Kelola katalog AI, workflow, kategori solusi, dan workspace AI yang sudah tersedia di Studihome.</p></div>
              </div>
              <button type="button" data-gudang-open="studio-ai" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-extrabold shrink-0">Buka Studio AI</button>
            </div>
            <div class="mt-4 grid sm:grid-cols-2 gap-2">
              ${[
                ['fa-cube','AI Visual','Visual, mockup, 3D'],
                ['fa-robot','AI Agent','Agent & workflow'],
                ['fa-gears','AI Automation','Otomasi & integrasi'],
                ['fa-comments','AI Chatbot','Percakapan & CS']
              ].map(x => `<div class="rounded-2xl bg-slate-50 border border-slate-100 p-3"><div class="flex items-center gap-2"><i class="fa-solid ${x[0]} text-[#151c75] text-xs"></i><span class="text-[10px] font-bold text-[#151c75]">${safe(x[1])}</span></div><div class="mt-1 text-[9px] text-slate-500">${safe(x[2])}</div></div>`).join('')}
            </div>
          </section>

          <section class="card-3d rounded-3xl p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-shield-halved"></i></div>
                <div><h3 class="text-sm font-black text-[#151c75]">Governance</h3><p class="mt-1 text-[10px] text-slate-500 leading-relaxed">Monitoring, aturan operasional, review, dan kontrol kualitas ekosistem Studihome.</p></div>
              </div>
              <button type="button" data-gudang-open="governance" class="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold shrink-0">Buka Governance</button>
            </div>
            <div class="mt-4 grid sm:grid-cols-2 gap-2">
              ${[
                ['fa-user-shield','Access','Akses & kontrol'],
                ['fa-clipboard-check','Review','Review & moderation'],
                ['fa-scale-balanced','Policy','Aturan & kepatuhan'],
                ['fa-chart-line','Monitoring','Kinerja & audit']
              ].map(x => `<div class="rounded-2xl bg-slate-50 border border-slate-100 p-3"><div class="flex items-center gap-2"><i class="fa-solid ${x[0]} text-[#151c75] text-xs"></i><span class="text-[10px] font-bold text-[#151c75]">${safe(x[1])}</span></div><div class="mt-1 text-[9px] text-slate-500">${safe(x[2])}</div></div>`).join('')}
            </div>
          </section>
        </div>

        <div class="card-3d-inset rounded-2xl p-4">
          <div class="text-[10px] font-black uppercase tracking-[.08em] text-slate-500">Prinsip Gudang</div>
          <div class="mt-2 flex flex-wrap gap-2 text-[9px] font-bold text-[#151c75]">
            <span class="px-2.5 py-1.5 rounded-lg bg-white border border-blue-100">Satu pintu</span>
            <span class="px-2.5 py-1.5 rounded-lg bg-white border border-blue-100">Tidak duplikasi data</span>
            <span class="px-2.5 py-1.5 rounded-lg bg-white border border-blue-100">Akses berdasarkan role</span>
            <span class="px-2.5 py-1.5 rounded-lg bg-white border border-blue-100">Mudah diaudit</span>
          </div>
        </div>
      </div>`;

    area.querySelectorAll('[data-gudang-open]').forEach(btn => btn.addEventListener('click', () => openNative(btn.dataset.gudangOpen)));
  }

  window.StudihomeGudangV1 = { open };
})();
