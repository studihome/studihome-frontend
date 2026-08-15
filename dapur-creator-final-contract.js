(() => {
  'use strict';

  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const globalLabels = new Set(['dapur', 'dapur creator', 'creator']);

  function isGlobal(el) {
    if (!el) return false;
    if (el.closest('#admin-content-area, #admin-dapur-creator-content, #admin-dapur-content')) return false;
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < 150;
  }

  function hideGlobalContextual() {
    document.querySelectorAll('a,button,[role="button"]').forEach(el => {
      if (!globalLabels.has(norm(el.textContent || ''))) return;
      if (!isGlobal(el)) return;
      el.dataset.studihomeFinalContextualHidden = '1';
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
    });
  }

  function adminButtons() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')];
  }

  function findAdminTab(key) {
    const target = `'${key}'`;
    return adminButtons().find(b => String(b.getAttribute('onclick') || '').includes(target)) || null;
  }

  function findAdminDapurButton() {
    return adminButtons().find(b => norm(b.textContent || '') === 'dapur')
      || document.getElementById('admin-dapur-tab-btn')
      || document.querySelector('[data-admin-dapur-nav="1"]');
  }

  function openRuntimeCreator(id) {
    const list = document.getElementById('admin-dc-runtime-list');
    const row = list?.querySelector(`.dc-runtime-item[data-creator-id="${CSS.escape(id)}"]`)
      || document.querySelector(`.dc-runtime-item [data-creator-id="${CSS.escape(id)}"]`)?.closest('.dc-runtime-item');
    if (row) {
      row.open = true;
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const host = row.querySelector('[data-creator-id]');
      if (host && !host.dataset.loaded) {
        const rt = window.AdminDapurCreatorRuntime;
        if (rt?.loadDetail) rt.loadDetail(host, id);
      }
      return;
    }
    window.AdminDapurCreatorRuntime?.open?.();
  }

  function removeLegacyDapurButtons() {
    const creator = findAdminTab('creators');
    const dapur = findAdminDapurButton();
    if (dapur && dapur !== creator) dapur.remove();
    document.querySelectorAll('#admin-dapur-tab-btn,[data-admin-dapur-nav="1"]').forEach(el => {
      if (el !== creator && !el.closest('#admin-content-area')) el.remove();
    });
  }

  function ensureAdminDapurCreator() {
    if (!isAdmin()) return;
    const creator = findAdminTab('creators');
    if (!creator) return;

    removeLegacyDapurButtons();

    creator.id = 'admin-dapur-creator-tab-btn';
    creator.dataset.studihomeCanonicalAdminCreator = '1';
    creator.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
    creator.onclick = (event) => {
      event?.preventDefault?.();
      const rt = window.AdminDapurCreatorRuntime;
      if (rt?.open) rt.open();
      else if (rt?.render) rt.render();
    };
  }

  function injectManageButtons() {
    if (!isAdmin()) return;
    document.querySelectorAll('#admin-dc-runtime-list .dc-runtime-item').forEach(row => {
      const host = row.querySelector('[data-creator-id]');
      if (!host) return;
      const id = host.getAttribute('data-creator-id');
      if (!id || host.querySelector('[data-dc-manage-button]')) return;

      const actionBars = host.querySelectorAll('.flex.flex-wrap.gap-2');
      const bar = [...actionBars].find(x => x.querySelector('a[href]')) || actionBars[0];
      if (!bar) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.dcManageButton = '1';
      btn.className = 'px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[10px] font-bold text-[#151c75]';
      btn.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Kelola Dapur';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openRuntimeCreator(id);
      });
      bar.appendChild(btn);
    });
  }

  function ensureMemberDapurButton() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (path !== '/kamar') return;
    const host = document.getElementById('kamar-creator-entry');
    const legacy = document.getElementById('studihome-open-dapur');
    if (!host || !legacy) return;
    const label = host.querySelector('.text-xs.font-extrabold');
    if (label) label.textContent = 'Dapur Creator ✨';
    legacy.textContent = 'Buka Dapur Creator';
  }

  function reconcile() {
    hideGlobalContextual();
    ensureAdminDapurCreator();
    injectManageButtons();
    ensureMemberDapurButton();
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      reconcile();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('studi:ready', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
