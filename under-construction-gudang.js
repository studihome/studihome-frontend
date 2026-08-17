(() => {
  'use strict';

  const ADMIN = (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  if (!ADMIN) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const findButton = rx => [...document.querySelectorAll('button')].find(b => rx.test((b.textContent || '').trim()));
  const findGudang = () => findButton(/^Gudang$/i);
  const findUnderConstructionTab = () => document.querySelector('[data-uc-admin-tab]');
  const area = () => document.getElementById('admin-content-area');

  function ensureSlot() {
    const root = area();
    if (!root || root.querySelector('[data-uc-gudang-slot]')) return;
    const slot = document.createElement('section');
    slot.dataset.ucGudangSlot = '1';
    slot.className = 'mt-5 rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm';
    slot.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div>
          <h3 class="mt-1 text-sm font-black text-[#151c75]">Under Construction</h3>
          <p class="mt-1 text-[10px] text-slate-500">Kelola mode maintenance homepage dari dalam Gudang.</p>
        </div>
        <button type="button" data-uc-gudang-open class="rounded-xl bg-[#151c75] px-4 py-2.5 text-[10px] font-extrabold text-white">Buka Pengaturan</button>
      </div>
      <div data-uc-gudang-panel class="mt-4 hidden"></div>`;
    root.appendChild(slot);
    slot.querySelector('[data-uc-gudang-open]')?.addEventListener('click', openPanel);
  }

  async function openPanel() {
    const root = area();
    const slot = root?.querySelector('[data-uc-gudang-slot]');
    const target = slot?.querySelector('[data-uc-gudang-panel]');
    const ucTab = findUnderConstructionTab();
    if (!root || !slot || !target || !ucTab) return;

    target.classList.remove('hidden');
    target.innerHTML = '<div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[10px] text-slate-500">Memuat pengaturan Under Construction...</div>';

    const originalId = root.id;
    const temp = document.createElement('div');
    temp.id = 'admin-content-area';
    temp.style.display = 'none';
    document.body.appendChild(temp);
    root.id = 'admin-content-area-gudang';

    try {
      ucTab.click();
      for (let i = 0; i < 80; i++) {
        const rendered = temp.querySelector('#uc-admin-panel');
        if (rendered) {
          target.innerHTML = '';
          target.appendChild(rendered);
          break;
        }
        await sleep(50);
      }
      if (!target.querySelector('#uc-admin-panel')) {
        target.innerHTML = '<div class="rounded-2xl border border-red-100 bg-red-50 p-4 text-[10px] text-red-700">Panel Under Construction belum dapat dimuat. Coba lagi.</div>';
      }
    } finally {
      temp.remove();
      root.id = originalId;
    }
  }

  function hideLegacyTopLevelTab() {
    const tab = findUnderConstructionTab();
    if (!tab) return;
    tab.style.display = 'none';
    tab.setAttribute('aria-hidden', 'true');
  }

  async function boot() {
    hideLegacyTopLevelTab();
    const gudang = findGudang();
    if (gudang) {
      gudang.addEventListener('click', () => window.setTimeout(ensureSlot, 40), { once: true });
      if (gudang.classList.contains('btn-brand-gradient')) ensureSlot();
    }
    ensureSlot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();

  new MutationObserver(() => {
    hideLegacyTopLevelTab();
    ensureSlot();
  }).observe(document.body, { childList: true, subtree: true });
})();
