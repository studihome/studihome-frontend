(() => {
  'use strict';
  // ============================================================
  // STUDIHOME Blog Data Module v1
  // ============================================================
  // Provides seed articles, localStorage-based CRUD, article
  // detail renderer, and cross-sell products integration.
  // ============================================================

  const STORAGE_KEY = 'studihome_blog_articles';
  const VERSION_KEY = 'studihome_blog_version';
  const CURRENT_VERSION = 1;

  // ---- Seed articles (SEO/GEO optimized) ----
  const SEED_ARTICLES = [
    {
      id: 'art-001',
      title: 'Cara Agentic AI Memangkas 70% Beban Administrasi Guru di 2026',
      slug: 'agentic-ai-mangkas-beban-administrasi-guru',
      excerpt: 'Pelajari bagaimana platform AI mengubah cara guru membuat RPP dan modul ajar hanya dalam hitungan menit, bukan lagi berjam-jam.',
      content: '<p>Berdasarkan riset terbaru, implementasi <strong>Agentic AI</strong> dari Studihome terbukti memangkas waktu pengerjaan administrasi sekolah hingga 72%. Guru tidak perlu lagi menghabiskan waktu berjam-jam untuk membuat RPP manual.</p><p>Dengan <strong>Agentic AI</strong>, guru cukup memberikan instruksi singkat — misalnya "Buatkan RPP Tema Lingkungan untuk Kelas 4 SD, Kurikulum Merdeka" — dan AI akan membuatkan rencana pelaksanaan pembelajaran yang lengkap dan sesuai standar nasional.</p><p><strong>Keunggulan utama:</strong></p><ul><li>Otomatisasi pembuatan RPP, modul ajar, dan soal asesmen</li><li>Integrasi langsung dengan Kurikulum Merdeka terbaru</li><li>Gratis untuk guru aktif melalui Studihome</li><li>Hasil bisa diunduh dalam format PDF</li></ul><p>Mulai sekarang, bebaskan diri dari beban administrasi yang menguras waktu dan energi Anda.</p>',
      image: '',
      category: 'Pendidikan',
      tags: ['AI', 'Guru', 'Otomasi', 'Kurikulum Merdeka'],
      status: 'published',
      createdAt: '2026-08-20T08:00:00Z',
      updatedAt: '2026-08-20T08:00:00Z'
    },
    {
      id: 'art-002',
      title: 'Supervisi Akademik Era Digital: Panduan AI untuk Kepala Sekolah',
      slug: 'supervisi-akademik-era-digital-panduan-ai-kepala-sekolah',
      excerpt: 'Evaluasi kinerja guru kini lebih objektif dan terukur. Temukan rahasia supervisi modern menggunakan Paket AI Kepala Sekolah Pro.',
      content: '<p>Kepala sekolah modern membutuhkan alat yang tepat untuk kepemimpinan instruksional. Dengan <strong>Paket AI Kepala Sekolah Pro</strong> dari Studihome, supervisi akademik menjadi lebih efektif dan terukur.</p><p>Fitur unggulan meliputi:</p><ul><li>Analisis otomatis data kinerja guru berdasarkan indikator kunci</li><li>Template supervisi yang bisa dikustomisasi sesuai kebutuhan sekolah</li><li>Laporan berkala yang langsung bisa digunakan untuk rapat komite</li><li>Sistem penilaian objektif yang bebas dari subjektivitas</li></ul><p>Dengan pendekatan data-driven, kepala sekolah bisa mengambil keputusan yang lebih tepat untuk pengembangan kualitas pengajaran di sekolahnya.</p>',
      image: '',
      category: 'Pendidikan',
      tags: ['Kepala Sekolah', 'Supervisi', 'AI', 'Manajemen'],
      status: 'published',
      createdAt: '2026-08-22T10:00:00Z',
      updatedAt: '2026-08-22T10:00:00Z'
    },
    {
      id: 'art-003',
      title: 'Rahasia UMKM Laris Manis dengan Otomasi Konten & Copywriting AI',
      slug: 'umkm-laris-otomasi-konten-copywriting-ai',
      excerpt: 'Tinggalkan cara lama. Gunakan Kit Otomasi AI untuk memproduksi konten jualan, caption, dan follow-up pelanggan secara otomatis 24/7.',
      content: '<p>Pemilik usaha kecil sering kehabisan waktu untuk promosi. Melalui <strong>Kit Otomasi Penjualan & Konten AI UMKM</strong>, Anda bisa memproduksi konten berkualitas tinggi tanpa harus menjadi copywriter profesional.</p><p>Yang bisa Anda lakukan dengan Kit ini:</p><ul><li>Buat caption Instagram, TikTok, dan Facebook secara otomatis</li><li>Generate deskripsi produk yang menarik dan SEO-friendly</li><li>Otomasi follow-up email dan WhatsApp untuk pelanggan potensial</li><li>Buat script telepon sales yang efektif</li></ul><p>Lebih dari 500 UMKM di Indonesia sudah membuktikan peningkatan omzet hingga 3x lipat setelah menggunakan solusi otomasi dari Studihome.</p>',
      image: '',
      category: 'Bisnis',
      tags: ['UMKM', 'Otomasi', 'Copywriting', 'Digital Marketing'],
      status: 'published',
      createdAt: '2026-08-24T09:00:00Z',
      updatedAt: '2026-08-24T09:00:00Z'
    },
    {
      id: 'art-004',
      title: 'Mengenal Studihome: Platform Agentic AI Terdepan di Indonesia',
      slug: 'mengenal-studihome-platform-agentic-ai-indonesia',
      excerpt: 'Dari ruang Lobi hingga Studio, ketahui mengapa Studihome menjadi ekosistem wajib bagi pendidik dan kreator di era Generative AI.',
      content: '<p>Studihome hadir membebaskan Anda dari tugas repetitif. Kami menyediakan koleksi prompt, template, dan solusi <strong>Agentic AI</strong> yang dirancang khusus untuk kebutuhan pendidikan dan bisnis di Indonesia.</p><p><strong>Apa itu Studihome?</strong></p><ul><li>Platform all-in-one untuk produk digital, modul pembelajaran, dan tools AI</li><li>Dikelola oleh kreator-kreator terverifikasi dari berbagai bidang</li><li>Sistem membership fleksibel — beli per paket atau langganan bulanan</li><li>Dashboard creator untuk mengelola produk dan portofolio</li></ul><p>Mengapa harus Studihome?</p><p>Karena kami percaya bahwa teknologi AI seharusnya bisa diakses oleh semua orang — guru, UMKM, profesional, dan kreator. Bukan hanya untuk perusahaan besar.</p><p><strong>Saat ini Studihome memiliki lebih dari 50 produk digital aktif</strong> yang mencakup berbagai kategori: pendidikan, bisnis, kreatif, dan produktivitas.</p>',
      image: '',
      category: 'Tentang Kami',
      tags: ['Studihome', 'Platform AI', 'Agentic AI', 'Indonesia'],
      status: 'published',
      createdAt: '2026-08-26T07:00:00Z',
      updatedAt: '2026-08-26T07:00:00Z'
    }
  ];

  // ---- Data helpers ----
  function getAll() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
      if (stored && Array.isArray(stored) && storedVersion >= CURRENT_VERSION) {
        return stored;
      }
    } catch (e) { /* fall through */ }
    // Initialize with seed data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES));
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    return SEED_ARTICLES.slice();
  }

  function getPublished() {
    return getAll().filter(a => a.status === 'published');
  }

  function getBySlug(slug) {
    return getAll().find(a => a.slug === slug && a.status === 'published') || null;
  }

  function getById(id) {
    return getAll().find(a => a.id === id) || null;
  }

  function save(article) {
    const articles = getAll();
    if (!article.id) {
      article.id = 'art-' + Date.now().toString(36);
    }
    // Auto-generate slug from title
    if (!article.slug || article.titleChanged) {
      article.slug = slugify(article.title);
      delete article.titleChanged;
    }
    article.updatedAt = new Date().toISOString();
    if (!article.createdAt) article.createdAt = article.updatedAt;

    const idx = articles.findIndex(a => a.id === article.id);
    if (idx >= 0) {
      articles[idx] = { ...articles[idx], ...article };
    } else {
      articles.push(article);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    return article;
  }

  function remove(id) {
    const articles = getAll().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }

  function slugify(text) {
    return (text || 'article')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  }

  // ---- HTML helpers ----
  function renderCardHTML(article, showExcerpt) {
    const dateStr = new Date(article.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const categoryColors = {
      'Pendidikan': 'bg-blue-100 text-blue-700',
      'Bisnis': 'bg-amber-100 text-amber-700',
      'Tentang Kami': 'bg-emerald-100 text-emerald-700'
    };
    const catClass = categoryColors[article.category] || 'bg-slate-100 text-slate-600';
    const hasImage = article.image && article.image.trim();

    return `<article class="blog-card group cursor-pointer" onclick="App.blog.openArticle('${article.slug}')">
      <div class="card-3d rounded-2xl overflow-hidden bg-white border border-blue-50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        ${hasImage ? `<div class="aspect-video overflow-hidden bg-slate-100">
          <img src="${esc(article.image)}" alt="${esc(article.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
        </div>` : `<div class="aspect-video bg-gradient-to-br from-[#151c75] to-[#3f48bf] flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 opacity-10" style="background:radial-gradient(circle at 30% 40%, rgba(250,204,21,.4) 0%, transparent 60%)"></div>
          <span class="text-white/80 text-4xl font-black relative z-10">${(article.title || 'S').charAt(0).toUpperCase()}</span>
        </div>`}
        <div class="p-3">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${catClass}">${esc(article.category || 'Artikel')}</span>
            <span class="text-[10px] text-slate-400">${dateStr}</span>
          </div>
          <h3 class="text-sm font-extrabold text-[#151c75] leading-snug mb-1 line-clamp-2 group-hover:text-[#3f48bf] transition-colors">${esc(article.title)}</h3>
          ${showExcerpt !== false ? `<p class="text-xs text-slate-500 leading-relaxed line-clamp-2">${esc(article.excerpt || '')}</p>` : ''}
        </div>
      </div>
    </article>`;
  }

  function renderArticleDetail(article, products) {
    const dateStr = new Date(article.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const hasImage = article.image && article.image.trim();

    // Contextual promo banner logic
    const cat = (article.category || '').toLowerCase();
    const tags = (article.tags || []).map(t => t.toLowerCase()).join(' ');
    const allText = cat + ' ' + tags;

    let promo = {};
    if (allText.includes('umkm') || allText.includes('bisnis') || allText.includes('penjualan')) {
      promo = {
        badge: '🔥 Promo Khusus Pembaca Bisnis',
        title: 'Otomatiskan Penjualan & Konten UMKM Anda!',
        desc: 'Kit Otomasi Penjualan & Konten AI — produksi konten jualan, caption, follow-up pelanggan secara otomatis 24/7.',
        originalPrice: 250000,
        promoPrice: 111000,
        cta: 'Ambil Promo Sekarang'
      };
    } else if (allText.includes('guru') || allText.includes('sekolah') || allText.includes('pendidikan') || allText.includes('kepala')) {
      promo = {
        badge: '🔥 Promo Khusus Pendidik',
        title: 'Paket AI Lengkap untuk Guru & Sekolah!',
        desc: 'Paket AI Kepala Sekolah Pro + Guru Produktif — RPP, modul ajar, asesmen, dan supervisi digital dalam satu langganan.',
        originalPrice: 199000,
        promoPrice: 99000,
        cta: 'Ambil Promo Sekarang'
      };
    } else {
      promo = {
        badge: '🔥 Promo Starter Pack',
        title: 'Mulai Perjalanan AI Anda di Studihome!',
        desc: 'Studihome Starter Pack — akses koleksi prompt, template, dan solusi Agentic AI untuk produktivitas tanpa batas.',
        originalPrice: 149000,
        promoPrice: 49000,
        cta: 'Klaim Promo Sekarang'
      };
    }

    const discount = Math.round((1 - promo.promoPrice / promo.originalPrice) * 100);

    let promoHTML = `
      <aside aria-label="Penawaran Spesial" class="blog-article-promo rounded-2xl overflow-hidden shadow-xl" style="background:linear-gradient(135deg,#1a3a8a,#2d5be3);padding:1px">
        <div class="rounded-2xl" style="display:flex;flex-wrap:wrap;align-items:center;gap:clamp(16px,2vw,28px);padding:clamp(20px,3vw,32px);background:linear-gradient(135deg,#1e3a8a,#3b5bdb)">
          <!-- Left: text -->
          <div style="flex:1 1 360px;min-width:0;display:flex;flex-direction:column;align-items:flex-start">
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;white-space:nowrap;background:rgba(250,204,21,.2);color:#facc15">${promo.badge}</span>
            <h3 style="color:#fff;font-size:18px;font-weight:800;line-height:1.3;margin:0">${promo.title}</h3>
          </div>

          <!-- Right: CTA -->
          <div style="flex:1 1 260px;min-width:min(100%,260px);max-width:360px">
            <button onclick="App.router.navigate('products')" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:800;white-space:nowrap;cursor:pointer;border:none;transition:all .2s;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1e3a8a;box-shadow:0 4px 14px rgba(245,158,11,.35)" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(245,158,11,.45)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 14px rgba(245,158,11,.35)'">
              ${promo.cta} <i class="fa-solid fa-arrow-right" style="font-size:12px"></i>
            </button>
          </div>
        </div>
      </aside>`;

    // ISO date for <time datetime>
    const isoDate = article.createdAt ? article.createdAt.slice(0, 10) : '';
    const readMin = Math.ceil((article.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

    return `
      <style>
        .blog-article-page{width:min(100%,80rem);margin:0 auto;padding:clamp(1.25rem,3vw,2rem) 0 clamp(2.5rem,5vw,3rem);box-sizing:border-box}
        .blog-article-canvas,.blog-article-promo{width:100%;box-sizing:border-box}
        .blog-article-inner{padding:clamp(1.75rem,5vw,2.5rem) clamp(.75rem,4vw,3rem) clamp(1.5rem,4vw,2.5rem)}
        .blog-article-back{margin-bottom:clamp(1.25rem,2.5vw,1.75rem)}
        .blog-article-category{margin:0 0 clamp(1.25rem,2.5vw,1.75rem)}
        .blog-article-actions{margin:clamp(3rem,6.5vw,4.25rem) 0 clamp(.75rem,2vw,1.25rem);padding-top:clamp(1.5rem,3vw,2rem)}
        @media (max-width:639px){.blog-article-canvas,.blog-article-promo{width:min(100vw,calc(100% + 16px));margin-left:50%;margin-right:0;transform:translateX(-50%)}.blog-article-inner{padding-inline:clamp(.875rem,4vw,1.25rem)}}
      </style>
      <div class="blog-article-page">
        <!-- Back button -->
        <button onclick="App.router.navigate('home')" class="blog-article-back inline-flex items-center gap-1.5 text-xs font-bold text-[#151c75] hover:text-[#3f48bf] transition-colors">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Teras
        </button>

        <!-- White Canvas Article Container -->
        <article class="blog-article-canvas w-full bg-white rounded-3xl md:shadow-md md:border border-slate-100 overflow-hidden mb-8">
          <div class="blog-article-inner">
            <!-- Category (semantic) -->
            <nav aria-label="Kategori Artikel" class="blog-article-category">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                <i class="fa-solid fa-folder-open text-[9px]"></i>${esc(article.category || 'Artikel')}
              </span>
            </nav>

            <!-- Title (H1 semantic) -->
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">${esc(article.title)}</h1>

            <!-- Meta: date + reading time (semantic <time>) -->
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">
              ${isoDate ? '<time datetime="' + isoDate + '" class="inline-flex items-center gap-1"><i class="fa-regular fa-calendar"></i>' + dateStr + '</time>' : '<span><i class="fa-regular fa-calendar mr-1"></i>' + dateStr + '</span>'}
              <span class="inline-flex items-center gap-1"><i class="fa-regular fa-clock"></i>${readMin} menit baca</span>
            </div>

            <!-- Hero image -->
            ${hasImage ? `<figure class="rounded-2xl overflow-hidden mb-8 bg-slate-50 border border-slate-100">
              <img src="${esc(article.image)}" alt="${esc(article.title)}" class="w-full object-cover" style="max-height:440px" loading="eager">
            </figure>` : ''}

            <!-- Article body -->
            <div class="prose prose-sm max-w-none text-slate-700 leading-relaxed" style="font-size:15px;line-height:1.85">
              ${App.blog.processContent(article.content || '<p class="text-slate-400 italic">Konten artikel belum tersedia.</p>')}
            </div>

            <!-- Tags + Share (inline) -->
            <div class="blog-article-actions flex flex-wrap items-center justify-between gap-4 border-t border-slate-100/80">
              <!-- Left: tags -->
              ${article.tags && article.tags.length ? '<div class="flex flex-wrap gap-2">' + article.tags.map(t => '<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors">#' + esc(t) + '</span>').join('') + '</div>' : ''}
              <!-- Right: single share button -->
              <button onclick="App.blog.shareArticle('${esc(article.title)}', '${esc(article.slug)}')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-full transition-colors shrink-0">
                <i class="fa-solid fa-share-nodes text-xs"></i> Bagikan
              </button>
            </div>
          </div>
        </article>

        <!-- Contextual Promo Banner (OUTSIDE white canvas) -->
        ${promoHTML}
      </div>`;
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
    );
  }

  // Process article content: wrap prompt blocks with styled container + copy button
  function processContent(html) {
    if (!html) return '';
    return html.replace(/<pre><code(?:\s+class="prompt-block")?>([\s\S]*?)<\/code><\/pre>/gi, function(match, code) {
      const decoded = code.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      const id = 'pb-' + Math.random().toString(36).slice(2, 8);
      return '<figure class="my-6 relative rounded-2xl overflow-hidden border border-slate-700/50" style="background:linear-gradient(145deg,#0f172a,#1e293b)">' +
        '<figcaption class="flex items-center justify-between px-5 py-3 border-b border-white/5">' +
          '<span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider"><i class="fa-solid fa-terminal text-[10px]"></i>Prompt AI</span>' +
          '<button onclick="App.blog.copyPrompt(this, \' '+id+'\')" class="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white backdrop-blur-sm transition-all duration-200" style="background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)" data-id="'+id+'">' +
            '<i class="fa-regular fa-copy text-[11px]"></i> <span class="btn-label">Salin Prompt</span>' +
          '</button>' +
        '</figcaption>' +
        '<pre id="'+id+'" class="p-5 overflow-x-auto text-[13px] md:text-sm leading-relaxed text-blue-100" style="margin:0;background:transparent;font-family:\'JetBrains Mono\',\'Fira Code\',\'Cascadia Code\',monospace;tab-size:2"><code>' + decoded + '</code></pre>' +
      '</figure>';
    });
  }

  function shareArticle(title, slug) {
    const url = 'https://studihome.id/blog/' + slug;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        App.ui && App.ui.toast && App.ui.toast('Link artikel disalin!', 'success');
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); App.ui && App.ui.toast && App.ui.toast('Link artikel disalin!', 'success'); } catch(e) {}
        document.body.removeChild(ta);
      });
    }
  }

  function copyPrompt(btn, id) {
    const pre = document.getElementById(id);
    if (!pre) return;
    const text = pre.textContent || pre.innerText;
    const label = btn.querySelector('.btn-label');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (label) label.textContent = 'Tersalin! \u2705';
        btn.classList.add('text-emerald-400');
        setTimeout(() => { if (label) label.textContent = 'Salin Prompt'; btn.classList.remove('text-emerald-400'); }, 2000);
      }).catch(() => fallbackCopy(text, btn, label));
    } else {
      fallbackCopy(text, btn, label);
    }
  }

  function fallbackCopy(text, btn, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); if (label) label.textContent = 'Tersalin! \u2705'; btn.classList.add('text-emerald-400'); setTimeout(() => { if (label) label.textContent = 'Salin'; btn.classList.remove('text-emerald-400'); }, 2000); } catch(e) {}
    document.body.removeChild(ta);
  }

  // ---- Blog module (App.blog) ----
  window.App = window.App || {};
  App.blog = {
    getAll,
    getPublished,
    getBySlug,
    getById,
    save,
    remove,
    renderCardHTML,
    renderArticleDetail,
    slugify,
    processContent,
    copyPrompt,
    shareArticle,

    // Open article detail page
    // Render blog listing page
    renderPage() {
      const main = document.getElementById('main-content');
      if (!main) return;
      const articles = this.getPublished();
      if (articles.length === 0) {
        main.innerHTML = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div class="text-center py-16">
            <i class="fa-regular fa-newspaper text-4xl text-slate-300 mb-4"></i>
            <h2 class="text-lg font-bold text-slate-400">Belum ada artikel</h2>
            <p class="text-xs text-slate-400 mt-1">Artikel akan segera hadir.</p>
          </div>
        </div>`;
        return;
      }
      main.innerHTML = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onclick="App.router.navigate('home')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#151c75] hover:text-[#3f48bf] transition-colors mb-6">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Teras
        </button>
        <h1 class="text-2xl sm:text-3xl font-black text-[#151c75] mb-2">Blog & Artikel</h1>
        <p class="text-sm text-slate-500 mb-8">Insights, tips, dan berita terbaru seputar AI dan pendidikan.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          ${articles.map(a => this.renderCardHTML(a)).join('')}
        </div>
      </div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this._startAutoSlider();
    },

    // Start slider after render
    _startAutoSlider() {
      if (App.featuredSlider) {
        setTimeout(() => App.featuredSlider.start(), 500);
      }
    },

    openArticle(slug) {
      const article = getBySlug(slug);
      if (!article) { App.router.navigate('home'); return; }
      const main = document.getElementById('main-content');
      if (!main) return;
      const data = App.state.publicData || {};
      const products = data.products || [];
      main.innerHTML = `<div class="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-8 sm:py-12">${renderArticleDetail(article, products)}</div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Update SEO
      App.ui.updateSeo({
        title: article.title + ' | Studihome',
        description: article.excerpt || article.title,
        path: '/blog/' + article.slug,
        ogType: 'article'
      });
    }
  };
})();
