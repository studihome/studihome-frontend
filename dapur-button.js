(() => {
  'use strict';
  const ID = 'studihome-dapur-entry';

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
    const existing = document.getElementById(ID);
    if (!isKamar()) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const host = document.querySelector('main') || document.querySelector('#app') || document.body;
    if (!host) return;

    const card = document.createElement('section');
    card.id = ID;
    card.className = 'card-3d';
    card.style.cssText = 'margin:0 1rem 1.25rem; padding:1rem; border-radius:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; background:#fff; border:1px solid #fde68a; box-shadow:0 10px 25px -5px rgba(21,28,117,.07);';
    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:.75rem;min-width:0">
        <div style="width:2.5rem;height:2.5rem;border-radius:.9rem;background:#fffbeb;display:flex;align-items:center;justify-content:center;flex:none;color:#d97706">
          <i class="fa-solid fa-kitchen-set"></i>
        </div>
        <div style="min-width:0">
          <div style="font-size:.78rem;font-weight:800;color:#151c75">Dapur Creator</div>
          <div style="font-size:.7rem;line-height:1.45;color:#64748b;margin-top:.2rem">Kelola Foyer, Menu, Hidangan, dan Ambalan dari satu ruang kerja.</div>
        </div>
      </div>
      <button type="button" id="studihome-open-dapur" style="border:0;border-radius:.75rem;padding:.6rem .85rem;background:linear-gradient(135deg,#151c75,#3f48bf);color:#fff;font-size:.7rem;font-weight:800;white-space:nowrap;cursor:pointer;box-shadow:0 4px 14px rgba(21,28,117,.25)">Buka Dapur</button>`;

    const first = host.firstElementChild;
    if (first) host.insertBefore(card, first);
    else host.appendChild(card);
    card.querySelector('#studihome-open-dapur')?.addEventListener('click', goDapur);
  }

  let lastPath = '';
  function tick() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      render();
    } else if (isKamar()) {
      render();
    }
  }

  window.addEventListener('popstate', tick);
  window.addEventListener('hashchange', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(tick, 750);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once: true });
  else tick();
})();
