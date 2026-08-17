(() => {
  'use strict';

  const IS_ADMIN = (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  if (!IS_ADMIN) return;

  const VERSION = '4';
  const MENU_ID = 'studihome-under-construction-menu';
  const PANEL_ID = 'studihome-under-construction-admin-root';
  const SHARED_ID = `studihome-under-construction-js-v${VERSION}`;
  let sharedPromise = null;
  let observer = null;
  let renderInFlight = false;
  let lastNavigationContainer = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function loadSharedModule() {
    if (window.StudihomeUnderConstruction) return Promise.resolve(window.StudihomeUnderConstruction);
    if (sharedPromise) return sharedPromise;

    let script = document.getElementById(SHARED_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SHARED_ID;
      script.src = `/under-construction.js?v=${VERSION}`;
      script.async = false;
      script.defer = true;
      script.onerror = () => console.warn('[Studihome Under Construction] shared module failed to load');
      document.head.appendChild(script);
    }

    sharedPromise = (async () => {
      for (let i = 0; i < 120; i += 1) {
        if (window.StudihomeUnderConstruction) return window.StudihomeUnderConstruction;
        await sleep(50);
      }
      return null;
    })();

    return sharedPromise;
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function controlsCount(el) {
    return el.querySelectorAll('a,button,[role="button"]').length;
  }

  function isNavigationContainer(el) {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toLowerCase();
    if (!['nav', 'aside'].includes(tag) && !el.matches('[role="navigation"]')) return false;
    return controlsCount(el) >= 2;
  }

  function navigationScore(el) {
    if (!isNavigationContainer(el)) return -1;
    const text = normalizeText(el.innerText);
    let score = Math.min(controlsCount(el), 20) * 0.1;
    if (text.includes('gudang')) score += 8;
    if (text.includes('dashboard')) score += 5;
    if (text.includes('produk')) score += 3;
    if (text.includes('pengguna')) score += 3;
    if (text.includes('transaksi')) score += 3;
    return score;
  }

  function findNavigationContainer() {
    const candidates = Array.from(document.querySelectorAll('aside, nav, [role="navigation"]'));
    return candidates
      .map(el => ({ el, score: navigationScore(el) }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score)[0]?.el || null;
  }

  function findGudangControl(container) {
    if (!container?.isConnected) return null;
    return Array.from(container.querySelectorAll('a,button,[role="button"]')).find(el => {
      const text = normalizeText(el.textContent || el.getAttribute('aria-label'));
      return text === 'gudang' || text.includes(' gudang') || text.startsWith('gudang ');
    }) || null;
  }

  function buildMenuButton() {
    const button = document.createElement('button');
    button.id = MENU_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Under Construction');
    button.innerHTML = `
      <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600">
        <i class="fa-solid fa-person-digging text-[12px]" aria-hidden="true"></i>
      </span>
      <span class="min-w-0 flex-1 text-left">
        <span class="block text-[10px] font-extrabold truncate">Under Construction</span>
        <span class="block text-[8px] text-slate-400 truncate">Kontrol maintenance</span>
      </span>`;
    button.className = 'w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition';
    button.addEventListener('click', () => { void openAdminPanel(button); });
    return button;
  }

  function ensureMenu() {
    const existing = document.getElementById(MENU_ID);
    const container = findNavigationContainer();

    if (!container?.isConnected) {
      lastNavigationContainer = null;
      return false;
    }

    if (existing?.isConnected) {
      if (existing.parentElement === container) {
        lastNavigationContainer = container;
        return true;
      }
      existing.remove();
    }

    const menu = buildMenuButton();
    const gudang = findGudangControl(container);

    // Never use insertBefore/insertAdjacentElement here. The admin shell is
    // reactive and may replace navigation nodes between observer callbacks.
    if (gudang?.parentElement === container && gudang.isConnected) {
      container.appendChild(menu);
    } else {
      container.appendChild(menu);
    }

    lastNavigationContainer = container;
    return menu.isConnected;
  }

  function setMenuActive(active) {
    const button = document.getElementById(MENU_ID);
    if (!button) return;
    button.classList.toggle('bg-[#151c75]', active);
    button.classList.toggle('text-white', active);
    button.classList.toggle('hover:bg-amber-50', !active);
    button.classList.toggle('hover:text-amber-800', !active);
  }

  function getContentArea() {
    const area = document.getElementById('admin-content-area');
    return area?.isConnected ? area : null;
  }

  function cleanFooterWhitespace() {
    const footer = document.querySelector('footer');
    const parent = footer?.parentNode;
    if (!footer || !parent) return;

    let node = footer.nextSibling;
    while (node && node.nodeType === Node.TEXT_NODE && !node.nodeValue?.trim()) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
  }

  async function openAdminPanel(menuButton) {
    if (renderInFlight) return;
    const area = getContentArea();
    if (!area) return;

    renderInFlight = true;
    setMenuActive(true);

    try {
      const api = await loadSharedModule();
      if (!api?.renderAdmin) throw new Error('Modul Under Construction belum siap.');

      area.innerHTML = `<section id="${PANEL_ID}" class="space-y-4">
        <div class="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
          <div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div>
          <h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Under Construction</h2>
          <p class="mt-1 text-[10px] sm:text-xs text-slate-500">Kelola mode maintenance homepage dari menu Admin khusus ini.</p>
        </div>
        <div id="${PANEL_ID}-body" class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div class="py-10 text-center text-[10px] text-slate-500">Memuat pengaturan…</div>
        </div>
      </section>`;

      const target = document.getElementById(`${PANEL_ID}-body`);
      if (!target?.isConnected) throw new Error('Area panel tidak tersedia.');
      await api.renderAdmin(target);
      if (target.isConnected) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      const safeMessage = String(error?.message || 'Kesalahan tidak diketahui')
        .replace(/[<>]/g, '');
      area.innerHTML = `<section id="${PANEL_ID}" class="rounded-3xl border border-red-100 bg-red-50 p-5 text-xs text-red-700">Under Construction gagal dimuat: ${safeMessage}</section>`;
    } finally {
      renderInFlight = false;
    }
  }

  function reconcile() {
    const container = findNavigationContainer();
    const menu = document.getElementById(MENU_ID);

    if (container !== lastNavigationContainer || !menu?.isConnected) {
      ensureMenu();
    }

    cleanFooterWhitespace();
  }

  function boot() {
    reconcile();
    if (observer) return;

    observer = new MutationObserver(() => {
      // Clock updates and unrelated text mutations can fire this observer.
      // Reconcile only when the navigation/menu identity actually changed.
      const container = findNavigationContainer();
      const menu = document.getElementById(MENU_ID);
      if (container !== lastNavigationContainer || !menu?.isConnected) reconcile();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();