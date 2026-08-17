(() => {
  'use strict';

  const ADMIN = (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  if (!ADMIN) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let sharedPromise = null;
  let mountTimer = 0;
  let mounting = false;

  function loadSharedModule() {
    if (window.StudihomeUnderConstruction) return Promise.resolve(window.StudihomeUnderConstruction);
    if (sharedPromise) return sharedPromise;

    const existing = document.getElementById('studihome-under-construction-js');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'studihome-under-construction-js';
      script.src = '/under-construction.js?v=3';
      script.defer = true;
      script.onerror = () => console.warn('[Studihome Under Construction] shared module failed to load');
      document.head.appendChild(script);
    }

    sharedPromise = (async () => {
      for (let i = 0; i < 120; i += 1) {
        if (window.StudihomeUnderConstruction) return window.StudihomeUnderConstruction;
        await sleep(50);
      }
      return null;
    })();
    return sharedPromise;
  }

  function statusClass(enabled) {
    return enabled
      ? 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-emerald-50 text-emerald-700'
      : 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-slate-100 text-slate-500';
  }

  async function mount() {
    if (mounting) return;
    const root = document.getElementById('admin-content-area');
    const gudang = document.getElementById('admin-gudang-v2');
    if (!root || !gudang || root.querySelector('[data-uc-gudang-slot]')) return;

    mounting = true;
    try {
      const api = await loadSharedModule();
      const liveRoot = document.getElementById('admin-content-area');
      const liveGudang = document.getElementById('admin-gudang-v2');
      if (!api || !liveRoot || !liveGudang || liveRoot.querySelector('[data-uc-gudang-slot]')) return;

      const slot = document.createElement('section');
      slot.dataset.ucGudangSlot = '1';
      slot.className = 'rounded-3xl border border-amber-100 bg-white p-4 sm:p-5 shadow-sm';
      slot.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-black text-[#151c75]">Under Construction</h3>
              <span data-uc-status class="${statusClass(false)}">Memuat status…</span>
            </div>
            <p class="mt-1 text-[10px] text-slate-500">Mode maintenance homepage dikendalikan dari satu panel dan tidak mengubah akses Admin.</p>
          </div>
          <button type="button" data-uc-gudang-open class="shrink-0 rounded-xl bg-[#151c75] px-4 py-2.5 text-[10px] font-extrabold text-white">Buka Pengaturan</button>
        </div>
        <div data-uc-gudang-panel class="mt-4 hidden"></div>`;

      const workspace = liveRoot.querySelector('#gudang-workspace-area');
      if (workspace) liveRoot.insertBefore(slot, workspace);
      else liveRoot.appendChild(slot);

      const status = slot.querySelector('[data-uc-status]');
      try {
        const settings = await api.getSettings();
        status.textContent = settings.enabled ? 'AKTIF' : 'NONAKTIF';
        status.className = statusClass(settings.enabled);
      } catch (error) {
        status.textContent = 'STATUS TIDAK TERBACA';
        status.className = 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-red-50 text-red-700';
        console.warn('[Studihome Under Construction] status read failed', error?.message || error);
      }

      slot.querySelector('[data-uc-gudang-open]')?.addEventListener('click', async () => {
        const target = slot.querySelector('[data-uc-gudang-panel]');
        if (!target) return;
        target.classList.remove('hidden');
        target.innerHTML = '<div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[10px] text-slate-500">Memuat pengaturan Under Construction...</div>';
        try {
          const session = await window.supabaseClient?.auth?.getUser?.();
          if (session?.error) throw session.error;
          if (!session?.data?.user) throw new Error('Sesi Admin belum siap.');
          await api.renderAdmin(target);
        } catch (error) {
          target.innerHTML = `<div class="rounded-2xl border border-red-100 bg-red-50 p-4 text-[10px] text-red-700">Panel gagal dimuat: ${String(error?.message || 'Kesalahan tidak diketahui')}</div>`;
        }
      });
    } finally {
      mounting = false;
    }
  }

  function scheduleMount() {
    clearTimeout(mountTimer);
    mountTimer = window.setTimeout(() => { void mount(); }, 0);
  }

  function boot() {
    scheduleMount();
    const observer = new MutationObserver(() => {
      const root = document.getElementById('admin-content-area');
      if (!root) return;
      if (document.getElementById('admin-gudang-v2') && !root.querySelector('[data-uc-gudang-slot]')) scheduleMount();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
