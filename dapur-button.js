(() => {
  'use strict';

  // Runtime guard: Dapur can render through the SPA router before the main
  // App bootstrap has finished constructing App.utils. Never let an optional
  // utility race break the entire workspace render loop.
  window.App = window.App || {};
  window.App.utils = window.App.utils || {};
  if (typeof window.App.utils.escapeHtml !== 'function') {
    window.App.utils.escapeHtml = (value) => {
      const text = String(value ?? '');
      const node = document.createElement('textarea');
      node.textContent = text;
      return node.innerHTML;
    };
  }

  const PLACEHOLDER_ID = 'kamar-creator-entry';
  const CARD_ID = 'studihome-dapur-entry';
  const LEGACY_ID = 'studihome-open-dapur';

  function isKamar() {
    return (location.pathname || '/').replace(/\/+$/, '') === '/kamar';
  }

  function goDapur() {
    try {
      if (window.App?.router?.navigate) {
        window.App.router.navigate('dapur');
        return;
      }
    } catch (_) {}
    location.href = '/dapur';
  }

  function render() {
    if (!isKamar()) return;

    const host = document.getElementById(PLACEHOLDER_ID);
    if (!host) return;

    host.classList.remove('hidden');

    if (document.getElementById(CARD_ID)) return;

    host.innerHTML = `
      <div id="${CARD_ID}" class="card-3d p-4 sm:p-5 rounded-2xl mb-6 bg-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-kitchen-set text-[#151c75]"></i>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-extrabold text-[#151c75]">Dapur Creator ✨</div>
            <div class="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">Kelola Foyer, Menu, Hidangan, dan Ambalan dari satu ruang kerja.</div>
          </div>
        </div>
        <button type="button" id="${LEGACY_ID}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0">Buka Dapur</button>
      </div>`;

    document.getElementById(LEGACY_ID)?.addEventListener('click', goDapur, { once: true });
  }

  function tick() {
    if (!isKamar()) return;
    render();
  }

  window.addEventListener('popstate', tick);
  window.addEventListener('hashchange', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick, { once: true });
  } else {
    tick();
  }

  // Kamar is rendered asynchronously; keep a lightweight retry window for the router render.
  let attempts = 0;
  const retry = setInterval(() => {
    tick();
    attempts += 1;
    if (attempts >= 40) clearInterval(retry);
  }, 500);
})();
