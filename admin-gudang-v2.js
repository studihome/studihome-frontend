(() => {
  'use strict';

  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const safe = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  const WORKSPACES = [
    {
      key: 'studio-ai',
      label: 'Studio AI',
      kicker: 'KATALOG & PRODUK AI',
      title: 'Kelola Studio AI',
      description: 'Atur katalog AI, kategori, dan workspace AI dari modul utama Admin.',
      icon: 'fa-wand-magic-sparkles',
      tone: 'blue',
      action: 'Buka Studio AI'
    },
    {
      key: 'governance',
      label: 'Governance',
      kicker: 'KONTROL & KEPATUHAN',
      title: 'Kelola Governance',
      description: 'Review data, kebijakan, monitoring, dan kontrol operasional Admin.',
      icon: 'fa-shield-halved',
      tone: 'amber',
      action: 'Buka Governance'
    }
  ];

  function findNative(key) {
    const candidates = [
      ...document.querySelectorAll('#admin-content-area button[onclick*="switchTab"], button[onclick*="switchTab"]')
    ];
    return candidates.find(btn => {
      const onclick = String(btn.getAttribute('onclick') || '');
      return onclick.includes(`'${key}'`) || onclick.includes(`"${key}"`);
    }) || null;
  }

  function openNative(key) {
    try {
      if (typeof window.App?.admin?.switchTab === 'function') {
        window.App.admin.switchTab(key);
        return true;
      }
    } catch (_) {}

    const native = findNative(key);
    if (native) {
      try {
        native.click();
        return true;
      } catch (_) {}
    }
    return false;
  }

  function renderWorkspaceCard(item, activeKey = '') {
    const tone = item.tone === 'amber'
      ? {
          icon: 'bg-amber-50 text-amber-700 border-amber-100',
          pill: 'bg-amber-50 text-amber-800 border-amber-100',
          hover: 'hover:border-amber-200'
        }
      : {
          icon: 'bg-blue-50 text-[#151c75] border-blue-100',
          pill: 'bg-blue-50 text-[#151c75] border-blue-100',
          hover: 'hover:border-blue-200'
        };

    const isActive = activeKey === item.key;

    return `
      <article data-gudang-card="${safe(item.key)}"
        class="group relative overflow-hidden rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 ${tone.hover} ${isActive ? 'ring-2 ring-[#3f48bf]/20 border-blue-200 shadow-lg' : 'border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg'}">
        <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${item.tone === 'amber' ? 'bg-amber-100/50' : 'bg-blue-100/60'} blur-2xl"></div>
        <div class="relative z-10 flex flex-col gap-5 h-full">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 ${tone.icon}">
                <i class="fa-solid ${safe(item.icon)}"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[9px] font-black uppercase tracking-[.12em] text-slate-400 truncate">${safe(item.kicker)}</div>
                <h3 class="mt-1 text-sm sm:text-base font-black text-[#151c75]">${safe(item.title)}</h3>
              </div>
            </div>
            <span data-gudang-state="${safe(item.key)}" class="shrink-0 px-2.5 py-1 rounded-full border text-[9px] font-extrabold ${tone.pill}">Siap</span>
          </div>

          <p class="text-[10px] sm:text-[11px] leading-relaxed text-slate-600 max-w-xl">${safe(item.description)}</p>

          <div class="mt-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div class="text-[9px] text-slate-400">Workspace native Admin · perubahan tetap dikelola modul sumber.</div>
            <button type="button" data-open="${safe(item.key)}"
              class="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold transition-all ${item.tone === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100' : 'btn-brand-gradient'}">
              ${safe(item.action)}
              <i class="fa-solid fa-arrow-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </article>`;
  }

  function setStatus(key, ok) {
    const selectorKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '');
    const state = document.querySelector(`[data-gudang-state="${selectorKey}"]`);
    if (state) {
      state.textContent = ok ? 'Terbuka' : 'Tidak tersedia';
      state.className = ok
        ? 'shrink-0 px-2.5 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold'
        : 'shrink-0 px-2.5 py-1 rounded-full border border-red-100 bg-red-50 text-red-700 text-[9px] font-extrabold';
    }
  }

  function open() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;

    area.innerHTML = `
      <section id="admin-gudang-v2" class="space-y-5 sm:space-y-6">
        <div class="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 sm:p-6 shadow-sm">
          <div class="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div class="max-w-3xl">
              <div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">GUDANG · ADMIN WORKSPACE</div>
              <h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Pusat kendali modul Admin</h2>
              <p class="mt-1.5 text-[10px] sm:text-xs text-slate-600 leading-relaxed">Gudang adalah pintu cepat untuk membuka workspace inti. Kelola data di modul aslinya agar alur kerja tetap rapi dan tidak terjadi duplikasi.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <div class="rounded-xl bg-white/90 border border-blue-100 px-3 py-2 text-[10px] font-bold text-slate-600"><i class="fa-solid fa-bolt text-amber-500 mr-1"></i> Akses cepat</div>
              <div class="rounded-xl bg-white/90 border border-blue-100 px-3 py-2 text-[10px] font-bold text-slate-600"><i class="fa-solid fa-layer-group text-[#151c75] mr-1"></i> Tanpa duplikasi</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 class="text-sm font-black text-[#151c75]">Pilih workspace</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">Buka modul sesuai pekerjaan yang ingin Anda kelola.</p>
          </div>
          <div class="text-[9px] font-bold text-slate-400">${WORKSPACES.length} workspace aktif</div>
        </div>

        <div id="admin-gudang-v2-grid" class="grid lg:grid-cols-2 gap-4">
          ${WORKSPACES.map(item => renderWorkspaceCard(item)).join('')}
        </div>

        <div id="admin-gudang-v2-status" class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[10px] text-slate-500 flex items-center gap-2">
          <i class="fa-solid fa-circle-info text-[#151c75]"></i>
          <span>Semua tombol membuka modul Admin yang sudah ada. Data tetap dikelola di sumbernya.</span>
        </div>
      </section>`;

    area.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.open;
        const item = WORKSPACES.find(x => x.key === key);
        if (!item) return;

        const status = document.getElementById('admin-gudang-v2-status');
        if (status) {
          status.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-[#151c75]"></i><span>Membuka ${safe(item.label)}…</span>`;
        }

        const ok = openNative(key);
        setStatus(key, ok);

        if (ok) {
          if (status) status.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i><span>${safe(item.label)} dibuka. Kelola fitur langsung di workspace tersebut.</span>`;
        } else {
          if (status) status.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-600"></i><span>${safe(item.label)} belum tersedia pada runtime Admin saat ini.</span>`;
          toast(`${item.label} belum tersedia pada runtime Admin.`, 'error');
        }
      });
    });
  }

  window.StudihomeGudangV2 = Object.freeze({ open });
})();
