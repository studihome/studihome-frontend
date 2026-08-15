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
  const RESERVED = new Set(['','/','/products','/kamar','/admin','/studio-ai','/dapur','/dapur/foyer','/dapur/menu','/dapur/hidangan','/dapur/ambalan','/ruang-kerja','/creator-studio','/dashboard','/ai-video','/ai-automation','/ai-content','/ai-untuk-guru','/ai-untuk-umkm']);

  function isKamar() { return (location.pathname || '/').replace(/\/+$/, '') === '/kamar'; }
  function isDapur() { return /^\/dapur(?:\/|$)/i.test((location.pathname || '/').replace(/\/+$/, '') || '/'); }
  function isCreatorPath() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    return !RESERVED.has(path) && /^\/[a-z0-9][a-z0-9-]{2,39}(?:\/portfolio\/[a-z0-9][a-z0-9-]{0,120})?$/i.test(path);
  }
  function goDapur() {
    try { if (window.App?.router?.navigate) { window.App.router.navigate('dapur'); return; } } catch (_) {}
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
          <div class="min-w-0"><div class="text-xs font-extrabold text-[#151c75]">Dapur Creator ✨</div><div class="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">Kelola Foyer, Menu, Hidangan, dan Ambalan dari satu ruang pribadi.</div></div>
        </div>
        <button type="button" id="${LEGACY_ID}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0">Buka Dapur</button>
      </div>`;
    document.getElementById(LEGACY_ID)?.addEventListener('click', goDapur, { once: true });
  }

  function autoDetectMedia(url) {
    let u;
    try { u = new URL(String(url || '').trim()); } catch (_) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if ((host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be') && (u.searchParams.get('v') || host === 'youtu.be')) return 'youtube';
    if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host)) return 'drive';
    if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/\.(png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(path)) return 'image';
    if (/\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i.test(path)) return 'video';
    return 'link';
  }

  function normalizePortfolioForm() {
    if (!isDapur()) return;
    const select = document.getElementById('cp-type');
    const url = document.getElementById('cp-url');
    if (!url) return;

    if (select) {
      select.value = autoDetectMedia(url.value) || 'link';
      select.classList.add('hidden');
      select.setAttribute('aria-hidden', 'true');
      select.dataset.studihomeAutoType = '1';
    }

    url.placeholder = 'Tempel tautan foto, video, YouTube, Drive, TikTok, atau Instagram';
    url.setAttribute('inputmode', 'url');
    url.setAttribute('autocomplete', 'url');
    url.oninput = () => {
      const type = autoDetectMedia(url.value) || 'link';
      if (select) select.value = type;
      const hint = document.getElementById('dapur-media-detected');
      if (hint) hint.textContent = `Terdeteksi otomatis: ${({image:'Gambar',video:'Video',youtube:'YouTube',drive:'Google Drive',tiktok:'TikTok',instagram:'Instagram',link:'Tautan'})[type] || 'Tautan'}`;
    };

    let hint = document.getElementById('dapur-media-detected');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'dapur-media-detected';
      hint.className = 'mt-2 text-[9px] font-bold text-[#151c75]';
      url.insertAdjacentElement('afterend', hint);
    }
    hint.textContent = `Terdeteksi otomatis: ${({image:'Gambar',video:'Video',youtube:'YouTube',drive:'Google Drive',tiktok:'TikTok',instagram:'Instagram',link:'Tautan'})[autoDetectMedia(url.value) || 'link'] || 'Tautan'}`;

    const noteId = 'dapur-portfolio-media-policy';
    if (!document.getElementById(noteId)) {
      const note = document.createElement('div');
      note.id = noteId;
      note.className = 'mt-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[9px] text-slate-600 leading-relaxed';
      note.innerHTML = '<b class="text-[#151c75]">Tautan media:</b> cukup tempel URL. Sistem akan mengenali otomatis apakah itu gambar, video, YouTube, Drive, TikTok, Instagram, atau tautan biasa.';
      url.insertAdjacentElement('afterend', note);
    }
  }

  function hardenPortfolioSave() {
    if (!window.App?.creatorStudio || window.App.creatorStudio.__dapurPortfolioAutoLocked) return;
    if (typeof window.App.creatorStudio.savePortfolio !== 'function') return;
    const original = window.App.creatorStudio.savePortfolio.bind(window.App.creatorStudio);
    window.App.creatorStudio.savePortfolio = async function(id = '') {
      const url = String(document.getElementById('cp-url')?.value || '').trim();
      const type = autoDetectMedia(url);
      if (!type) {
        window.App.ui?.toast?.('Tautan media belum valid. Gunakan URL http/https yang benar.', 'error');
        return;
      }
      const select = document.getElementById('cp-type');
      if (select) select.value = type;
      return original(id);
    };
    window.App.creatorStudio.__dapurPortfolioAutoLocked = true;
  }

  function ensurePublicCreatorModule() {
    if (!isCreatorPath()) return;
    if (document.querySelector('script[data-studihome-creator-public]')) return;
    const s = document.createElement('script');
    s.src = '/creator-public.js?v=1';
    s.dataset.studihomeCreatorPublic = '1';
    s.defer = true;
    document.head.appendChild(s);
  }

  function tick() {
    renderKamarEntry();
    normalizePortfolioForm();
    hardenPortfolioSave();
    ensurePublicCreatorModule();
  }

  window.addEventListener('popstate', tick);
  window.addEventListener('hashchange', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once: true }); else tick();
  let attempts = 0;
  const retry = setInterval(() => { tick(); attempts += 1; if (attempts >= 60) clearInterval(retry); }, 500);
})();
