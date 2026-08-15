(() => {
  'use strict';

  const norm = (v = '') => String(v).replace(/\s+/g, ' ').trim().toLowerCase();
  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const GLOBAL_CONTEXTUAL = new Set(['dapur', 'dapur creator', 'creator']);

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

  function hideGlobalDapur() {
    document.querySelectorAll('#top-nav-links a,#top-nav-links button,#top-nav-links [role="button"],#mobile-nav-links a,#mobile-nav-links button,#mobile-nav-links [role="button"],header a,header button').forEach(el => {
      const label = norm(el.textContent || '');
      if (!GLOBAL_CONTEXTUAL.has(label)) return;
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
      el.dataset.studihomeContextualHidden = '1';
    });
  }

  function adminButtons() {
    return [...document.querySelectorAll('#admin-content-area button[onclick*="switchTab"],button[onclick*="switchTab"],#admin-content-area button[data-studihome-admin-canonical]')];
  }

  function adminNavHost() {
    const existing = adminButtons()[0];
    return existing?.parentElement || document.querySelector('#admin-content-area nav') || document.querySelector('#admin-content-area .admin-tab-nav');
  }

  function makeButton(id, label, icon, className, handler) {
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = id;
      btn.dataset.studihomeAdminCanonical = id;
      btn.className = className;
    }
    btn.innerHTML = `<i class="${icon} mr-1"></i> ${label}`;
    btn.onclick = handler;
    return btn;
  }

  function openDapur(btn) {
    btn?.classList.add('bg-[#2f3aa6]', 'text-white');
    loadOnce('/admin-dapur-creator-v5.js?v=5', 'studihomeAdminDapurCreatorV5', () => {
      window.StudihomeAdminDapurCreatorV5?.open?.();
    }, () => {
      window.App?.ui?.toast?.('Dapur Creator gagal dimuat. Silakan muat ulang halaman Admin.', 'error');
    });
  }

  function openGudang(btn) {
    btn?.classList.add('bg-[#2f3aa6]', 'text-white');
    loadOnce('/admin-gudang-v2.js?v=2', 'studihomeGudangV2', () => {
      window.StudihomeGudangV2?.open?.();
    }, () => {
      window.App?.ui?.toast?.('Gudang gagal dimuat. Silakan muat ulang halaman Admin.', 'error');
    });
  }

  function canonicalAdminNav() {
    if (!isAdmin()) return;

    const host = adminNavHost();
    if (!host) return;

    // Remove obsolete standalone Dapur/Governance controls.
    host.querySelectorAll('button,a').forEach(btn => {
      const label = norm(btn.textContent || '');
      if (label === 'dapur' || label === 'dapur creator') {
        if (btn.id !== 'admin-dapur-creator-tab-btn') btn.remove();
      }
      if (label === 'governance') btn.remove();
    });

    // Keep the existing Studio AI button as the canonical Gudang entry.
    const studio = [...host.querySelectorAll('button,a')].find(btn => norm(btn.textContent || '').includes('studio ai'));
    if (studio && studio.id !== 'admin-gudang-tab-btn') {
      studio.id = 'admin-gudang-tab-btn';
      studio.dataset.studihomeAdminCanonical = 'admin-gudang-tab-btn';
      studio.innerHTML = '<i class="fa-solid fa-warehouse mr-1"></i> Gudang';
      studio.onclick = event => { event?.preventDefault?.(); openGudang(studio); };
    }

    let gudang = document.getElementById('admin-gudang-tab-btn');
    if (!gudang) {
      gudang = makeButton('admin-gudang-tab-btn', 'Gudang', 'fa-solid fa-warehouse', 'px-5 py-2.5 rounded-2xl text-sm font-bold text-[#334155] hover:bg-white/70', () => openGudang(gudang));
      host.appendChild(gudang);
    }

    let dapur = document.getElementById('admin-dapur-creator-tab-btn');
    if (!dapur) {
      dapur = makeButton('admin-dapur-creator-tab-btn', 'Dapur Creator', 'fa-solid fa-kitchen-set', 'px-5 py-2.5 rounded-2xl text-sm font-bold text-[#334155] hover:bg-white/70', () => openDapur(dapur));
      host.insertBefore(dapur, gudang);
    } else {
      dapur.onclick = () => openDapur(dapur);
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

  if (document.documentElement) {
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('studi:ready', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
