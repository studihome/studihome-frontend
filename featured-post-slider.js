(() => {
  'use strict';
  // ============================================================
  // STUDIHOME Featured Post Slider v1
  // ============================================================
  // Pure JS + CSS transition slider. No external libraries.
  // Autoplay: 5s interval, fade-in/out transition.
  // Layout: 2 cards desktop (md+), 1 card mobile.
  // ============================================================

  window.App = window.App || {};

  App.featuredSlider = {
    _timer: null,
    _currentPair: 0,
    _pairs: [],

    // Generate the slider HTML (to be injected by renderHome)
    getHTML(articles) {
      if (!articles || articles.length === 0) return '';

      // Create pairs for desktop (2 per view)
      this._pairs = [];
      for (let i = 0; i < articles.length; i += 2) {
        this._pairs.push(articles.slice(i, i + 2));
      }

      const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
      );

      const renderPair = (pair, idx) => {
        const cards = pair.map(a => {
          const dateStr = new Date(a.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
          const hasImage = a.image && a.image.trim();
          const categoryColors = {
            'Pendidikan': 'bg-blue-100 text-blue-700',
            'Bisnis': 'bg-amber-100 text-amber-700',
            'Tentang Kami': 'bg-emerald-100 text-emerald-700'
          };
          const catClass = categoryColors[a.category] || 'bg-slate-100 text-slate-600';

          return `<article class="blog-slider-card flex-1 min-w-0 cursor-pointer group" onclick="App.blog.openArticle('${esc(a.slug)}')">
            <div class="card-3d rounded-2xl overflow-hidden bg-white border border-blue-50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col" style="border-radius:1.5rem">
              ${hasImage ? `<div class="overflow-hidden bg-slate-100 shrink-0" style="height:clamp(11rem,16vw,15rem)">
                <img src="${esc(a.image)}" alt="${esc(a.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
              </div>` : `<div class="bg-gradient-to-br from-[#151c75] to-[#3f48bf] flex items-center justify-center relative overflow-hidden shrink-0" style="height:clamp(11rem,16vw,15rem)">
                <div class="absolute inset-0 opacity-10" style="background:radial-gradient(circle at 30% 40%, rgba(250,204,21,.4) 0%, transparent 60%)"></div>
                <span class="text-white/80 text-3xl font-black relative z-10">${(a.title || 'S').charAt(0).toUpperCase()}</span>
              </div>`}
              <div class="p-3 flex flex-col flex-1">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${catClass}">${esc(a.category || 'Artikel')}</span>
                  <span class="text-[10px] text-slate-400">${dateStr}</span>
                </div>
                <h3 class="text-xs sm:text-sm font-extrabold text-[#151c75] leading-snug mb-1 line-clamp-2 group-hover:text-[#3f48bf] transition-colors">${esc(a.title)}</h3>
                <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-auto">${esc(a.excerpt || '')}</p>
              </div>
            </div>
          </article>`;
        }).join('');
        return cards;
      };

      return `
        <style>
          #featured-post-slider .featured-slider-pagination{display:flex;align-items:center;justify-content:center;gap:.25rem;width:max-content;margin-inline:auto;padding:.25rem .35rem;border:1px solid rgba(203,213,225,.72);border-radius:999px;background:rgba(255,255,255,.72);box-shadow:0 6px 18px rgba(21,28,117,.08);backdrop-filter:blur(8px)}
          #featured-post-slider .featured-dot{display:inline-flex;align-items:center;justify-content:center;width:1.75rem;height:1.75rem;border-radius:999px;transition:background-color .2s ease,transform .2s ease;outline:none}
          #featured-post-slider .featured-dot:hover{background:rgba(226,232,240,.75)}
          #featured-post-slider .featured-dot:focus-visible{box-shadow:0 0 0 3px rgba(63,72,191,.25)}
          #featured-post-slider .featured-dot-mark{display:block;width:.4rem;height:.4rem;border-radius:999px;background:#94a3b8;transition:width .25s ease,background-color .25s ease,transform .25s ease}
          #featured-post-slider .featured-dot.is-active .featured-dot-mark{width:1.5rem;background:#151c75}
          #featured-post-slider .featured-dot.is-active:hover .featured-dot-mark{transform:scaleX(1.04)}
        </style>
        <div class="mb-8 sm:mb-10" id="featured-post-slider">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg sm:text-xl font-extrabold text-[#151c75]">Artikel Terbaru</h2>
              <p class="text-xs text-slate-500">Insights & tips seputar AI dan pendidikan</p>
            </div>
            <button onclick="App.router.navigate('home')" class="text-xs font-bold text-[#151c75] hover:underline flex items-center gap-1">
              <span>Semua</span>
              <i class="fa-solid fa-chevron-right text-amber-500"></i>
            </button>
          </div>
          <!-- Desktop view: 2 cards side by side -->
          <div class="hidden md:block relative overflow-hidden rounded-2xl" style="min-height:23rem">
            ${this._pairs.map((pair, idx) => `
              <div class="featured-slide ${idx === 0 ? 'active' : ''} absolute inset-0 transition-opacity duration-700 ease-in-out" data-slide="${idx}">
                <div class="grid grid-cols-2 gap-4 h-full">
                  ${renderPair(pair, idx)}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Mobile view: 1 card at a time -->
          <div class="md:hidden relative overflow-hidden rounded-2xl" style="min-height:21rem">
            ${articles.map((a, idx) => `
              <div class="featured-slide-mobile ${idx === 0 ? 'active' : ''} absolute inset-0 transition-opacity duration-700 ease-in-out" data-slide-m="${idx}">
                ${renderPair([a], idx)}
              </div>
            `).join('')}
          </div>
          <!-- Slider pagination -->
          <div class="featured-slider-pagination mt-4" role="group" aria-label="Navigasi artikel terbaru">
            ${this._pairs.map((_, idx) => `
              <button class="featured-dot ${idx === 0 ? 'is-active' : ''}" data-dot="${idx}" onclick="App.featuredSlider.goTo(${idx})" aria-label="Tampilkan artikel ${idx + 1}" aria-current="${idx === 0 ? 'true' : 'false'}">
                <span class="featured-dot-mark" aria-hidden="true"></span>
              </button>
            `).join('')}
          </div>
        </div>`;
    },

    // Start autoplay
    start() {
      this.stop();
      if (this._pairs.length <= 1) return;
      this._timer = setInterval(() => this.next(), 5000);
    },

    stop() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },

    next() {
      this._currentPair = (this._currentPair + 1) % this._pairs.length;
      this._update();
    },

    goTo(idx) {
      this._currentPair = idx;
      this._update();
      this.stop();
      this.start(); // restart timer on manual interaction
    },

    _update() {
      // Desktop slides
      document.querySelectorAll('.featured-slide').forEach(el => {
        const slideIdx = parseInt(el.dataset.slide, 10);
        el.style.opacity = slideIdx === this._currentPair ? '1' : '0';
        el.style.pointerEvents = slideIdx === this._currentPair ? 'auto' : 'none';
      });
      // Mobile slides
      document.querySelectorAll('.featured-slide-mobile').forEach(el => {
        const slideIdx = parseInt(el.dataset.slideM, 10);
        el.style.opacity = slideIdx === this._currentPair ? '1' : '0';
        el.style.pointerEvents = slideIdx === this._currentPair ? 'auto' : 'none';
      });
      // Dots
      document.querySelectorAll('.featured-dot').forEach(el => {
        const dotIdx = parseInt(el.dataset.dot, 10);
        const isActive = dotIdx === this._currentPair;
        el.classList.toggle('is-active', isActive);
        el.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }
  };
})();
