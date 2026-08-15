(() => {
  'use strict';

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
  const PORTFOLIO_TYPES = ['youtube', 'drive', 'tiktok', 'instagram'];

  function isKamar() {
    return (location.pathname || '/').replace(/\/+$/, '') === '/kamar';
  }

  function isDapur() {
    return /^\/dapur(?:\/|$)/i.test((location.pathname || '/').replace(/\/+$/, '') || '/');
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

  function renderKamarEntry() {
    if (!isKamar()) return;
    const host = document.getElementById(PLACEHOLDER_ID);
    if (!host) return;
    host.classList.remove('hidden');
    if (document.getElementById(CARD_ID)) return;
    host.innerHTML = `
      <div id="${CARD_ID}" class="card-3d p-4 sm:p-5 rounded-2xl mb-6 bg-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0"><i class="fa-solid fa-kitchen-set text-[#151c75]"></i></div>
          <div class="min-w-0"><div class="text-xs font-extrabold text-[#151c75]">Dapur Creator ✨</div><div class="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">Kelola Foyer, Menu, Hidangan, dan Ambalan dari satu ruang kerja.</div></div>
        </div>
        <button type="button" id="${LEGACY_ID}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0">Buka Dapur</button>
      </div>`;
    document.getElementById(LEGACY_ID)?.addEventListener('click', goDapur, { once: true });
  }

  function providerHostOk(type, url) {
    let host = '';
    try { host = new URL(String(url || '').trim()).hostname.toLowerCase(); } catch (_) { return false; }
    if (type === 'youtube') return /(^|\.)youtube\.com$/.test(host) || host === 'youtu.be';
    if (type === 'drive') return /(^|\.)drive\.google\.com$/.test(host) || /(^|\.)docs\.google\.com$/.test(host);
    if (type === 'tiktok') return /(^|\.)tiktok\.com$/.test(host);
    if (type === 'instagram') return /(^|\.)instagram\.com$/.test(host);
    return false;
  }

  function providerLabel(type) {
    return ({youtube:'YouTube', drive:'Google Drive', tiktok:'TikTok', instagram:'Instagram'})[type] || type;
  }

  function normalizePortfolioForm() {
    if (!isDapur()) return;
    const select = document.getElementById('cp-type');
    if (!select || select.dataset.studihomeMediaLocked === '1') return;
    select.dataset.studihomeMediaLocked = '1';
    const current = String(select.value || '').toLowerCase();
    select.innerHTML = PORTFOLIO_TYPES.map(type => `<option value="${type}" ${current === type ? 'selected' : ''}>${providerLabel(type)}</option>`).join('');
    if (!PORTFOLIO_TYPES.includes(current)) select.value = 'youtube';

    const url = document.getElementById('cp-url');
    if (url) {
      url.placeholder = 'Tautan karya: YouTube / Google Drive / TikTok / Instagram';
      url.setAttribute('inputmode', 'url');
      url.setAttribute('autocomplete', 'url');
    }

    const noteId = 'dapur-portfolio-media-policy';
    if (!document.getElementById(noteId) && url) {
      const note = document.createElement('div');
      note.id = noteId;
      note.className = 'mt-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[9px] text-slate-600 leading-relaxed';
      note.innerHTML = '<b class="text-[#151c75]">Aturan Ambalan:</b> gunakan tautan resmi YouTube, Google Drive, TikTok, atau Instagram. File video/gambar langsung tidak diunggah ke server.';
      url.insertAdjacentElement('afterend', note);
    }
  }

  function hardenPortfolioSave() {
    if (!window.App?.creatorStudio || window.App.creatorStudio.__dapurPortfolioLocked) return;
    if (typeof window.App.creatorStudio.savePortfolio !== 'function') return;
    const original = window.App.creatorStudio.savePortfolio.bind(window.App.creatorStudio);
    window.App.creatorStudio.savePortfolio = async function(id = '') {
      const type = String(document.getElementById('cp-type')?.value || '').toLowerCase();
      const url = String(document.getElementById('cp-url')?.value || '').trim();
      if (!PORTFOLIO_TYPES.includes(type)) {
        window.App.ui?.toast?.('Pilih salah satu sumber: YouTube, Google Drive, TikTok, atau Instagram.', 'error');
        return;
      }
      if (!/^https:\/\//i.test(url) || !providerHostOk(type, url)) {
        window.App.ui?.toast?.(`Tautan ${providerLabel(type)} belum valid. Tempel URL resmi dari platform tersebut.`, 'error');
        return;
      }
      return original(id);
    };
    window.App.creatorStudio.__dapurPortfolioLocked = true;
  }

  function patchPortfolioUI() {
    if (!isDapur()) return;
    normalizePortfolioForm();
    hardenPortfolioSave();
  }

  function tick() {
    renderKamarEntry();
    patchPortfolioUI();
  }

  window.addEventListener('popstate', tick);
  window.addEventListener('hashchange', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once: true });
  else tick();

  let attempts = 0;
  const retry = setInterval(() => {
    tick();
    attempts += 1;
    if (attempts >= 60) clearInterval(retry);
  }, 500);
})();
