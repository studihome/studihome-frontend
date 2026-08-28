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

    let crossSellHTML = '';
    if (products && products.length > 0) {
      const featured = products.filter(p => p.isFeatured).slice(0, 3);
      if (featured.length > 0) {
        crossSellHTML = `
          <div class="mt-12 pt-8 border-t border-slate-200">
            <h3 class="text-lg font-extrabold text-[#151c75] mb-1">Produk yang Direkomendasikan</h3>
            <p class="text-xs text-slate-500 mb-5">Solusi AI yang bisa langsung Anda gunakan</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              ${featured.map(p => `<div class="card-3d rounded-2xl p-4 bg-white border border-blue-50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer" onclick="App.router.navigate('products')">
                <div class="font-bold text-sm text-[#151c75] mb-1 line-clamp-1">${esc(p.title)}</div>
                <div class="text-xs text-slate-500 line-clamp-2 mb-2">${esc(p.description || '')}</div>
                <div class="font-extrabold text-amber-600 text-sm">Rp ${(p.price || 0).toLocaleString('id-ID')}</div>
              </div>`).join('')}
            </div>
          </div>`;
      }
    }

    return `
      <div class="max-w-3xl mx-auto">
        <!-- Back button -->
        <button onclick="App.router.navigate('home')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#151c75] hover:text-[#3f48bf] transition-colors mb-6">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Beranda
        </button>

        <!-- Article header -->
        <article>
          <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700 mb-3">${esc(article.category || 'Artikel')}</span>
          <h1 class="text-xl sm:text-2xl font-black text-[#151c75] leading-tight mb-3">${esc(article.title)}</h1>
          <div class="flex items-center gap-3 text-xs text-slate-500 mb-6">
            <span><i class="fa-regular fa-calendar mr-1"></i>${dateStr}</span>
            <span><i class="fa-regular fa-clock mr-1"></i>${Math.ceil((article.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200)} menit baca</span>
          </div>

          ${hasImage ? `<div class="rounded-2xl overflow-hidden mb-6 bg-slate-100">
            <img src="${esc(article.image)}" alt="${esc(article.title)}" class="w-full object-cover" style="max-height:400px">
          </div>` : ''}

          <!-- Article body -->
          <div class="prose prose-sm max-w-none text-slate-700 leading-relaxed" style="font-size:14px;line-height:1.8">
            ${App.blog.processContent(article.content || '<p class="text-slate-400 italic">Konten artikel belum tersedia.</p>')}
          </div>

          <!-- Tags -->
          ${article.tags && article.tags.length ? `<div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-200">
            ${article.tags.map(t => `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">#${esc(t)}</span>`).join('')}
          </div>` : ''}
        </article>

        <!-- Cross-sell products -->
        ${crossSellHTML}
      </div>`;
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
    );
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
