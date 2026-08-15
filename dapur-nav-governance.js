(() => {
  'use strict';

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

  function adminTabButtons() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')];
  }

  function findAdminTab(key) {
    const target = `'${key}'`;
    return adminTabButtons().find((el) => String(el.getAttribute('onclick') || '').includes(target)) || null;
  }

  function ensureAdminDapurButton() {
    if (!isAdmin()) return;

    const creator = findAdminTab('creators');
    const studio = findAdminTab('studio-ai');
    if (!creator || !studio || !creator.parentElement || creator.parentElement !== studio.parentElement) return;

    const parent = creator.parentElement;
    let dapur = parent.querySelector('[data-admin-dapur-nav="1"]');

    if (!dapur) {
      dapur = document.createElement('button');
      dapur.type = 'button';
      dapur.dataset.adminDapurNav = '1';
      dapur.className = creator.className || '';
      dapur.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur';
      dapur.addEventListener('click', () => {
        parent.querySelectorAll('button[onclick*="switchTab"]').forEach((el) => {
          el.classList.remove('btn-brand-gradient', 'shadow-xs');
        });
        dapur.classList.add('btn-brand-gradient', 'shadow-xs');
        const area = document.getElementById('admin-content-area');
        if (!area) return;
        area.innerHTML = '<div id="admin-dapur-content"></div>';
        if (window.AdminDapur?.render) window.AdminDapur.render();
        else if (window.AdminDapur?.init) window.AdminDapur.init();
      });
    }

    // Canonical order: Creator → Dapur → Studio AI.
    if (dapur.parentElement !== parent || dapur.nextElementSibling !== studio) {
      parent.insertBefore(dapur, studio);
    }

    dapur.style.removeProperty('display');
    dapur.removeAttribute('aria-hidden');
    dapur.dataset.adminDapurCanonicalPosition = 'between-creator-and-studio-ai';
  }

  function reconcile() {
    hideGlobalDapur();
    ensureAdminDapurButton();
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
