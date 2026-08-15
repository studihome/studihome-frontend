(() => {
  'use strict';

  const path = () => (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const isDapur = () => /^\/dapur(?:\/|$)/i.test(path());
  const isKamar = () => path() === '/kamar';
  const RESERVED = new Set(['', '/', '/products', '/kamar', '/dashboard', '/admin', '/studio-ai', '/dapur', '/dapur/foyer', '/dapur/menu', '/dapur/hidangan', '/dapur/ambalan', '/ruang-kerja', '/creator-studio']);

  if (window.App?.utils && typeof window.App.utils.escapeHtml !== 'function') {
    window.App.utils.escapeHtml = (value) => {
      const el = document.createElement('textarea');
      el.textContent = String(value ?? '');
      return el.innerHTML;
    };
  }

  function isPublicCreatorPath() {
    const current = path();
    return !RESERVED.has(current) && /^\/[a-z0-9][a-z0-9-]{2,39}(?:\/portfolio\/[a-z0-9][a-z0-9-]{0,120})?$/i.test(current);
  }

  function loadRuntime() {
    if (window.StudihomeDapurRuntimeV4) return Promise.resolve();
    const existing = document.querySelector('script[data-studihome-dapur-runtime-v4]');
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Runtime Dapur gagal dimuat.')), { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/dapur-runtime-v4.js?v=1`;
      script.defer = true;
      script.dataset.studihomeDapurRuntimeV4 = '1';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Runtime Dapur gagal dimuat.'));
      document.head.appendChild(script);
    });
  }

  function installRouterGuard() {
    const router = window.App?.router;
    if (!router || router.__dapurRuntimeV4Guard) return false;

    const originalHandlePath = router.handlePath?.bind(router);
    if (typeof originalHandlePath !== 'function') return false;

    router.handlePath = function (...args) {
      const current = path();
      if (window.StudihomeDapurRuntimeV4 && window.StudihomeDapurRuntimeV4.isDapurPath?.()) {
        window.App.state.routeType = 'dapur';
        window.App.state.routePath = current;
        window.App.state.dapurSection = '';
        window.App.ui?.renderNavigation?.();
        void window.StudihomeDapurRuntimeV4.boot();
        return true;
      }
      return originalHandlePath(...args);
    };

    router.__dapurRuntimeV4Guard = true;
    return true;
  }

  function renderKamarEntry() {
    if (!isKamar()) return;
    const host = document.getElementById('kamar-creator-entry');
    if (!host || document.getElementById('studihome-dapur-entry-v4')) return;
    host.classList.remove('hidden');
    host.innerHTML = `
      <div id="studihome-dapur-entry-v4" class="card-3d p-4 sm:p-5 rounded-2xl mb-6 bg-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0"><div class="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0"><i class="fa-solid fa-kitchen-set text-[#151c75]"></i></div><div class="min-w-0"><div class="text-xs font-extrabold text-[#151c75]">Program Creator ✨</div><div class="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">Bangun identitas Creator dan kelola Dapur dari alamat pribadi.</div></div></div>
        <a href="/dapur" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0">Buka Program</a>
      </div>`;
  }

  async function boot() {
    try {
      await loadRuntime();
      installRouterGuard();
      if (isDapur()) {
        window.App?.ui?.renderNavigation?.();
        void window.StudihomeDapurRuntimeV4?.boot?.();
      }
      renderKamarEntry();
    } catch (error) {
      console.error('[Dapur Runtime Loader]', error);
    }
  }

  const guardTimer = window.setInterval(() => {
    if (installRouterGuard()) window.clearInterval(guardTimer);
  }, 100);
  window.setTimeout(() => window.clearInterval(guardTimer), 12000);

  window.addEventListener('popstate', boot, { passive: true });
  window.addEventListener('hashchange', boot, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();
})();
