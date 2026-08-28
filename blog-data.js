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

    // Share URLs
    const shareUrl = encodeURIComponent('https://studihome.id/blog/' + article.slug);
    const shareTitle = encodeURIComponent(article.title);

    let promoHTML = `
      <div class="max-w-4xl mx-auto mt-16 mb-20 rounded-3xl overflow-hidden" style="background:linear-gradient(135deg,#1e1b4b,#312e81,#0f172a)">
        <div class="relative px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
          <!-- Urgency badge -->
          <span class="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-lg">${promo.badge}</span>
          <!-- Left: copy -->
          <div class="flex-1 pt-6 sm:pt-0">
            <h2 class="text-xl sm:text-2xl font-black text-white leading-tight mb-2">${promo.title}</h2>
            <p class="text-sm text-indigo-200 leading-relaxed mb-4">${promo.desc}</p>
            <div class="flex items-baseline gap-3">
              <span class="text-sm text-indigo-300 line-through">Rp ${promo.originalPrice.toLocaleString('id-ID')}</span>
              <span class="text-2xl font-black text-amber-400">Rp ${promo.promoPrice.toLocaleString('id-ID')}</span>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full">HEMAT ${Math.round((1 - promo.promoPrice / promo.originalPrice) * 100)}%</span>
            </div>
          </div>
          <!-- Right: CTA -->
          <div class="shrink-0 w-full sm:w-auto">
            <button onclick="App.router.navigate('products')" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-black bg-white text-indigo-900 hover:scale-105 transition-transform duration-200 shadow-xl shadow-indigo-900/30">
              ${promo.cta} <i class="fa-solid fa-arrow-right text-sm"></i>
            </button>
          </div>
        </div>
      </div>`;

    // ISO date for <time datetime>
    const isoDate = article.createdAt ? article.createdAt.slice(0, 10) : '';
    const readMin = Math.ceil((article.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:px-12 md:py-10">
        <!-- Back button -->
        <button onclick="App.router.navigate('home')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#151c75] hover:text-[#3f48bf] transition-colors mb-6">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Beranda
        </button>

        <!-- White Canvas Article Container -->
        <article class="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden mb-16">
          <div class="px-5 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10">
            <!-- Category (semantic) -->
            <nav aria-label="Kategori Artikel" class="mb-4">
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

            <!-- Tags (semantic) -->
            ${article.tags && article.tags.length ? '<nav aria-label="Tag Artikel" class="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">' + article.tags.map(t => '<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors">#' + esc(t) + '</span>').join('') + '</nav>' : ''}

            <!-- Share buttons -->
            <hr class="my-8 border-slate-100">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <span class="text-xs font-medium text-slate-400">Bagikan wawasan ini:</span>
              <div class="flex items-center gap-2.5">
                <a href="https://wa.me/?text=${shareTitle}%20${shareUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all" title="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 transition-all" title="Twitter/X">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <button onclick="navigator.clipboard.writeText('https://studihome.id/blog/${article.slug}'); const b=this; const t=b.querySelector('.share-label'); if(t) t.textContent='Tersalin! ✅'; setTimeout(()=>{ if(t) t.textContent='Link'; },2000)" class="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all text-[11px] font-bold" title="Salin Link">
                  <i class="fa-solid fa-link text-[11px]"></i> <span class="share-label">Link</span>
                </button>
              </div>
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
          '<button onclick="App.blog.copyPrompt(this, \''+id+'\')" class="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white backdrop-blur-sm transition-all duration-200" style="background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)" data-id="'+id+'">' +
            '<i class="fa-regular fa-copy text-[11px]"></i> <span class="btn-label">Salin Prompt</span>' +
          '</button>' +
        '</figcaption>' +
        '<pre id="'+id+'" class="p-5 overflow-x-auto text-[13px] md:text-sm leading-relaxed text-blue-100" style="margin:0;background:transparent;font-family:\'JetBrains Mono\',\'Fira Code\',\'Cascadia Code\',monospace;tab-size:2"><code>' + decoded + '</code></pre>' +
      '</figure>';
    });
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
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Beranda
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
      main.innerHTML = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">${renderArticleDetail(article, products)}</div>`;
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
