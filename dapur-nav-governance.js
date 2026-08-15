(() => {
  'use strict';

  const EXACT_DAPUR = /^dapur$/i;

  const normalize = (value = '') =>
    String(value).replace(/\s+/g, ' ').trim().toLowerCase();

  const isAdmin = () => location.pathname === '/admin';

  function isGlobalHeaderElement(el) {
    if (!el) return false;
    if (el.closest('#admin-content-area, [data-admin-dapur-nav], #admin-dapur-content')) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < 150;
  }

  function hideGlobalDapur() {
    document.querySelectorAll('a,button,[role="button"]').forEach((el) => {
      if (normalize(el.textContent || '') !== 'dapur') return;
      if (!isGlobalHeaderElement(el)) return;
      el.dataset.studihomeGlobalDapurHidden = '1';
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function findAdminButton(label) {
    return [...document.querySelectorAll('button,a,[role="button"]')]
      .find((el) => normalize(el.textContent || '') === label);
  }

  function lockAdminPosition() {
    if (!isAdmin()) return;

    const creator = findAdminButton('creator');
    const studio = findAdminButton('studio ai');
    const dapur = document.querySelector('[data-admin-dapur-nav]');

    if (!creator || !studio || !dapur) return;

    // Only manipulate the internal Admin tabbar, never the global header.
    const parent = studio.parentElement;
    if (!parent || creator.parentElement !== parent) return;

    if (dapur.parentElement !== parent || dapur.nextElementSibling !== studio) {
      parent.insertBefore(dapur, studio);
    }
  }

  function reconcile() {
    hideGlobalDapur();
    lockAdminPosition();
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      reconcile();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('popstate', schedule);

  reconcile();
})();
