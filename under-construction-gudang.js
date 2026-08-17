(() => {
  'use strict';

  const ADMIN = (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  if (!ADMIN) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let patchTimer = 0;
  let patched = false;
  let mounting = false;

  function loadSharedModule() {
    if (window.StudihomeUnderConstruction) return Promise.resolve(window.StudihomeUnderConstruction);
    const existing = document.getElementById('studihome-under-construction-js');
    if (!existing) {
      const s = document.createElement('script');
      s.id = 'studihome-under-construction-js';
      s.src = '/under-construction.js?v=3';
      s.defer = true;
      s.onerror = () => console.warn('[Studihome Under Construction] shared module failed to load');
      document.head.appendChild(s);
    }
    return (async () => {
      for (let i = 0; i < 120; i += 1) {
        if (window.StudihomeUnderConstruction) return window.StudihomeUnderConstruction;
        await sleep(50);
      }
      return null;
    })();
  }

  async function mountIntoGudang() {
    if (mounting) return;
    const root = document.getElementById('admin-content-area');
    if (!root || !document.getElementById('admin-gudang-v2')) return;
    if (root.querySelector('[data-uc-gudang-slot]')) return;

    mounting = true;
    try {
      const api = await loadSharedModule();
      const liveRoot = document.getElementById('admin-content-area');
      const gudang = document.getElementById('admin-gudang-v2');
      if (!api || !liveRoot || !gudang || liveRoot.querySelector('[data-uc-gudang-slot]')) return;

      const slot = document.createElement('section');
      slot.dataset.ucGudangSlot = '1';
      slot.className = 'my-5 rounded-3xl border border-amber-100 bg-white p-4 sm:p-5 shadow-sm';
      slot.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-black text-[#151c75]">Under Construction</h3>
              <span data-uc-status class="rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-slate-100 text-slate-500">Memuat status…</span>
            </div>
            <p class="mt-1 text-[10px] text-slate-500">Kontrol mode maintenance homepage langsung dari Gudang.</p>
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
        status.className = settings.enabled
          ? 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-emerald-50 text-emerald-700'
          : 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-slate-100 text-slate-500';
      } catch (_) {
        status.textContent = 'STATUS TIDAK TERBACA';
        status.className = 'rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] bg-red-50 text-red-700';
      }

      slot.querySelector('[data-uc-gudang-open]')?.addEventListener('click', async () => {
        const target = slot.querySelector('[data-uc-gudang-panel]');
        if (!target) return;
        target.classList.remove('hidden');
        target.innerHTML = '<div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[10px] text-slate-500">Memuat pengaturan Under Construction...</div>';
        try {
          await api.renderAdmin(target);
        } catch (error) {
          target.innerHTML = `<div class="rounded-2xl border border-red-100 bg-red-50 p-4 text-[10px] text-red-700">Panel gagal dimuat: ${String(error?.message || 'Kesalahan tidak diketahui')}</div>`;
        }
      });
    } finally {
      mounting = false;
    }
  }

  function patchCanonicalGudang() {
    const current = window.StudihomeGudangV2;
    if (!current || typeof current.open !== 'function') return false;
    if (current.open.__underConstructionPatched === true) {
      patched = true;
      return true;
    }

    const originalOpen = current.open;
    const wrappedOpen = async function (...args) {
      const result = await originalOpen.apply(this, args);
      for (let i = 0; i < 80; i += 1) {
        if (document.getElementById('admin-gudang-v2')) break;
        await sleep(25);
      }
      await mountIntoGudang();
      return result;
    };
    Object.defineProperty(wrappedOpen, '__underConstructionPatched', { value: true });

    window.StudihomeGudangV2 = Object.freeze({ ...current, open: wrappedOpen });
    patched = true;
    return true;
  }

  function schedulePatch() {
    if (patched) return;
    clearTimeout(patchTimer);
    patchTimer = window.setTimeout(() => {
      if (!patchCanonicalGudang()) schedulePatch();
    }, 50);
  }

  async function boot() {
    schedulePatch();
    const observer = new MutationObserver(() => {
      schedulePatch();
      if (window.StudihomeGudangV2?.open) void mountIntoGudang();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();
})();