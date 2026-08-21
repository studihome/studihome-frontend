(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (!(PATH === '/studio-ai' || PATH.startsWith('/studio-ai/'))) return;
  if (window.__STUDIO_AI_PRODUCTION_ENHANCEMENTS__) return;
  window.__STUDIO_AI_PRODUCTION_ENHANCEMENTS__ = true;

  const esc = value => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(value)
    : String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; };

  function getCreators() {
    const rows = window.App?.state?.studioAI?.creators;
    return Array.isArray(rows) ? rows : [];
  }

  function getCategories() {
    const rows = getCreators();
    const map = new Map();
    rows.forEach(c => {
      const cats = Array.isArray(c.categories) ? c.categories : [];
      cats.forEach(cat => {
        const key = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.label || '');
        if (!key) return;
        const id = String(key).trim();
        map.set(id, (map.get(id) || 0) + 1);
      });
    });
    return [...map.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
  }

  function portfolioForCreator(c) {
    const direct = Array.isArray(c?.portfolios) ? c.portfolios : [];
    if (direct.length) return direct;
    const state = window.App?.state?.studioAI;
    const map = state?.portfoliosByCreator;
    if (map && typeof map === 'object') return Array.isArray(map[c.id]) ? map[c.id] : [];
    return [];
  }

  function portfolioCard(p, category) {
    const type = String(p.media_type || '').toLowerCase();
    const url = String(p.media_url || '').trim();
    const isImage = type === 'image' || /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i.test(url);
    const safeUrl = esc(url);
    const title = esc(p.title || 'Portofolio Creator');
    const desc = esc(p.description || 'Karya pilihan Creator.');
    return `<article class="studio-creator-portfolio-card">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="block" aria-label="${title}">
        <div class="studio-creator-portfolio-media">
          ${isImage ? `<img src="${safeUrl}" alt="${title}" loading="lazy" decoding="async">` : `<div class="studio-creator-portfolio-link"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></div>`}
          <span class="studio-creator-portfolio-category">${esc(category || 'Karya')}</span>
        </div>
        <div class="studio-creator-portfolio-body"><h4>${title}</h4><p>${desc}</p></div>
      </a>
    </article>`;
  }

  function creatorCard(c, activeCategory) {
    const cats = Array.isArray(c.categories) ? c.categories.map(x => typeof x === 'string' ? x : (x?.name || x?.title || '')).filter(Boolean) : [];
    if (activeCategory && !cats.includes(activeCategory)) return '';
    const portfolios = portfolioForCreator(c);
    const firstCategory = cats[0] || activeCategory || 'Creator';
    const services = Array.isArray(c.services) ? c.services : [];
    const initials = String(c.display_name || c.username || 'C').trim().charAt(0).toUpperCase();
    const wa = typeof window.App?.creator?._waUrl === 'function' ? window.App.creator._waUrl(c.whatsapp, c.display_name || 'Creator') : '';
    return `<article class="studio-creator-card-premium" data-creator-id="${esc(c.id || '')}">
      <div class="studio-creator-card-head">
        <div class="studio-creator-avatar">${c.avatar_url ? `<img src="${esc(c.avatar_url)}" alt="${esc(c.display_name || c.username)}" loading="lazy" decoding="async">` : initials}</div>
        <div class="min-w-0 flex-1"><h3>${esc(c.display_name || c.username || 'Creator')}${c.is_verified ? ' <i class="fa-solid fa-circle-check text-amber-400" aria-label="Terverifikasi"></i>' : ''}</h3><div class="studio-creator-handle">@${esc(c.username || '')}</div></div>
        ${c.is_published === false ? '<span class="studio-creator-state">Draft</span>' : '<span class="studio-creator-state">Aktif</span>'}
      </div>
      <p class="studio-creator-bio">${esc(c.bio || 'Creator profesional di Studihome.')}</p>
      <div class="studio-creator-categories">${cats.slice(0,4).map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="studio-creator-services">${services.slice(0,2).map(s => `<span>${esc(s.title)}</span>`).join('')}</div>
      ${portfolios.length ? `<div class="studio-creator-portfolio-grid">${portfolios.slice(0,3).map(p => portfolioCard(p, firstCategory)).join('')}</div>` : `<div class="studio-creator-no-portfolio">Portofolio belum tersedia.</div>`}
      <div class="studio-creator-actions"><button type="button" data-creator-open="${esc(c.username || '')}">Lihat Profil</button>${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}</div>
    </article>`;
  }

  function installCss() {
    if (document.getElementById('studio-ai-production-enhancements-style')) return;
    const s = document.createElement('style');
    s.id = 'studio-ai-production-enhancements-style';
    s.textContent = `
      .studio-ai-control-row{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap;margin:.9rem 0 1rem}
      .studio-ai-control-row .studio-ai-control{appearance:none;border:1px solid #dbeafe;background:#fff;color:#151c75;border-radius:999px;padding:.58rem .9rem;font-size:.72rem;font-weight:800;cursor:pointer;transition:.18s ease}
      .studio-ai-control-row .studio-ai-control:hover,.studio-ai-control-row .studio-ai-control.active{background:#151c75;color:#fff;border-color:#151c75;box-shadow:0 8px 18px rgba(21,28,117,.12)}
      .studio-ai-stats-row{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin:.25rem 0 1rem;color:#64748b;font-size:.72rem;font-weight:700}
      .studio-ai-stats-row strong{color:#151c75;font-weight:900}
      .studio-creator-card-premium{background:#fff;border:1px solid #dbe5f4;border-radius:26px;padding:18px;box-shadow:0 12px 30px rgba(21,28,117,.07);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
      .studio-creator-card-premium:hover{transform:translateY(-3px);box-shadow:0 20px 40px rgba(21,28,117,.12);border-color:#c7d8ff}
      .studio-creator-card-head{display:flex;align-items:center;gap:11px}
      .studio-creator-avatar{width:52px;height:52px;border-radius:17px;background:#eef4ff;color:#151c75;display:grid;place-items:center;font-weight:900;overflow:hidden;flex:none}
      .studio-creator-avatar img{width:100%;height:100%;object-fit:cover}
      .studio-creator-card-head h3{margin:0;color:#151c75;font-size:14px;font-weight:900}
      .studio-creator-handle{margin-top:2px;color:#94a3b8;font-size:10px;font-weight:700}
      .studio-creator-state{margin-left:auto;padding:5px 8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:9px;font-weight:900}
      .studio-creator-bio{margin:12px 0 0;color:#64748b;font-size:11px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .studio-creator-categories,.studio-creator-services{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}
      .studio-creator-categories span{padding:5px 8px;border-radius:9px;background:#eef4ff;color:#151c75;font-size:9px;font-weight:800}
      .studio-creator-services span{padding:5px 8px;border-radius:9px;background:#f8fafc;color:#64748b;font-size:9px;font-weight:800}
      .studio-creator-portfolio-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}
      .studio-creator-portfolio-card{overflow:hidden;border-radius:13px;border:1px solid #e8eef7;background:#f8fafc}
      .studio-creator-portfolio-media{position:relative;aspect-ratio:16/10;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#eef2ff,#f8fafc)}
      .studio-creator-portfolio-media img{width:100%;height:100%;object-fit:cover}
      .studio-creator-portfolio-link{color:#151c75;font-size:18px}
      .studio-creator-portfolio-category{position:absolute;left:5px;top:5px;padding:3px 6px;border-radius:999px;background:rgba(255,255,255,.92);color:#151c75;font-size:7px;font-weight:900}
      .studio-creator-portfolio-body{padding:7px}.studio-creator-portfolio-body h4{margin:0;color:#151c75;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.studio-creator-portfolio-body p{margin:3px 0 0;color:#94a3b8;font-size:8px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .studio-creator-no-portfolio{margin-top:13px;padding:11px;border-radius:13px;background:#f8fafc;color:#94a3b8;text-align:center;font-size:9px;font-weight:700}
      .studio-creator-actions{display:flex;gap:7px;margin-top:14px;padding-top:12px;border-top:1px solid #eef2f7}.studio-creator-actions button,.studio-creator-actions a{display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border-radius:10px;background:#eef4ff;color:#151c75;font-size:9px;font-weight:900;text-decoration:none;border:0;cursor:pointer}.studio-creator-actions a{background:#059669;color:#fff}
      @media(max-width:720px){.studio-creator-portfolio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.studio-ai-stats-row{gap:.7rem}.studio-ai-control-row{gap:.45rem}}
      @media(max-width:460px){.studio-creator-portfolio-grid{grid-template-columns:1fr}.studio-creator-card-premium{padding:15px;border-radius:22px}}
      @media(prefers-reduced-motion:reduce){.studio-creator-card-premium,.studio-ai-control-row .studio-ai-control{transition:none!important}}
    `;
    document.head.appendChild(s);
  }

  function ensurePortfolioData() {
    const state = window.App?.state?.studioAI;
    if (!state || state.__portfolioHydrationStarted) return;
    state.__portfolioHydrationStarted = true;
    const db = window.supabaseClient || window.App?.supabase || window.App?.db;
    if (!db?.from) return;
    db.from('creator_portfolios').select('id,creator_id,service_id,title,description,media_type,media_url,sort_order,is_active,created_at').eq('is_active', true).order('sort_order', {ascending:true}).order('created_at', {ascending:true})
      .then(({data,error}) => {
        if (error || !Array.isArray(data)) return;
        state.portfoliosByCreator = data.reduce((acc,p) => { (acc[p.creator_id] ||= []).push(p); return acc; }, {});
        render();
      }).catch(() => {});
  }

  function renderControls() {
    const creatorSec = document.getElementById('studio-ai-creator-section');
    const grid = document.getElementById('studio-ai-creator-grid');
    if (!creatorSec || !grid) return false;
    let controls = document.getElementById('studio-ai-production-controls');
    if (!controls) { controls = document.createElement('div'); controls.id='studio-ai-production-controls'; creatorSec.insertBefore(controls, grid); }
    const categories = getCategories();
    const current = controls.dataset.category || '';
    controls.className='studio-ai-control-row';
    controls.innerHTML = `<button type="button" class="studio-ai-control ${!current?'active':''}" data-category="">Semua</button>${categories.map(([name,count])=>`<button type="button" class="studio-ai-control ${current===name?'active':''}" data-category="${esc(name)}">${esc(name)} <span>(${count})</span></button>`).join('')}`;
    controls.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => { controls.dataset.category=btn.dataset.category||''; render(); }));
    return true;
  }

  function renderStats() {
    const hero = document.querySelector('.studio-ai-hero');
    if (!hero) return false;
    let stats = document.getElementById('studio-ai-stats-row');
    if (!stats) { stats=document.createElement('div'); stats.id='studio-ai-stats-row'; hero.appendChild(stats); }
    const creators=getCreators(); const active=creators.filter(c=>c.is_published!==false).length;
    stats.className='studio-ai-stats-row';
    stats.innerHTML=`<span>Creator Aktif <strong>${active}</strong></span><span>Pengunjung <strong id="studio-live-visitors">${Number(window.App?.state?.studioAI?.visitorCount || 0).toLocaleString('id-ID')}</strong></span>`;
    return true;
  }

  function render() {
    const creatorSec=document.getElementById('studio-ai-creator-section'); const grid=document.getElementById('studio-ai-creator-grid');
    if(!creatorSec||!grid) return false;
    const controls=document.getElementById('studio-ai-production-controls'); const category=controls?.dataset.category||'';
    const creators=getCreators();
    const visibleCreators=creators.filter(c=>!category || (Array.isArray(c.categories) && c.categories.some(x => (typeof x==='string'?x:(x?.name||x?.title||''))===category)));
    grid.innerHTML=visibleCreators.map(c=>creatorCard(c,category)).join('') || '<div class="col-span-full text-center py-10 text-sm text-slate-400">Belum ada Creator pada kategori ini.</div>';
    grid.querySelectorAll('[data-creator-open]').forEach(btn=>btn.addEventListener('click',()=>{ const u=btn.dataset.creatorOpen; if(u && window.App?.router?.goCreator) window.App.router.goCreator(u); }));
    renderStats();
    return true;
  }

  function boot() {
    installCss();
    const tryRender=()=>{ ensurePortfolioData(); renderControls(); render(); renderStats(); };
    tryRender();
    const observer=new MutationObserver(()=>{ if(document.getElementById('studio-ai-creator-section')) tryRender(); });
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('popstate',tryRender);
    setTimeout(tryRender,400);
    setTimeout(tryRender,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
