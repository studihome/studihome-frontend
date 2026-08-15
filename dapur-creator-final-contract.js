(() => {
  'use strict';

  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const GLOBAL_CONTEXTUAL = new Set(['dapur', 'dapur creator', 'creator']);

  function loadOnce(src, marker) {
    if (window[marker]) return;
    if (document.querySelector(`script[data-${marker}]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s.dataset[marker] = '1';
    document.head.appendChild(s);
  }

  function hideGlobalDapur() {
    ['top-nav-links', 'mobile-nav-links'].forEach(id => {
      const nav = document.getElementById(id);
      if (!nav) return;
      nav.querySelectorAll('a,button,[role="button"]').forEach(el => {
        const label = norm(el.textContent || '');
        if (!GLOBAL_CONTEXTUAL.has(label)) return;
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('tabindex', '-1');
      });
    });
  }

  function adminButtons() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')];
  }

  function findTab(key) {
    return adminButtons().find(btn => String(btn.getAttribute('onclick') || '').includes(`'${key}'`)) || null;
  }

  function removeLegacyDapurAdminTabs() {
    document.querySelectorAll('#admin-dapur-tab-btn,[data-admin-dapur-nav="1"]').forEach(el => el.remove());
    adminButtons().filter(btn => norm(btn.textContent || '') === 'dapur').forEach(btn => btn.remove());
  }

  function canonicalAdminNav() {
    if (!isAdmin()) return;
    removeLegacyDapurAdminTabs();

    const creator = findTab('creators');
    const studio = findTab('studio-ai');
    const governance = findTab('governance');

    if (creator) {
      creator.id = 'admin-dapur-creator-tab-btn';
      creator.dataset.studihomeCanonical = 'dapur-creator';
      creator.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
      creator.onclick = (event) => {
        event?.preventDefault?.();
        loadOnce('/admin-dapur-creator-v4.js?v=4', 'studihomeAdminDapurCreatorV4');
        setTimeout(() => window.StudihomeAdminDapurCreatorV4?.open?.(), 25);
      };
    }

    if (studio) {
      studio.id = 'admin-gudang-tab-btn';
      studio.dataset.studihomeCanonical = 'gudang';
      studio.innerHTML = '<i class="fa-solid fa-warehouse mr-1"></i> Gudang';
      studio.onclick = (event) => {
        event?.preventDefault?.();
        loadOnce('/admin-gudang-v1.js?v=1', 'studihomeGudangV1');
        setTimeout(() => window.StudihomeGudangV1?.open?.(), 25);
      };
    }

    if (governance && governance !== studio) governance.remove();
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
    hideGlobalDapur();
    canonicalAdminNav();
    normalizeMemberDapur();
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
