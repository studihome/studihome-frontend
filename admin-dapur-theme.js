(() => {
  'use strict';
  const SELECTORS = {
    root: '#admin-dapur-content',
    list: '#admin-dapur-list'
  };
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');

  function injectStyles() {
    if (document.getElementById('studihome-admin-dapur-theme')) return;
    const s = document.createElement('style');
    s.id = 'studihome-admin-dapur-theme';
    s.textContent = `
      #admin-dapur-content .dapur-hero{position:relative;overflow:hidden;border:1px solid rgba(59,130,246,.12);background:linear-gradient(135deg,#ffffff 0%,#f8fbff 52%,#fffaf2 100%);box-shadow:0 18px 45px rgba(21,28,117,.08)}
      #admin-dapur-content .dapur-hero:before{content:'';position:absolute;inset:-35% auto auto -10%;width:240px;height:240px;border-radius:999px;background:radial-gradient(circle,rgba(59,130,246,.12),transparent 68%);pointer-events:none}
      #admin-dapur-content .dapur-stat{background:rgba(255,255,255,.9);border:1px solid rgba(148,163,184,.16);box-shadow:0 8px 24px rgba(15,23,42,.04)}
      #admin-dapur-content .dapur-filter{transition:.18s ease;border:1px solid #e2e8f0;background:#fff;color:#475569}
      #admin-dapur-content .dapur-filter:hover{border-color:#93c5fd;color:#151c75}
      #admin-dapur-content .dapur-filter.is-active{background:#151c75;border-color:#151c75;color:#fff;box-shadow:0 6px 16px rgba(21,28,117,.16)}
      #admin-dapur-content .admin-dapur-item{border:1px solid rgba(148,163,184,.16)!important;box-shadow:0 8px 26px rgba(15,23,42,.045)!important;transition:.18s ease}
      #admin-dapur-content .admin-dapur-item:hover{transform:translateY(-1px);box-shadow:0 12px 30px rgba(15,23,42,.07)!important}
      #admin-dapur-content .admin-dapur-item[open]{border-color:rgba(59,130,246,.28)!important;box-shadow:0 14px 34px rgba(59,130,246,.08)!important}
      #admin-dapur-content .admin-dapur-item summary{min-height:66px}
      #admin-dapur-content .dapur-section-title{letter-spacing:-.02em}
    `;
    document.head.appendChild(s);
  }

  function moveDapurNav() {
    const creatorBtn = [...document.querySelectorAll('button')].find(b => /creator/i.test((b.textContent || '').trim()) && b !== document.getElementById('admin-dapur-tab-btn'));
    const dapurBtn = document.getElementById('admin-dapur-tab-btn') || [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim().toLowerCase().includes('dapur'));
    if (!creatorBtn || !dapurBtn) return;
    const studioBtn = [...document.querySelectorAll('button')].find(b => /studio\s*ai/i.test((b.textContent || '').trim()));
    if (studioBtn && studioBtn.previousElementSibling !== dapurBtn) studioBtn.parentElement?.insertBefore(dapurBtn, studioBtn);
    else if (!studioBtn && creatorBtn.nextElementSibling !== dapurBtn) creatorBtn.parentElement?.insertBefore(dapurBtn, creatorBtn.nextElementSibling);
  }

  function enhanceRoot() {
    const root = document.querySelector(SELECTORS.root);
    const list = document.querySelector(SELECTORS.list);
    if (!root || !list) return false;
    injectStyles();
    moveDapurNav();

    const top = root.querySelector(':scope > .space-y-5');
    const header = top?.firstElementChild;
    if (header && !header.dataset.dapurEnhanced) {
      header.dataset.dapurEnhanced = '1';
      header.className = 'dapur-hero rounded-3xl p-5 sm:p-6 space-y-4';
      const copy = header.firstElementChild;
      const searchWrap = header.lastElementChild;
      if (copy) copy.querySelector('p')?.classList.add('max-w-2xl');
      const intro = document.createElement('div');
      intro.className = 'grid grid-cols-2 sm:grid-cols-4 gap-2';
      intro.innerHTML = `
        <div class="dapur-stat rounded-2xl px-3 py-2.5"><div class="text-[9px] font-black uppercase tracking-wider text-slate-400">Managed</div><div id="dapur-stat-managed" class="mt-0.5 text-base font-black text-[#151c75]">0</div></div>
        <div class="dapur-stat rounded-2xl px-3 py-2.5"><div class="text-[9px] font-black uppercase tracking-wider text-slate-400">Published</div><div id="dapur-stat-published" class="mt-0.5 text-base font-black text-emerald-600">0</div></div>
        <div class="dapur-stat rounded-2xl px-3 py-2.5"><div class="text-[9px] font-black uppercase tracking-wider text-slate-400">Verified</div><div id="dapur-stat-verified" class="mt-0.5 text-base font-black text-blue-700">0</div></div>
        <div class="dapur-stat rounded-2xl px-3 py-2.5"><div class="text-[9px] font-black uppercase tracking-wider text-slate-400">Official ✦</div><div id="dapur-stat-official" class="mt-0.5 text-base font-black text-amber-600">0</div></div>`;
      top.insertBefore(intro, list);
      if (searchWrap) {
        searchWrap.className = 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2';
        searchWrap.style.width = '100%';
        const input = searchWrap.querySelector('input');
        if (input) input.classList.add('py-2.5');
        const filters = document.createElement('div');
        filters.id = 'dapur-filters';
        filters.className = 'flex flex-wrap gap-1.5';
        filters.innerHTML = `
          <button type="button" class="dapur-filter is-active px-3 py-2 rounded-xl text-[10px] font-bold" data-filter="all">Semua</button>
          <button type="button" class="dapur-filter px-3 py-2 rounded-xl text-[10px] font-bold" data-filter="published">Published</button>
          <button type="button" class="dapur-filter px-3 py-2 rounded-xl text-[10px] font-bold" data-filter="draft">Draft</button>
          <button type="button" class="dapur-filter px-3 py-2 rounded-xl text-[10px] font-bold" data-filter="official">Official ✦</button>`;
        searchWrap.appendChild(filters);
        filters.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-filter]');
          if (!btn) return;
          filters.querySelectorAll('.dapur-filter').forEach(x => x.classList.toggle('is-active', x === btn));
          applyFilter(btn.dataset.filter, document.getElementById('admin-dapur-search')?.value || '');
        });
      }
    }

    const items = [...list.querySelectorAll('.admin-dapur-item')];
    const stats = {
      managed: items.length,
      published: items.filter(x => /Published/.test(x.textContent || '')).length,
      verified: items.filter(x => /Verified/.test(x.textContent || '')).length,
      official: items.filter(x => x.textContent?.includes('✦')).length
    };
    [['dapur-stat-managed',stats.managed],['dapur-stat-published',stats.published],['dapur-stat-verified',stats.verified],['dapur-stat-official',stats.official]].forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val});
    list.querySelectorAll('.admin-dapur-item').forEach(item => {
      const summary = item.querySelector('summary');
      if (summary && !summary.dataset.enhanced) {
        summary.dataset.enhanced = '1';
        const meta = summary.querySelector('.text-\[9px\]');
        if (meta) meta.classList.add('mt-0.5');
      }
    });
    return true;
  }

  function applyFilter(mode, query) {
    const list = document.querySelector(SELECTORS.list);
    if (!list) return;
    const q = String(query || '').trim().toLowerCase();
    list.querySelectorAll('.admin-dapur-item').forEach(item => {
      const text = (item.textContent || '').toLowerCase();
      const search = (item.dataset.search || '').toLowerCase();
      const okQuery = !q || search.includes(q) || text.includes(q);
      const okMode = mode === 'all' || (mode === 'published' && text.includes('published')) || (mode === 'draft' && text.includes('draft')) || (mode === 'official' && text.includes('✦'));
      item.style.display = okQuery && okMode ? '' : 'none';
    });
  }

  let attempts = 0;
  function boot() {
    if (enhanceRoot()) return;
    attempts += 1;
    if (attempts < 80) setTimeout(boot, 180);
  }
  window.AdminDapurTheme = { boot, enhanceRoot, applyFilter };
  boot();
})();
