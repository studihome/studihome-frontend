(() => {
  'use strict';

  const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => location.pathname === '/admin';

  // Navigation contract:
  // Global header is ONLY: Teras | Lobi | Studio AI | Admin.
  // Dapur and Dapur Creator are contextual workspaces.
  const GLOBAL_CONTEXTUAL_LABELS = new Set(['dapur', 'dapur creator']);

  function isGlobalHeaderElement(el) {
    if (!el) return false;
    if (el.closest('#admin-content-area, #admin-dapur-creator-content, [data-admin-dapur-nav], #admin-dapur-content')) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < 150;
  }

  function hideContextualGlobalItems() {
    document.querySelectorAll('a,button,[role="button"]').forEach((el) => {
      const label = normalize(el.textContent || '');
      if (!GLOBAL_CONTEXTUAL_LABELS.has(label)) return;
      if (!isGlobalHeaderElement(el)) return;
      el.dataset.studihomeContextualNavHidden = '1';
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
    });
  }

  // Backward-compatibility cleanup for older navigation patches.
  function cleanLegacyGlobalItems() {
    document.querySelectorAll('[data-studihome-global-dapur-hidden="1"],[data-studihome-contextual-nav-hidden="1"]').forEach((el) => {
      if (isGlobalHeaderElement(el)) el.style.setProperty('display', 'none', 'important');
    });
  }

  function reconcile() {
    hideContextualGlobalItems();
    cleanLegacyGlobalItems();
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

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  } else {
    reconcile();
  }
})();
