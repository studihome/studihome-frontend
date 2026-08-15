(() => {
  'use strict';

  const isAdmin = () => location.pathname === '/admin';
  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();

  function findNavItem(label) {
    const target = norm(label);
    const nodes = [...document.querySelectorAll('button, a, [role="button"]')];
    return nodes.find((el) => {
      if (!el || el.offsetParent === null) return false;
      const text = norm(el.textContent);
      return text === target || text.includes(target);
    }) || null;
  }

  function moveDapur() {
    if (!isAdmin()) return;

    const creator = findNavItem('creator');
    const studio = findNavItem('studio ai');
    if (!studio) return;

    let dapur = document.querySelector('[data-admin-dapur-nav="1"]');
    if (!dapur) {
      dapur = findNavItem('dapur');
      if (dapur) dapur.dataset.adminDapurNav = '1';
    }

    // If an old/duplicate Dapur exists, keep the first canonical one.
    const allDapur = [...document.querySelectorAll('button, a, [role="button"]')]
      .filter((el) => norm(el.textContent).includes('dapur'));
    if (dapur) {
      for (const el of allDapur) {
        if (el !== dapur && el.dataset?.adminDapurNav !== 'keep') {
          const looksLikeDapur = norm(el.textContent) === 'dapur' || norm(el.textContent).includes('dapur');
          if (looksLikeDapur && el.parentElement === dapur.parentElement) el.remove();
        }
      }
    }

    if (!dapur) {
      // Let the existing admin-dapur module create the real button first.
      return;
    }

    const parent = studio.parentElement;
    if (!parent) return;

    if (dapur.parentElement !== parent) {
      parent.insertBefore(dapur, studio);
    } else if (dapur !== studio.previousElementSibling) {
      parent.insertBefore(dapur, studio);
    }

    dapur.dataset.adminDapurNav = '1';
    dapur.dataset.adminDapurCanonicalPosition = 'creator-before-studio-ai';

    // Keep it visually consistent with the surrounding admin navigation.
    if (creator) {
      dapur.classList.remove('hidden');
      if (creator.className) dapur.className = creator.className;
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      moveDapur();
    });
  }

  function init() {
    if (!isAdmin()) return;
    schedule();
    const root = document.getElementById('admin-content-area') || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('popstate', schedule);
    window.addEventListener('hashchange', schedule);
    setTimeout(schedule, 250);
    setTimeout(schedule, 750);
    setTimeout(schedule, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
