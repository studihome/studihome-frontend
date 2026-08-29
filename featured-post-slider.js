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
            <div class="featured-card card-3d rounded-2xl overflow-hidden border border-blue-50 transition-all duration-300 hover:-translate-y-0.5 h-full relative isolate" style="border-radius:1.5rem">
              ${hasImage ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="featured-card-image absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy">` : `<div class="absolute inset-0 bg-gradient-to-br from-[#151c75] via-[#25308d] to-[#3f48bf]"><div class="absolute inset-0 opacity-20" style="background:radial-gradient(circle at 75% 25%, rgba(250,204,21,.65) 0%, transparent 45%)"></div><span class="absolute right-5 top-1/2 -translate-y-1/2 text-white/25 text-6xl font-black">${(a.title || 'S').charAt(0).toUpperCase()}</span></div>`}
              <div class="featured-card-overlay absolute inset-0 pointer-events-none"></div>
              <div class="featured-card-sheen absolute inset-0 pointer-events-none"></div>
              <div class="relative z-10 h-full p-3 sm:p-4 md:p-5 flex flex-col justify-between min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <span class="featured-card-category inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white">${esc(a.category || 'Artikel')}</span>
                  <span class="text-[10px] font-medium text-white/80">${dateStr}</span>
                </div>
                <div class="flex items-end justify-between gap-3 min-w-0">
                  <div class="min-w-0 flex-1">
                    <h3 class="text-xs sm:text-sm font-extrabold text-white leading-snug mb-1 line-clamp-2 drop-shadow-sm">${esc(a.title)}</h3>
                    <p class="text-[11px] text-white/85 leading-relaxed line-clamp-1">${esc(a.excerpt || '')}</p>
                  </div>
                  <span class="featured-card-read shrink-0 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-white">Baca <i class="fa-solid fa-arrow-right text-[9px]" aria-hidden="true"></i></span>
                </div>
              </div>
            </div>
          </article>`;        }).join('');
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
          #featured-post-slider .featured-card{background:#151c75;border-color:rgba(255,255,255,.3);box-shadow:0 16px 34px rgba(21,28,117,.18),inset 0 1px 0 rgba(255,255,255,.28);}
          #featured-post-slider .featured-card:hover{box-shadow:0 22px 44px rgba(21,28,117,.26),inset 0 1px 0 rgba(255,255,255,.38);}
          #featured-post-slider .featured-card-overlay{background:linear-gradient(180deg,rgba(8,15,45,.04) 0%,rgba(8,15,45,.12) 35%,rgba(8,15,45,.86) 100%),linear-gradient(90deg,rgba(8,15,45,.3) 0%,transparent 62%);}
          #featured-post-slider .featured-card-sheen{background:linear-gradient(115deg,transparent 34%,rgba(255,255,255,.16) 48%,transparent 62%);transform:translateX(-125%);transition:transform .8s cubic-bezier(.2,.8,.2,1);}
          #featured-post-slider .group:hover .featured-card-sheen{transform:translateX(125%);}
          #featured-post-slider .featured-card-category{border:1px solid rgba(255,255,255,.28);background:rgba(15,23,42,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.22);backdrop-filter:blur(10px);}
          #featured-post-slider .featured-card-read{padding:.48rem .7rem;border:1px solid rgba(255,255,255,.2);border-radius:.7rem;background:rgba(15,23,42,.9);box-shadow:0 6px 14px rgba(2,6,23,.28),inset 0 1px 0 rgba(255,255,255,.12);transition:transform .2s ease,background-color .2s ease;}
          #featured-post-slider .group:hover .featured-card-read{background:#111936;transform:translateX(2px);}
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
          <div class="hidden md:block relative overflow-hidden rounded-2xl" style="min-height:10rem">
            ${this._pairs.map((pair, idx) => `
              <div class="featured-slide ${idx === 0 ? 'active' : ''} absolute inset-0 transition-opacity duration-700 ease-in-out" data-slide="${idx}">
                <div class="grid grid-cols-2 gap-4 h-full">
                  ${renderPair(pair, idx)}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Mobile view: 1 card at a time -->
          <div class="md:hidden relative overflow-hidden rounded-2xl" style="min-height:10rem">
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
