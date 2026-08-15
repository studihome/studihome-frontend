(() => {
  'use strict';

  const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => location.pathname === '/admin';
  const GLOBAL_CONTEXTUAL_LABELS = new Set(['dapur', 'dapur creator']);

  function isGlobalHeaderElement(el) {
    if (!el) return false;
    if (el.closest('#admin-content-area, #admin-dapur-creator-content, [data-admin-dapur-nav], #admin-dapur-content')) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < 150;
  }

  function loadAdminRuntime() {
    if (!isAdmin() || document.querySelector('script[data-studihome-admin-dapur-creator-runtime]')) return;
    const s = document.createElement('script');
    s.src = '/admin-dapur-creator-runtime.js?v=2';
    s.dataset.studihomeAdminDapurCreatorRuntime = '1';
    s.defer = true;
    document.head.appendChild(s);
  }

  function hideContextualGlobalItems() {
    document.querySelectorAll('a,button,[role="button"]').forEach((el) => {
      const label = normalize(el.textContent || '');
      if (!GLOBAL_CONTEXTUAL_LABELS.has(label)) return;
      if (!isGlobalHeaderElement(el)) return;
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
      el.dataset.studihomeContextualNavHidden = '1';
    });
  }

  function findAdminCreatorTab() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')]
      .find(el => String(el.getAttribute('onclick') || '').includes("'creators'")) || null;
  }

  function cleanLegacyAdminDapur() {
    if (!isAdmin()) return;
    document.querySelectorAll('#admin-content-area button, #admin-content-area a, [data-admin-dapur-nav="1"], #admin-dapur-tab-btn').forEach((el) => {
      const label = normalize(el.textContent || '');
      const canonical = el.id === 'admin-dapur-creator-tab-btn' || el.dataset.adminDapurCreatorCanonical === '1';
      if (canonical) return;
      if (label === 'dapur' || el.dataset.adminDapurNav === '1' || el.id === 'admin-dapur-tab-btn') el.remove();
    });
  }

  function ensureAdminDapurCreator() {
    if (!isAdmin()) return;
    const creator = findAdminCreatorTab();
    if (!creator) return;
    creator.id = 'admin-dapur-creator-tab-btn';
    creator.dataset.adminDapurCreatorCanonical = '1';
    creator.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
    creator.onclick = (event) => {
      event.preventDefault();
      if (window.AdminDapurCreatorRuntime?.open) window.AdminDapurCreatorRuntime.open();
    };
    cleanLegacyAdminDapur();
  }

  function reconcile() {
    hideContextualGlobalItems();
    loadAdminRuntime();
    ensureAdminDapurCreator();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      reconcile();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
