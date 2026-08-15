(() => {
  'use strict';

  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();

  function adminArea() { return document.getElementById('admin-content-area'); }

  function findAdminTab(key) {
    const target = `'${key}'`;
    return [...document.querySelectorAll('button[onclick*="switchTab"]')].find((b) => String(b.getAttribute('onclick') || '').includes(target)) || null;
  }

  function install() {
    if (!isAdmin()) return;
    const studioButton = findAdminTab('studio-ai');
    const governanceButton = findAdminTab('governance');
    if (!studioButton) return;

    studioButton.id = 'admin-gudang-tab-btn';
    studioButton.dataset.studihomeGudang = '1';
    studioButton.innerHTML = '<i class="fa-solid fa-warehouse mr-1"></i> Gudang';

    if (governanceButton && governanceButton !== studioButton) {
      governanceButton.style.setProperty('display', 'none', 'important');
      governanceButton.setAttribute('aria-hidden', 'true');
      governanceButton.setAttribute('tabindex', '-1');
    }

    const nativeSwitch = window.App?.admin?.switchTab;
    if (!nativeSwitch || nativeSwitch.__gudangWrapped) return;

    const renderNative = async (key) => {
      const area = adminArea();
      if (!area) return '';
      nativeSwitch.call(window.App.admin, key);
      await new Promise((resolve) => setTimeout(resolve, 80));
      return area.innerHTML;
    };

    async function renderGudang(section = 'studio-ai') {
      const area = adminArea();
      if (!area) return;
      area.innerHTML = `
        <div class="space-y-5">
          <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">GUDANG · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Studio AI & Governance dalam satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">Satu workspace untuk mengelola kemampuan AI dan aturan operasional Studihome tanpa berpindah menu.</p></div>
              <div class="flex flex-wrap gap-2"><button type="button" data-gudang-section="studio-ai" class="gudang-section-btn px-3 py-2 rounded-xl text-[10px] font-extrabold ${section === 'studio-ai' ? 'btn-brand-gradient' : 'bg-white border border-blue-100 text-slate-700'}">Studio AI</button><button type="button" data-gudang-section="governance" class="gudang-section-btn px-3 py-2 rounded-xl text-[10px] font-extrabold ${section === 'governance' ? 'btn-brand-gradient' : 'bg-white border border-blue-100 text-slate-700'}">Governance</button></div>
            </div>
          </div>
          <div id="gudang-content" class="card-3d rounded-2xl p-3 sm:p-4"><div class="py-8 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Gudang…</div></div>
        </div>`;

      area.querySelectorAll('.gudang-section-btn').forEach((button) => {
        button.addEventListener('click', () => renderGudang(button.dataset.gudangSection));
      });

      const contentHost = area.querySelector('#gudang-content');
      try {
        const nativeContent = await renderNative(section);
        area.innerHTML = `
          <div class="space-y-5">
            <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">GUDANG · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Studio AI & Governance dalam satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">Kelola ${section === 'studio-ai' ? 'Studio AI' : 'Governance'} dari satu workspace Gudang.</p></div>
                <div class="flex flex-wrap gap-2"><button type="button" data-gudang-section="studio-ai" class="gudang-section-btn px-3 py-2 rounded-xl text-[10px] font-extrabold ${section === 'studio-ai' ? 'btn-brand-gradient' : 'bg-white border border-blue-100 text-slate-700'}">Studio AI</button><button type="button" data-gudang-section="governance" class="gudang-section-btn px-3 py-2 rounded-xl text-[10px] font-extrabold ${section === 'governance' ? 'btn-brand-gradient' : 'bg-white border border-blue-100 text-slate-700'}">Governance</button></div>
              </div>
            </div>
            <div id="gudang-content" class="card-3d rounded-2xl p-3 sm:p-4">${nativeContent || '<div class="py-8 text-center text-xs text-slate-500">Bagian ini belum memiliki konten.</div>'}</div>
          </div>`;
        area.querySelectorAll('.gudang-section-btn').forEach((button) => button.addEventListener('click', () => renderGudang(button.dataset.gudangSection)));
      } catch (e) {
        if (contentHost) contentHost.innerHTML = `<div class="rounded-xl bg-red-50 border border-red-100 p-4 text-xs text-red-700">${String(e.message || 'Gudang gagal dimuat.')}</div>`;
      }
    }

    const wrapper = function(key) {
      if (key === 'studio-ai' || key === 'governance') return renderGudang(key);
      return nativeSwitch.apply(this, arguments);
    };
    wrapper.__gudangWrapped = true;
    window.App.admin.switchTab = wrapper;

    studioButton.onclick = (event) => { event?.preventDefault?.(); renderGudang('studio-ai'); };
    renderGudang('studio-ai');
  }

  function scheduleInstall() {
    if (!isAdmin()) return;
    requestAnimationFrame(install);
  }

  window.addEventListener('studi:ready', scheduleInstall);
  new MutationObserver(scheduleInstall).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleInstall, { once: true }); else scheduleInstall();

  window.AdminGudangRuntime = { install };
})();
