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
    _currentMobile: 0,
    _mobileTotal: 0,
    _pairs: [],

    // Generate the slider HTML (to be injected by renderHome)
    getHTML(articles) {
      if (!articles || articles.length === 0) return '';

      // Create pairs for desktop (2 per view)
      this._pairs = [];
      for (let i = 0; i < articles.length; i += 2) {
        this._pairs.push(articles.slice(i, i + 2));
      }
      this._currentPair = 0;
      this._currentMobile = 0;
      this._mobileTotal = articles.length;

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
            <div class="featured-card card-3d rounded-2xl overflow-hidden h-full relative" style="border-radius:1rem">
              <div class="h-full p-3 flex items-center min-w-0">
                <div class="flex items-center justify-between gap-3 min-w-0 w-full">
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
          #featured-post-slider .featured-slide,#featured-post-slider .featured-slide-mobile{will-change:opacity,transform;transition:opacity .6s ease-in-out,transform .6s ease-in-out;}
          #featured-post-slider .featured-card{background:#fff;border:1px solid #dbe7ff;box-shadow:none;}
          #featured-post-slider .featured-card:hover{border-color:#c6d7ff;box-shadow:none;}
          #featured-post-slider .featured-card-read{padding:.48rem .7rem;border:1px solid rgba(100,116,139,.35);border-radius:.7rem;background:linear-gradient(135deg,#e2e8f0 0%,#64748b 100%);color:#fff;box-shadow:0 5px 12px rgba(71,85,105,.2),inset 0 1px 0 rgba(255,255,255,.42);transition:transform .2s ease,box-shadow .2s ease;}
          #featured-post-slider .group:hover .featured-card-read{box-shadow:0 7px 16px rgba(71,85,105,.28),inset 0 1px 0 rgba(255,255,255,.48);transform:translateX(2px);}
        </style>
        <div class="mb-3 sm:mb-10" id="featured-post-slider">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-lg sm:text-xl font-extrabold text-[#151c75]">Insights &amp; tips seputar AI</h2>
            </div>
            <button onclick="App.router.navigate('home')" class="text-xs font-bold text-[#151c75] hover:underline flex items-center gap-1">
              <span>Semua</span>
              <i class="fa-solid fa-chevron-right text-amber-500"></i>
            </button>
          </div>
          <!-- Desktop view: 2 cards side by side -->
          <div class="hidden md:block relative overflow-hidden rounded-2xl" style="min-height:clamp(4.75rem,4.5vw,5rem)">
            ${this._pairs.map((pair, idx) => `
              <div class="featured-slide testimonial-fade ${idx === 0 ? 'active opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} absolute inset-0" data-slide="${idx}">
                <div class="grid grid-cols-2 gap-4 h-full">
                  ${renderPair(pair, idx)}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Mobile view: 1 card at a time -->
          <div class="md:hidden relative overflow-hidden rounded-2xl" style="min-height:7rem">
            ${articles.map((a, idx) => `
              <div class="featured-slide-mobile testimonial-fade ${idx === 0 ? 'active opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} absolute inset-0" data-slide-m="${idx}">
                ${renderPair([a], idx)}
              </div>
            `).join('')}
          </div>

        </div>`;
    },

    // Start autoplay
    start() {
      this.stop();
      if (this._pairs.length <= 1 && this._mobileTotal <= 1) return;
      this._timer = setInterval(() => this.next(), 5000);
    },

    stop() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },

    next() {
      if (this._pairs.length) this._currentPair = (this._currentPair + 1) % this._pairs.length;
      if (this._mobileTotal) this._currentMobile = (this._currentMobile + 1) % this._mobileTotal;
      this._update();
    },

    goTo(idx) {
      this._currentPair = idx;
      this._currentMobile = idx;
      this._update();
      this.stop();
      this.start(); // restart timer on manual interaction
    },

    _update() {
      const applyFadeState = (selector, dataKey, activeIndex) => {
        document.querySelectorAll(selector).forEach(el => {
          const slideIdx = parseInt(el.dataset[dataKey], 10);
          const isActive = slideIdx === activeIndex;
          el.classList.remove('testimonial-fade-in', 'testimonial-fade-out');
          el.classList.add(isActive ? 'testimonial-fade-in' : 'testimonial-fade-out');
          el.style.opacity = isActive ? '1' : '0';
          el.style.pointerEvents = isActive ? 'auto' : 'none';
          el.classList.toggle('active', isActive);
        });
      };
      applyFadeState('.featured-slide', 'slide', this._currentPair);
      applyFadeState('.featured-slide-mobile', 'slideM', this._currentMobile);
    }
  };
})();
