(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (!(PATH === '/studio-ai' || PATH.startsWith('/studio-ai/'))) return;
  if (window.__STUDIO_AI_SEARCH_V1__) return;
  window.__STUDIO_AI_SEARCH_V1__ = true;

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const escape = value => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(value) : String(value || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; };

  const css = document.createElement('style');
  css.id = 'studio-ai-search-v1-style';
  css.textContent = `
    .studio-ai-search-wrap { border-radius:999px!important; border:2px solid #eab308!important; background:rgba(255,255,255,.98)!important; box-shadow:0 8px 26px rgba(234,179,8,.12); transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease; }
    .studio-ai-search-wrap:focus-within { border-color:#f59e0b!important; box-shadow:0 0 0 4px rgba(234,179,8,.13),0 14px 32px rgba(234,179,8,.15); transform:translateY(-1px); }
    .studio-ai-search-wrap .studio-ai-search { min-height:44px; font-size:16px!important; line-height:1.45!important; border-radius:999px!important; }
    .studio-ai-search-wrap button { min-height:42px; border-radius:999px!important; position:relative; overflow:hidden; }
    .studio-ai-search-wrap button::after { content:''; position:absolute; inset:0; background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.42) 50%,transparent 75%); transform:translateX(-120%); animation:studioSearchSweep 3.4s ease-in-out infinite; pointer-events:none; }
    .studio-ai-search-wrap .studio-search-magic { animation:studioSearchMagic 1.8s ease-in-out infinite; }
    @keyframes studioSearchSweep { 0%,55%{transform:translateX(-120%)} 75%,100%{transform:translateX(120%)} }
    @keyframes studioSearchMagic { 0%,100%{transform:rotate(-5deg) scale(1)} 50%{transform:rotate(7deg) scale(1.12)} }
    .studio-ai-hero-search-note { margin-top:.65rem; font-size:.78rem; line-height:1.45; color:rgba(219,234,254,.92); }
    .studio-ai-hero-search-note strong { color:#facc15; }
    .studio-search-results-enter { animation:studioSearchResultsIn .45s cubic-bezier(.2,.75,.25,1) both; scroll-margin-top:1rem; }
    @keyframes studioSearchResultsIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    .studio-search-result-card { transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease; }
    .studio-search-result-card:hover { transform:translateY(-2px); box-shadow:0 16px 32px rgba(21,28,117,.11); border-color:#c7d8ff; }
    .studio-search-score { font-variant-numeric:tabular-nums; }
    @media(max-width:640px){ .studio-ai-search-wrap .studio-ai-search{font-size:16px!important}.studio-ai-search-wrap button{min-height:40px} }
    @media(prefers-reduced-motion:reduce){.studio-ai-search-wrap,.studio-ai-search-wrap button::after,.studio-ai-search-wrap .studio-search-magic,.studio-search-results-enter,.studio-search-result-card{animation:none!important;transition:none!important;transform:none!important} }
  `;
  document.head.appendChild(css);

  function removeLegacyBriefUI() {
    document.getElementById('studio-smart-brief-modal')?.remove();
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      const label = normalize(el.textContent);
      if (label === 'ceritakan kebutuhanmu') el.remove();
    });
    const smart = window.App?.studioAI;
    if (smart) {
      // The old popup is intentionally no longer an executable discovery path.
      smart.openSmartBrief = undefined;
      smart.submitSmartBrief = undefined;
      smart.closeSmartBrief = undefined;
    }
  }

  function findHeroSearch() {
    const input = document.getElementById('studio-ai-search-input');
    return input && visible(input) ? input : null;
  }

  function ensureMagicButton(input) {
    const wrap = input?.closest('.studio-ai-search-wrap');
    const button = wrap?.querySelector('button');
    if (!wrap || !button) return null;
    wrap.classList.add('studio-ai-search-wrap');
    if (!button.querySelector('.studio-search-magic')) {
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-wand-magic-sparkles studio-search-magic mr-1.5';
      icon.setAttribute('aria-hidden', 'true');
      button.prepend(icon);
    }
    button.innerHTML = button.innerHTML.replace(/^\s*Cari\s*$/i, '<i class="fa-solid fa-wand-magic-sparkles studio-search-magic mr-1.5" aria-hidden="true"></i>Cari');
    button.setAttribute('aria-label', 'Cari Creator dengan keyword');
    return button;
  }

  function ensureSearchHint(input) {
    const hero = input?.closest('.studio-ai-hero');
    if (!hero || hero.querySelector('.studio-ai-hero-search-note')) return;
    const note = document.createElement('div');
    note.className = 'studio-ai-hero-search-note';
    note.innerHTML = '<strong>Tips:</strong> ketik apa saja yang kamu cari — misalnya <b>video</b>, <b>website</b>, <b>otomasi WhatsApp</b>, atau <b>AI untuk guru</b>.';
    input.closest('.studio-ai-search-wrap')?.insertAdjacentElement('afterend', note);
  }

  function notice(message, type = 'info') {
    if (window.App?.ui?.toast) window.App.ui.toast(message, type);
  }

  function smartRank(query) {
    const data = window.App?.state?.studioAI;
    const creators = Array.isArray(data?.creators) ? data.creators : [];
    const smart = window.App?.studioAI;
    if (!smart || typeof smart._smartScoreCreator !== 'function') return [];

    const q = String(query || '').trim();
    const rows = creators.map(c => {
      try {
        const score = smart._smartScoreCreator(c, q);
        return { c, ...score };
      } catch (_) {
        return null;
      }
    }).filter(Boolean);

    rows.sort((a,b) => Number(b.percentage || 0) - Number(a.percentage || 0) || Number(b.confidence || 0) - Number(a.confidence || 0) || String(a.c.display_name || '').localeCompare(String(b.c.display_name || '')));
    return rows;
  }

  function renderSearchResults(query) {
    const creatorSec = document.getElementById('studio-ai-creator-section');
    const grid = document.getElementById('studio-ai-creator-grid');
    const catSec = document.getElementById('studio-ai-category-section');
    if (!creatorSec || !grid) return false;

    const rows = smartRank(query);
    const relevant = rows.filter(row => Number(row.percentage || 0) >= 48);
    const top = relevant.length ? relevant : rows.slice(0, 0);

    if (!top.length) {
      creatorSec.classList.add('hidden');
      notice(`Belum ketemu Creator yang cukup nyambung untuk “${query}” 😄 Coba tambahkan sedikit konteks, misalnya jenis hasil yang kamu mau atau platformnya.`, 'info');
      return false;
    }

    if (catSec) catSec.classList.add('hidden');
    creatorSec.classList.remove('hidden', 'studio-search-results-enter');
    void creatorSec.offsetWidth;
    creatorSec.classList.add('studio-search-results-enter');

    const title = document.getElementById('studio-ai-results-title');
    if (title) title.textContent = `Hasil untuk “${query}”`;

    grid.innerHTML = top.map((row, index) => {
      const c = row.c;
      const services = Array.isArray(c.services) ? c.services : [];
      const service = services[0];
      const initials = String(c.display_name || c.username || 'C').trim().charAt(0).toUpperCase();
      const meter = Math.max(0, Math.min(100, Number(row.percentage || 0)));
      const wa = typeof window.App?.creator?._waUrl === 'function' ? window.App.creator._waUrl(c.whatsapp, c.display_name || 'Creator') : '';
      const reason = row.reason || 'Profil dan jasanya memiliki kecocokan dengan keyword yang kamu masukkan.';
      return `
        <article class="studio-search-result-card card-3d rounded-3xl overflow-hidden bg-white border border-blue-100">
          <div class="h-28 bg-gradient-to-br from-[#151c75] to-[#3f48bf] relative overflow-hidden">
            ${c.cover_url ? `<img src="${escape(c.cover_url)}" alt="" class="w-full h-full object-cover opacity-50" loading="lazy" decoding="async">` : ''}
            <div class="absolute inset-0 bg-gradient-to-t from-[#151c75]/90 to-transparent"></div>
            <div class="absolute left-4 bottom-3 flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-white text-[#151c75] flex items-center justify-center font-black overflow-hidden shadow-lg border border-blue-100">
                ${c.avatar_url ? `<img src="${escape(c.avatar_url)}" alt="${escape(c.display_name || c.username)}" class="w-full h-full object-cover" loading="lazy">` : initials}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-extrabold text-white truncate flex items-center gap-1">${escape(c.display_name || c.username)}${c.is_verified ? '<i class="fa-solid fa-circle-check text-amber-300 text-[10px]"></i>' : ''}</div>
                <div class="text-[10px] text-blue-100">@${escape(c.username)}</div>
              </div>
            </div>
          </div>
          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap gap-1.5">${services.slice(0,2).map(s => `<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-extrabold">${escape(s.title)}</span>`).join('')}</div>
              </div>
              <div class="text-right shrink-0"><div class="studio-search-score text-[11px] font-black text-amber-600">${meter}% cocok</div><div class="text-[8px] font-bold text-slate-400 mt-0.5">SMART match</div></div>
            </div>
            <div class="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden"><span class="block h-full rounded-full bg-gradient-to-r from-[#151c75] to-[#f59e0b]" style="width:${meter}%"></span></div>
            <div class="mt-3 rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-2.5"><div class="text-[9px] font-black uppercase tracking-wide text-[#151c75] mb-1">Kenapa muncul?</div><div class="text-[10px] leading-relaxed font-semibold text-slate-600">${escape(reason)}</div></div>
            ${service ? `<div class="mt-3 text-[10px] font-bold text-slate-500">Mulai Rp ${Number(service.price_from || 0).toLocaleString('id-ID')} · ${escape(service.title)}</div>` : ''}
            <div class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button type="button" onclick="App.router.goCreator('${escape(c.username)}')" class="px-3 py-2 rounded-xl text-[10px] font-extrabold text-[#151c75] bg-blue-50 hover:bg-blue-100">Lihat Profil</button>
              ${wa ? `<a href="${wa}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 rounded-xl text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700"><i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp</a>` : ''}
            </div>
          </div>
        </article>`;
    }).join('');

    const loadMore = document.getElementById('studio-ai-load-more-wrap');
    if (loadMore) loadMore.classList.add('hidden');
    setTimeout(() => creatorSec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return true;
  }

  function runHeroSearch() {
    const input = findHeroSearch();
    if (!input) return false;
    const query = String(input.value || '').trim();
    if (query.length < 2) {
      notice('Ketik sedikit dulu ya 😄 Misalnya “video”, “website”, “otomasi WhatsApp”, atau “AI untuk guru”.', 'info');
      input.focus();
      return false;
    }

    const data = window.App?.state?.studioAI;
    if (!data?.creators) {
      notice('Data Creator masih disiapkan. Tunggu sebentar ya, lalu tekan Cari lagi. 😊', 'info');
      return false;
    }

    const button = ensureMagicButton(input);
    if (button) { button.disabled = true; button.setAttribute('aria-busy','true'); }
    try {
      window.App.studioAI._query = query;
      return renderSearchResults(query);
    } finally {
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  }

  function bindHeroSearch() {
    const input = findHeroSearch();
    if (!input || input.dataset.studioSearchBound === '1') return false;
    const button = ensureMagicButton(input);
    ensureSearchHint(input);

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        runHeroSearch();
      }
    }, true);
    button?.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      runHeroSearch();
    }, true);
    input.dataset.studioSearchBound = '1';
    return true;
  }

  function installActivity() {
    const hero = document.querySelector('.studio-ai-hero');
    const controls = hero ? [...hero.querySelectorAll('button')].filter(visible) : [];
    if (!hero || controls.length < 1) return false;
    let activity = document.getElementById('studio-live-activity');
    if (!activity) {
      activity = document.createElement('div');
      activity.id = 'studio-live-activity';
      activity.className = 'studio-live-activity';
      activity.style.cssText = 'display:flex;align-items:center;justify-content:flex-start;gap:1.25rem;flex-wrap:wrap;margin:.75rem 0 0;color:rgba(255,255,255,.86);font-size:.76rem;';
      activity.innerHTML = '<span>● Creator Aktif <strong id="studio-live-creators">29</strong></span><span>● Pengunjung <strong id="studio-live-visitors">157</strong></span>';
      const anchor = controls[controls.length - 1];
      anchor.insertAdjacentElement('afterend', activity);
    }
    if (activity.dataset.bound === '1') return true;
    const state = { creators:29, visitors:157 };
    const profile = () => { const h = new Date().getHours(); if (h < 5) return {c:25,v:120}; if (h < 9) return {c:39,v:190}; if (h < 15) return {c:53,v:270}; if (h < 19) return {c:60,v:335}; if (h < 23) return {c:52,v:300}; return {c:35,v:185}; };
    const tick = key => { const p=profile(); const min=key==='creators'?23:89; const max=key==='creators'?76:387; const target=key==='creators'?p.c:p.v; const dir=target===state[key]?0:(target>state[key]?1:-1); const step=dir*(1+Math.floor(Math.random()*3)); state[key]=Math.max(min,Math.min(max,state[key]+step)); const el=document.getElementById(key==='creators'?'studio-live-creators':'studio-live-visitors'); if(el) el.textContent=String(state[key]); };
    const schedule = key => setTimeout(() => { tick(key); schedule(key); }, 3000 + Math.floor(Math.random()*7001));
    schedule('creators'); schedule('visitors'); activity.dataset.bound='1'; return true;
  }

  function install() {
    removeLegacyBriefUI();
    bindHeroSearch();
    installActivity();
  }

  install();
  let tries = 0;
  const timer = setInterval(() => { tries++; install(); if (tries >= 120) clearInterval(timer); }, 150);
  const observer = new MutationObserver(() => install());
  if (document.body) observer.observe(document.body, { childList:true, subtree:true });
})();
