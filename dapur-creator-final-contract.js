(() => {
  'use strict';

  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const GLOBAL_FORBIDDEN = new Set(['dapur', 'dapur creator', 'creator']);

  function loadOnce(src, marker, onReady, onError) {
    if (window[marker]) {
      onReady?.();
      return;
    }
    let script = document.querySelector(`script[data-${marker}]`);
    if (script) {
      script.addEventListener('load', () => onReady?.(), { once: true });
      script.addEventListener('error', () => onError?.(), { once: true });
      return;
    }
    script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.dataset[marker] = '1';
    script.addEventListener('load', () => onReady?.(), { once: true });
    script.addEventListener('error', () => onError?.(), { once: true });
    document.head.appendChild(script);
  }

  function openDapurCreator() {
    loadOnce(
      '/admin-dapur-creator-v5.js?v=5',
      'studihomeAdminDapurCreatorV5',
      () => window.StudihomeAdminDapurCreatorV5?.open?.(),
      () => window.App?.ui?.toast?.('Dapur Creator belum dapat dimuat. Coba muat ulang halaman Admin.', 'error')
    );
  }

  function openGudang() {
    loadOnce(
      '/admin-gudang-v2.js?v=2',
      'studihomeGudangV2',
      () => window.StudihomeGudangV2?.open?.(),
      () => window.App?.ui?.toast?.('Gudang belum dapat dimuat. Coba muat ulang halaman Admin.', 'error')
    );
  }

  function interactiveAncestor(el, stop) {
    let node = el;
    while (node && node !== stop && node !== document.body) {
      if (node.matches?.('a,button,[role="button"],[onclick]')) return node;
      node = node.parentElement;
    }
    return null;
  }

  function removeGlobalDapurHard() {
    const roots = [
      document.getElementById('top-nav-links'),
      document.getElementById('mobile-nav-links')
    ].filter(Boolean);

    roots.forEach(root => {
      const candidates = [...root.querySelectorAll('*')];
      candidates.forEach(el => {
        const label = norm(el.textContent || '');
        if (!GLOBAL_FORBIDDEN.has(label)) return;

        const target = interactiveAncestor(el, root) || el;
        const wrapper = target.closest?.('li') || target;
        if (wrapper && wrapper !== root) wrapper.remove();
      });
    });

    // Defensive sweep for headers that do not expose the canonical nav IDs.
    document.querySelectorAll('header *').forEach(el => {
      if (!el.isConnected) return;
      const label = norm(el.textContent || '');
      if (!GLOBAL_FORBIDDEN.has(label)) return;
      const target = interactiveAncestor(el, document.querySelector('header'));
      const navItem = target?.closest?.('li') || target;
      if (!navItem) return;
      // Never touch the Admin shell itself; this sweep is only for exact global labels.
      if (norm(navItem.textContent || '') === 'dapur' || norm(navItem.textContent || '') === 'dapur creator' || norm(navItem.textContent || '') === 'creator') {
        navItem.remove();
      }
    });
  }

  function adminButtons() {
    return [...document.querySelectorAll('button[onclick*="switchTab"]')];
  }

  function findAdminTab(key) {
    return adminButtons().find(btn => String(btn.getAttribute('onclick') || '').includes(`'${key}'`)) || null;
  }

  function adminTabContainer() {
    const buttons = adminButtons();
    const anchor = buttons.find(btn => {
      const t = norm(btn.textContent || '');
      return t === 'pengguna' || t === 'studio ai' || t === 'gudang' || t === 'governance';
    }) || buttons[0];
    return anchor?.parentElement || null;
  }

  function ensureAdminDapurCreatorTab() {
    if (!isAdmin()) return;

    // Remove legacy standalone Dapur and legacy Creator controls. Dapur Creator is the only Creator-management tab.
    document.querySelectorAll('#admin-dapur-tab-btn,[data-admin-dapur-nav="1"]').forEach(el => el.remove());
    adminButtons().filter(btn => {
      const t = norm(btn.textContent || '');
      return t === 'dapur' || t === 'creator';
    }).forEach(btn => btn.remove());

    let tab = document.getElementById('admin-dapur-creator-tab-btn');
    const container = adminTabContainer();
    if (!container) return;

    if (!tab || !container.contains(tab)) {
      tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'admin-dapur-creator-tab-btn';
      tab.dataset.studihomeCanonical = 'dapur-creator';
      tab.className = 'px-4 py-3 text-sm font-bold text-slate-700 hover:text-[#151c75] transition';
      tab.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
      tab.addEventListener('click', event => {
        event.preventDefault();
        document.querySelectorAll('button[data-studihome-canonical="admin-tab-active"]').forEach(b => b.removeAttribute('data-studihome-canonical'));
        tab.dataset.studihomeCanonical = 'dapur-creator';
        openDapurCreator();
      });

      const pengguna = [...container.querySelectorAll('button')].find(b => norm(b.textContent || '') === 'pengguna');
      const studio = [...container.querySelectorAll('button')].find(b => norm(b.textContent || '') === 'studio ai');
      const gudang = [...container.querySelectorAll('button')].find(b => norm(b.textContent || '') === 'gudang');
      const anchor = pengguna || studio || gudang;
      if (anchor) anchor.insertAdjacentElement('afterend', tab);
      else container.appendChild(tab);
    } else {
      tab.innerHTML = '<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
      tab.onclick = event => {
        event.preventDefault();
        openDapurCreator();
      };
    }

    const studio = findAdminTab('studio-ai');
    if (studio) studio.remove();

    const governance = findAdminTab('governance');
    if (governance) governance.remove();

    // If the native legacy Studio AI tab has already been renamed to Gudang by another patch, keep it.
    const gudang = [...container.querySelectorAll('button')].find(b => norm(b.textContent || '') === 'gudang');
    if (gudang) {
      gudang.onclick = event => {
        event.preventDefault();
        openGudang();
      };
    }
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
    removeGlobalDapurHard();
    ensureAdminDapurCreatorTab();
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