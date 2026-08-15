(() => {
  'use strict';

  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const CONTEXTUAL_LABELS = new Set(['dapur', 'dapur creator', 'creator']);

  function loadScript(src, marker) {
    if (document.querySelector(`script[data-${marker}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset[marker] = '1';
    script.defer = true;
    document.head.appendChild(script);
  }

  function loadAdminModules() {
    if (!isAdmin()) return;
    loadScript('/admin-dapur-creator-v3.js?v=3', 'studihome-admin-dapur-creator-v3');
    loadScript('/admin-gudang-runtime.js?v=1', 'studihome-admin-gudang-runtime');
  }

  function hideGlobalContextualItems() {
    for (const navId of ['top-nav-links', 'mobile-nav-links']) {
      const nav = document.getElementById(navId);
      if (!nav) continue;
      nav.querySelectorAll('a,button,[role="button"]').forEach((el) => {
        if (!CONTEXTUAL_LABELS.has(norm(el.textContent || ''))) return;
        el.dataset.studihomeContextualNavHidden = '1';
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('tabindex', '-1');
      });
    }
  }

  function findAdminCreatorTab() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')]
      .find((btn) => String(btn.getAttribute('onclick') || '').includes("'creators'")) || null;
  }

  function removeLegacyAdminDapurTabs() {
    document.querySelectorAll('#admin-dapur-tab-btn,[data-admin-dapur-nav="1"]').forEach((el) => {
      if (!el.closest('#admin-content-area')) el.remove();
    });
    [...document.querySelectorAll('button[onclick*="switchTab"]')].forEach((btn) => {
      if (norm(btn.textContent || '') === 'dapur') btn.remove();
    });
  }

  function canonicalizeAdminCreatorTab() {
    if (!isAdmin()) return;
    const creator = findAdminCreatorTab();
    if (!creator) return;
    removeLegacyAdminDapurTabs();
    creator.id = 'admin-dapur-creator-tab-btn';
    creator.dataset.studihomeCanonicalAdminCreator = '1';
    creator.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
    creator.onclick = (event) => {
      event?.preventDefault?.();
      const runtime = window.AdminDapurCreatorV3;
      if (runtime?.open) runtime.open();
    };
  }

  function normalizeMemberDapur() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (path !== '/kamar') return;
    const host = document.getElementById('kamar-creator-entry');
    if (!host) return;
    const title = host.querySelector('.text-xs.font-extrabold');
    if (title) title.textContent = 'Dapur Creator ✨';
    const button = host.querySelector('#studihome-open-dapur');
    if (button) button.textContent = 'Buka Dapur Creator';
  }

  function reconcile() {
    loadAdminModules();
    hideGlobalContextualItems();
    canonicalizeAdminCreatorTab();
    normalizeMemberDapur();
    window.AdminGudangRuntime?.install?.();
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
