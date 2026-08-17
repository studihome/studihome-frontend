(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/admin') return;

  const VERSION = '5';
  const LAUNCHER_ID = 'studihome-under-construction-menu';
  const OVERLAY_ID = 'studihome-under-construction-overlay';
  const SHARED_ID = `studihome-under-construction-shared-v${VERSION}`;

  let sharedPromise = null;
  let observer = null;
  let reconcileTimer = 0;
  let opening = false;
  let lastContainer = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const connected = el => !!el && el.isConnected === true;
  const text = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function loadShared() {
    if (window.StudihomeUnderConstruction) return Promise.resolve(window.StudihomeUnderConstruction);
    if (sharedPromise) return sharedPromise;

    let script = document.getElementById(SHARED_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SHARED_ID;
      script.src = `/under-construction.js?v=${VERSION}`;
      script.defer = true;
      script.async = false;
      script.onerror = () => console.warn('[Studihome Under Construction] shared module failed to load');
      document.head.appendChild(script);
    }

    sharedPromise = (async () => {
      for (let i = 0; i < 160; i += 1) {
        if (window.StudihomeUnderConstruction) return window.StudihomeUnderConstruction;
        await sleep(50);
      }
      return null;
    })();

    return sharedPromise;
  }

  function scoreContainer(el) {
    if (!(el instanceof HTMLElement)) return -1;
    const controls = el.querySelectorAll('a,button,[role="button"]');
    if (controls.length < 2) return -1;

    const tag = el.tagName.toLowerCase();
    const cls = text(el.className);
    const aria = text(el.getAttribute('aria-label'));
    const content = text(el.innerText || el.textContent);

    let score = Math.min(controls.length, 24) * 0.25;
    if (['aside', 'nav'].includes(tag)) score += 4;
    if (el.matches('[role="navigation"]')) score += 4;
    if (/(sidebar|side-nav|sidenav|navigation|admin-menu|admin-sidebar)/i.test(cls)) score += 8;
    if (/(sidebar|navigation)/i.test(aria)) score += 5;
    if (content.includes('gudang')) score += 10;
    if (content.includes('dashboard')) score += 4;
    if (content.includes('produk')) score += 3;
    if (content.includes('transaksi')) score += 3;
    if (content.includes('pengguna')) score += 3;
    return score;
  }

  function findContainer() {
    const selectors = [
      '#admin-sidebar',
      '.admin-sidebar',
      '[data-admin-sidebar]',
      '[data-sidebar]',
      'aside',
      'nav',
      '[role="navigation"]',
      'div[class*="sidebar" i]',
      'div[class*="navigation" i]'
    ];

    const candidates = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (!candidates.includes(el)) candidates.push(el);
      }
    }

    return candidates
      .map(el => ({ el, score: scoreContainer(el) }))
      .filter(item => item.score >= 0 && connected(item.el))
      .sort((a, b) => b.score - a.score)[0]?.el || null;
  }

  function buttonMarkup() {
    const button = document.createElement('button');
    button.id = LAUNCHER_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Buka Under Construction');
    button.setAttribute('title', 'Under Construction');
    button.innerHTML = `
      <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:#fffbeb;color:#b45309;flex:0 0 auto;">
        <i class="fa-solid fa-person-digging" aria-hidden="true"></i>
      </span>
      <span style="min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:1px;line-height:1.2;">
        <span style="font-size:11px;font-weight:900;white-space:nowrap;">Under Construction</span>
        <span style="font-size:8px;font-weight:600;color:#94a3b8;white-space:nowrap;">Kontrol maintenance</span>
      </span>`;
    button.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:10px',
      'width:100%',
      'min-height:52px',
      'padding:8px 12px',
      'border:1px solid #fde68a',
      'border-radius:14px',
      'background:#fff',
      'color:#475569',
      'cursor:pointer',
      'text-align:left',
      'box-shadow:0 6px 18px rgba(21,28,117,.06)',
      'font:inherit'
    ].join(';');
    button.addEventListener('mouseenter', () => {
      button.style.background = '#fffbeb';
      button.style.borderColor = '#fcd34d';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#fff';
      button.style.borderColor = '#fde68a';
    });
    button.addEventListener('click', () => { void openPanel(); });
    return button;
  }

  function placeLauncher() {
    let launcher = document.getElementById(LAUNCHER_ID);
    const container = findContainer();

    if (!launcher) launcher = buttonMarkup();

    if (container && connected(container)) {
      if (launcher.parentElement !== container) {
        if (connected(launcher)) launcher.remove();
        container.appendChild(launcher);
      }
      launcher.style.position = 'static';
      launcher.style.zIndex = '';
      launcher.dataset.mountMode = 'sidebar';
      lastContainer = container;
      return true;
    }

    if (!connected(launcher)) document.body.appendChild(launcher);
    if (launcher.parentElement !== document.body) {
      launcher.remove();
      document.body.appendChild(launcher);
    }

    launcher.style.position = 'fixed';
    launcher.style.right = '18px';
    launcher.style.bottom = '18px';
    launcher.style.width = 'min(240px, calc(100vw - 36px))';
    launcher.style.zIndex = '2147483000';
    launcher.style.padding = '10px 12px';
    launcher.style.borderRadius = '16px';
    launcher.dataset.mountMode = 'floating-fallback';
    lastContainer = null;
    return true;
  }

  function cleanupTrailingFooterText() {
    const footer = document.querySelector('footer');
    if (!connected(footer) || !footer.parentNode) return;

    let node = footer.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (node.nodeType === Node.TEXT_NODE && /^[\s\\n\\r\\t]+$/.test(node.nodeValue || '')) {
        node.remove();
      }
      node = next;
    }
  }

  function getTargetArea() {
    const ids = ['admin-content-area', 'main-content', 'content-area', 'admin-main'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (connected(el)) return el;
    }
    for (const selector of ['main', '[role="main"]', '.admin-content', '.main-content']) {
      const el = document.querySelector(selector);
      if (connected(el)) return el;
    }
    return null;
  }

  function closePanel() {
    document.getElementById(OVERLAY_ID)?.remove();
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147482999',
      'display:flex',
      'align-items:flex-start',
      'justify-content:center',
      'padding:24px',
      'background:rgba(2,6,23,.58)',
      'backdrop-filter:blur(6px)',
      'overflow:auto'
    ].join(';');

    const sheet = document.createElement('section');
    sheet.style.cssText = [
      'width:min(1080px,100%)',
      'margin:auto',
      'background:#f8fbff',
      'border:1px solid #dbe7ff',
      'border-radius:28px',
      'box-shadow:0 30px 90px rgba(2,6,23,.26)',
      'overflow:hidden'
    ].join(';');

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:linear-gradient(135deg,#151c75,#3f48bf);color:#fff;';
    head.innerHTML = '<div><div style="font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">SITE CONTROL</div><div style="font-size:18px;font-weight:900;margin-top:3px;">Under Construction</div></div>';

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Tutup');
    close.textContent = '×';
    close.style.cssText = 'width:36px;height:36px;border:0;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font-size:24px;line-height:1;cursor:pointer;';
    close.addEventListener('click', closePanel);
    head.appendChild(close);

    const body = document.createElement('div');
    body.id = `${OVERLAY_ID}-body`;
    body.style.cssText = 'padding:18px;min-height:180px;background:#f8fbff;';
    body.innerHTML = '<div style="padding:48px 20px;text-align:center;font-size:12px;color:#64748b;">Memuat pengaturan…</div>';

    sheet.append(head, body);
    overlay.appendChild(sheet);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closePanel();
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  async function openPanel() {
    if (opening) return;
    opening = true;

    try {
      const api = await loadShared();
      if (!api?.renderAdmin) throw new Error('Modul Under Construction belum siap.');

      const target = ensureOverlay().querySelector(`#${OVERLAY_ID}-body`);
      if (!target) throw new Error('Panel Under Construction tidak dapat dibuat.');

      await api.renderAdmin(target);
    } catch (error) {
      const target = document.querySelector(`#${OVERLAY_ID}-body`);
      if (target) {
        const message = String(error?.message || 'Kesalahan tidak diketahui').replace(/[<>]/g, '');
        target.innerHTML = `<div style="padding:28px;border:1px solid #fecaca;border-radius:18px;background:#fff1f2;color:#b91c1c;font-size:12px;">Under Construction gagal dimuat: ${message}</div>`;
      }
      console.warn('[Studihome Under Construction]', error?.message || error);
    } finally {
      opening = false;
    }
  }

  function reconcile() {
    const container = findContainer();
    const launcher = document.getElementById(LAUNCHER_ID);
    const launcherAlive = connected(launcher);

    if (!launcherAlive || lastContainer !== container || launcher?.dataset.mountMode === 'floating-fallback' && container) {
      placeLauncher();
    }

    cleanupTrailingFooterText();
  }

  function scheduleReconcile() {
    clearTimeout(reconcileTimer);
    reconcileTimer = window.setTimeout(() => {
      reconcileTimer = 0;
      reconcile();
    }, 80);
  }

  function boot() {
    reconcile();
    if (observer) return;

    observer = new MutationObserver(() => {
      const launcher = document.getElementById(LAUNCHER_ID);
      const container = findContainer();
      if (!connected(launcher) || launcher.parentElement !== container && container || lastContainer !== container) {
        scheduleReconcile();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();