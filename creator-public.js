(() => {
  'use strict';

  const RESERVED = new Set(['','/','/products','/kamar','/admin','/studio-ai','/dapur','/dapur/foyer','/dapur/menu','/dapur/hidangan','/dapur/ambalan','/ruang-kerja','/creator-studio','/dashboard','/ai-video','/ai-automation','/ai-content','/ai-untuk-guru','/ai-untuk-umkm']);
  let renderedFor = '';
  let modal = null;
  let activeItem = null;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let drag = null;

  const esc = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

  function creatorPath() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (RESERVED.has(path)) return null;
    const m = path.match(/^\/([a-z0-9][a-z0-9-]{2,39})(?:\/portfolio\/([a-z0-9][a-z0-9-]{0,120}))?$/i);
    return m ? { username: m[1].toLowerCase(), portfolioSlug: m[2] || null } : null;
  }

  function mediaType(url, declared) {
    const d = String(declared || '').toLowerCase();
    if (['youtube','drive','tiktok','instagram'].includes(d)) return d;
    let u;
    try { u = new URL(String(url || '')); } catch (_) { return 'link'; }
    const host = u.hostname.toLowerCase();
    if (/^(www\.)?(youtube\.com|youtu\.be)$/.test(host)) return 'youtube';
    if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host)) return 'drive';
    if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    return 'link';
  }

  function ytId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace(/^\//,'').split('/')[0];
      if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
      if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split('/')[0];
      return u.searchParams.get('v');
    } catch (_) { return null; }
  }

  function drivePreview(url) {
    try {
      const u = new URL(url);
      const file = u.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      if (file) return `https://drive.google.com/file/d/${encodeURIComponent(file)}/preview`;
      const id = u.searchParams.get('id');
      return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : url;
    } catch (_) { return url; }
  }

  function injectStyles() {
    if (document.getElementById('creator-public-portfolio-style')) return;
    const s = document.createElement('style');
    s.id = 'creator-public-portfolio-style';
    s.textContent = `
      .creator-portfolio-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:14px}
      .creator-portfolio-card{position:relative;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;border-radius:24px;background:#fff;box-shadow:0 10px 26px rgba(21,28,117,.07);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
      .creator-portfolio-card:hover{transform:translateY(-3px);border-color:#cbd5f5;box-shadow:0 20px 40px rgba(21,28,117,.12)}
      .creator-portfolio-thumb{position:relative;aspect-ratio:16/10;overflow:hidden;background:linear-gradient(135deg,#eef2ff,#f8fafc);display:flex;align-items:center;justify-content:center}
      .creator-portfolio-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}
      .creator-portfolio-card:hover .creator-portfolio-thumb img{transform:scale(1.035)}
      .creator-portfolio-play{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(21,28,117,.9);color:#fff;box-shadow:0 12px 28px rgba(15,23,42,.2)}
      .creator-portfolio-platform{position:absolute;left:10px;top:10px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.92);color:#151c75;font-size:9px;font-weight:900;backdrop-filter:blur(8px)}
      .creator-portfolio-body{padding:15px 16px 16px}
      .creator-portfolio-title{font-size:14px;line-height:1.35;font-weight:900;color:#151c75}
      .creator-portfolio-desc{margin-top:6px;font-size:11px;line-height:1.55;color:#64748b;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .creator-portfolio-open{margin-top:12px;font-size:10px;font-weight:900;color:#151c75;display:flex;align-items:center;justify-content:space-between}
      #creator-media-modal{position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.95);padding:10px;display:flex;align-items:center;justify-content:center}
      #creator-media-modal[hidden]{display:none}
      #creator-media-stage{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
      #creator-media-content{max-width:94vw;max-height:82vh;transform-origin:center;transition:transform .16s ease;user-select:none}
      #creator-media-content img{max-width:94vw;max-height:82vh;object-fit:contain;border-radius:16px;box-shadow:0 28px 80px rgba(0,0,0,.42);cursor:grab}
      #creator-media-content iframe{width:min(1100px,94vw);height:min(74vh,720px);border:0;border-radius:16px;background:#000;box-shadow:0 28px 80px rgba(0,0,0,.42)}
      .creator-media-toolbar{position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:5px;padding:6px;border-radius:999px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px)}
      .creator-media-toolbar button{width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer}
      .creator-media-toolbar button:hover{background:rgba(255,255,255,.16)}
      #creator-media-zoom{min-width:48px;text-align:center;color:#dbeafe;font-size:10px;font-weight:900}
      #creator-media-close{position:absolute;top:12px;right:12px;z-index:6;width:42px;height:42px;border:0;border-radius:50%;background:rgba(219,234,254,.95);color:#151c75;font-size:21px;font-weight:900;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2)}
      #creator-media-caption{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:5;max-width:min(850px,92vw);padding:9px 13px;border-radius:14px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:11px;line-height:1.5;text-align:center;backdrop-filter:blur(10px)}
      @media(max-width:900px){.creator-portfolio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.creator-portfolio-grid{grid-template-columns:1fr;gap:12px}.creator-portfolio-card{border-radius:20px}#creator-media-modal{padding:7px}#creator-media-content iframe{width:96vw;height:68vh}.creator-media-toolbar{top:9px}#creator-media-close{top:9px;right:9px}#creator-media-caption{bottom:8px}}
      @media(prefers-reduced-motion:reduce){.creator-portfolio-card,.creator-portfolio-thumb img,#creator-media-content{transition:none!important}}
    `;
    document.head.appendChild(s);
  }

  function resetViewer() {
    zoom = 1; panX = 0; panY = 0; drag = null;
    const node = modal?.querySelector('#creator-media-content');
    if (node) node.style.transform = 'translate3d(0,0,0) scale(1)';
    const readout = modal?.querySelector('#creator-media-zoom');
    if (readout) readout.textContent = '100%';
  }

  function applyViewerTransform() {
    const node = modal?.querySelector('#creator-media-content');
    if (!node) return;
    node.style.transform = `translate3d(${panX}px,${panY}px,0) scale(${zoom})`;
    const readout = modal.querySelector('#creator-media-zoom');
    if (readout) readout.textContent = `${Math.round(zoom * 100)}%`;
    if (zoom <= 1) { panX = 0; panY = 0; }
  }

  function setViewerZoom(direction) {
    if (direction === 'reset') { resetViewer(); return; }
    zoom = Math.max(1, Math.min(3.5, zoom + (direction === 'in' ? .25 : -.25)));
    if (zoom === 1) { panX = 0; panY = 0; }
    applyViewerTransform();
  }

  function bindViewerInteractions() {
    const stage = modal?.querySelector('#creator-media-stage');
    const node = modal?.querySelector('#creator-media-content');
    if (!stage || !node || node.dataset.bound === '1') return;
    node.dataset.bound = '1';
    const point = e => e.touches?.[0] || e;
    const down = e => { if (zoom <= 1) return; const p = point(e); drag = {x:p.clientX,y:p.clientY,ox:panX,oy:panY}; };
    const move = e => { if (!drag) return; const p = point(e); panX = drag.ox + p.clientX - drag.x; panY = drag.oy + p.clientY - drag.y; applyViewerTransform(); if (e.cancelable) e.preventDefault(); };
    const up = () => { drag = null; };
    node.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move, {passive:false});
    window.addEventListener('mouseup', up);
    node.addEventListener('touchstart', down, {passive:true});
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', up);
    node.addEventListener('dblclick', () => setViewerZoom(zoom > 1 ? 'reset' : 'in'));
    stage.addEventListener('wheel', e => { if (!modal.hidden) { e.preventDefault(); setViewerZoom(e.deltaY < 0 ? 'in' : 'out'); } }, {passive:false});
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'creator-media-modal';
    modal.hidden = true;
    modal.innerHTML = `<div id="creator-media-stage"><div class="creator-media-toolbar"><button type="button" data-viewer="out" aria-label="Perkecil">−</button><span id="creator-media-zoom">100%</span><button type="button" data-viewer="in" aria-label="Perbesar">+</button><button type="button" data-viewer="reset" aria-label="Reset zoom">↺</button></div><button id="creator-media-close" type="button" aria-label="Tutup">×</button><div id="creator-media-content"></div><div id="creator-media-caption"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#creator-media-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal || e.target.id === 'creator-media-stage') closeModal(); });
    modal.querySelectorAll('[data-viewer]').forEach(b => b.addEventListener('click', () => setViewerZoom(b.dataset.viewer)));
    document.addEventListener('keydown', e => {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === '+' || e.key === '=') setViewerZoom('in');
      else if (e.key === '-') setViewerZoom('out');
      else if (e.key === '0') setViewerZoom('reset');
    });
    bindViewerInteractions();
    return modal;
  }

  function openMedia(item) {
    if (!item?.media_url) return;
    const m = ensureModal();
    const content = m.querySelector('#creator-media-content');
    const type = mediaType(item.media_url, item.media_type);
    const url = String(item.media_url).trim();
    let html = '';
    if (type === 'youtube') {
      const id = ytId(url);
      html = id ? `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(item.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` : '';
    } else if (type === 'drive') {
      html = `<iframe src="${esc(drivePreview(url))}" title="${esc(item.title)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    } else if (type === 'tiktok' || type === 'instagram') {
      html = `<div class="max-w-md text-center text-white"><div class="text-xl font-black mb-2">Buka karya di ${type === 'tiktok' ? 'TikTok' : 'Instagram'}</div><p class="text-sm text-blue-100 mb-5">Platform ini membatasi pemutaran/embed pihak ketiga. Kami membuka tautan aslinya agar tetap aman dan konsisten.</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="inline-flex btn-brand-gradient px-4 py-3 rounded-xl font-bold">Buka karya</a></div>`;
    } else if (/^https?:\/\//i.test(url)) {
      html = `<div class="max-w-md text-center text-white"><div class="text-xl font-black mb-2">Buka karya</div><p class="text-sm text-blue-100 mb-5">Media ini tidak memiliki player aman yang didukung halaman publik.</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="inline-flex btn-brand-gradient px-4 py-3 rounded-xl font-bold">Buka tautan</a></div>`;
    }
    if (!html) return;
    content.innerHTML = html;
    m.querySelector('#creator-media-caption').textContent = item.title || 'Portofolio Creator';
    activeItem = item;
    resetViewer();
    m.hidden = false;
    document.body.classList.add('overflow-hidden');
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.querySelector('#creator-media-content').innerHTML = '';
    activeItem = null;
    document.body.classList.remove('overflow-hidden');
  }

  function portfolioSlug(title, id) {
    const slug = String(title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
    return slug || String(id || 'portfolio');
  }

  function cardMarkup(p, i) {
    const type = mediaType(p.media_url, p.media_type);
    const platform = type === 'youtube' ? 'YouTube' : type === 'drive' ? 'Google Drive' : type === 'tiktok' ? 'TikTok' : type === 'instagram' ? 'Instagram' : 'Media';
    const icon = type === 'youtube' || type === 'drive' ? 'fa-circle-play' : 'fa-arrow-up-right-from-square';
    return `<button type="button" data-creator-media="${i}" class="creator-portfolio-card text-left"><div class="creator-portfolio-thumb"><span class="creator-portfolio-platform">${platform}</span><span class="creator-portfolio-play"><i class="fa-solid ${icon}"></i></span></div><div class="creator-portfolio-body"><div class="creator-portfolio-title">${esc(p.title)}</div><div class="creator-portfolio-desc">${esc(p.description || '')}</div><div class="creator-portfolio-open"><span>${type === 'youtube' || type === 'drive' ? 'Putar karya' : 'Lihat karya'}</span><i class="fa-solid fa-arrow-right"></i></div></div></button>`;
  }

  async function load() {
    const target = creatorPath();
    if (!target || !window.supabaseClient) return;
    if (renderedFor === target.username && !target.portfolioSlug) return;
    const host = document.getElementById('main-content');
    if (!host) return;
    injectStyles();

    const { data: profile, error } = await window.supabaseClient.from('creator_profiles').select('id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,is_published,is_verified,managed_by_studihome,is_studihome_official').eq('username', target.username).eq('is_published', true).maybeSingle();
    if (error || !profile) {
      host.innerHTML = `<div class="max-w-xl mx-auto mt-10 card-3d p-8 rounded-3xl text-center"><div class="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center"><i class="fa-solid fa-user-slash text-2xl text-[#151c75]"></i></div><h1 class="mt-4 text-xl font-black text-[#151c75]">Halaman Creator belum tersedia.</h1><p class="mt-2 text-sm text-slate-500">Creator ini belum menayangkan halaman publiknya atau tautannya belum valid.</p><a href="/studio-ai" class="inline-flex mt-5 btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-bold">Kembali ke Studio AI</a></div>`;
      renderedFor = target.username;
      return;
    }

    const [catsRes, servicesRes, portfoliosRes] = await Promise.all([
      window.supabaseClient.from('creator_category_members').select('is_primary,ai_categories(id,name,icon)').eq('creator_id', profile.id),
      window.supabaseClient.from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id', profile.id).eq('is_active', true).order('created_at', { ascending: false }),
      window.supabaseClient.from('creator_portfolios').select('id,title,description,media_type,media_url,is_active,sort_order').eq('creator_id', profile.id).eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    ]);

    const cats = (catsRes.data || []).map(x => x.ai_categories).filter(Boolean);
    const services = servicesRes.data || [];
    const portfolios = portfoliosRes.data || [];
    const avatar = profile.avatar_url || '';
    const verified = profile.is_verified ? '<span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600"><i class="fa-solid fa-check text-[9px]"></i></span>' : '';
    const star = profile.is_studihome_official || profile.managed_by_studihome ? '<span class="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-black">✦ Studihome</span>' : '';

    host.innerHTML = `<div class="max-w-5xl mx-auto"><section class="overflow-hidden rounded-3xl bg-white border border-blue-100 shadow-sm"><div class="h-36 sm:h-48 bg-gradient-to-br from-[#0a1095] via-[#3840c5] to-[#666fe5] relative">${profile.cover_url ? `<img src="${esc(profile.cover_url)}" class="w-full h-full object-cover" alt="">` : ''}</div><div class="px-5 sm:px-8 pb-7"><div class="-mt-12 relative flex flex-col sm:flex-row sm:items-end gap-4"><div class="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-blue-50 overflow-hidden shadow-xl flex items-center justify-center">${avatar ? `<img src="${esc(avatar)}" alt="${esc(profile.display_name)}" class="w-full h-full object-cover">` : `<span class="text-3xl font-black text-[#151c75]">${esc((profile.display_name || 'C').charAt(0))}</span>`}</div><div class="flex-1 min-w-0 pt-2 sm:pb-1"><div class="flex flex-wrap items-center gap-1"><h1 class="text-xl sm:text-2xl font-black text-[#151c75]">${esc(profile.display_name)}${verified}${star}</h1></div><p class="text-xs text-slate-500 mt-1">@${esc(profile.username)}${profile.location ? ` · ${esc(profile.location)}` : ''}</p>${cats.length ? `<div class="flex flex-wrap gap-2 mt-3">${cats.map(c => `<span class="px-2.5 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-extrabold">${esc(c.name)}</span>`).join('')}</div>` : ''}</div>${profile.whatsapp ? `<a href="https://wa.me/${encodeURIComponent(String(profile.whatsapp).replace(/\D/g,''))}" target="_blank" rel="noopener noreferrer" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"><i class="fa-brands fa-whatsapp mr-1"></i> Hubungi</a>` : ''}</div>${profile.bio ? `<p class="mt-5 text-sm leading-relaxed text-slate-600 max-w-3xl">${esc(profile.bio)}</p>` : ''}</div></section><section class="mt-6"><div class="flex items-center justify-between gap-3"><h2 class="text-lg font-black text-[#151c75]">Hidangan</h2><span class="text-[10px] font-bold text-slate-400">${services.length} layanan</span></div><div class="grid md:grid-cols-2 gap-4 mt-3">${services.length ? services.map(s => `<article class="card-3d p-5 rounded-2xl"><h3 class="text-sm font-black text-[#151c75]">${esc(s.title)}</h3><p class="text-xs text-slate-500 mt-2 leading-relaxed">${esc(s.description || '')}</p><div class="mt-4 text-xs font-extrabold text-[#151c75]">Mulai Rp ${Number(s.price_from || 0).toLocaleString('id-ID')} · ${Number(s.delivery_days || 1)} hari</div></article>`).join('') : `<div class="col-span-full card-3d p-6 rounded-2xl text-center text-sm text-slate-500">Belum ada hidangan yang ditayangkan.</div>`}</div></section><section class="mt-8"><div class="flex items-center justify-between gap-3"><div><h2 class="text-lg font-black text-[#151c75]">Ambalan</h2><p class="text-[11px] text-slate-400 mt-1">Pilih karya untuk melihat atau memutarnya.</p></div><span class="text-[10px] font-bold text-slate-400">${portfolios.length} karya</span></div><div class="creator-portfolio-grid">${portfolios.length ? portfolios.map(cardMarkup).join('') : `<div class="col-span-full card-3d p-6 rounded-2xl text-center text-sm text-slate-500">Belum ada karya yang ditayangkan.</div>`}</div></section></div>`;

    host.querySelectorAll('[data-creator-media]').forEach(btn => btn.addEventListener('click', () => openMedia(portfolios[Number(btn.dataset.creatorMedia)])));
    renderedFor = target.username;

    if (target.portfolioSlug) {
      const match = portfolios.find(p => portfolioSlug(p.title, p.id) === target.portfolioSlug || String(p.id) === target.portfolioSlug);
      if (match) setTimeout(() => openMedia(match), 120);
    }
  }

  function boot(){ load().catch(err => console.error('[creator-public]', err)); }
  window.addEventListener('popstate', () => { renderedFor = ''; setTimeout(boot, 100); });
  window.addEventListener('hashchange', () => { renderedFor = ''; setTimeout(boot, 100); });
  document.addEventListener('DOMContentLoaded', boot, { once:true });
  setTimeout(boot, 400);
})();
