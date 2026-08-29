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
            <div class="featured-card card-3d rounded-2xl overflow-hidden h-full relative" style="border-radius:1.5rem">
              <div class="h-full p-3 sm:p-4 md:p-5 flex items-end min-w-0">
                <div class="flex items-end justify-between gap-3 min-w-0 w-full">
                  <h3 class="min-w-0 flex-1 text-xs sm:text-sm font-extrabold text-[#151c75] leading-snug line-clamp-2">${esc(a.title)}</h3>
                  <span class="featured-card-read shrink-0 inline-flex items-center gap-1.5 text-[10px] font-extrabold">Baca <i class="fa-solid fa-arrow-right text-[9px]" aria-hidden="true"></i></span>
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
          #featured-post-slider .featured-card{background:#fff;border:1px solid #dbe7ff;box-shadow:0 10px 24px rgba(21,28,117,.08),inset 0 1px 0 rgba(255,255,255,.95);}
          #featured-post-slider .featured-card:hover{border-color:#c6d7ff;box-shadow:0 16px 30px rgba(21,28,117,.13);}
          #featured-post-slider .featured-card-read{padding:.48rem .7rem;border:1px solid rgba(100,116,139,.35);border-radius:.7rem;background:linear-gradient(135deg,#e2e8f0 0%,#64748b 100%);color:#fff;box-shadow:0 5px 12px rgba(71,85,105,.2),inset 0 1px 0 rgba(255,255,255,.42);transition:transform .2s ease,box-shadow .2s ease;}
          #featured-post-slider .group:hover .featured-card-read{box-shadow:0 7px 16px rgba(71,85,105,.28),inset 0 1px 0 rgba(255,255,255,.48);transform:translateX(2px);}
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
              <div class="featured-slide ${idx === 0 ? 'active opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} absolute inset-0 transition-opacity duration-700 ease-in-out" data-slide="${idx}">
                <div class="grid grid-cols-2 gap-4 h-full">
                  ${renderPair(pair, idx)}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Mobile view: 1 card at a time -->
          <div class="md:hidden relative overflow-hidden rounded-2xl" style="min-height:10rem">
            ${articles.map((a, idx) => `
              <div class="featured-slide-mobile ${idx === 0 ? 'active opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} absolute inset-0 transition-opacity duration-700 ease-in-out" data-slide-m="${idx}">
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
