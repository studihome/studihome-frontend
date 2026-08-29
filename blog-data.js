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
  const CURRENT_VERSION = 4;

  // ---- Seed articles (SEO/GEO optimized) ----
  const SEED_ARTICLES = [
    {
      id: 'art-001',
      title: 'Cara Agentic AI Memangkas 70% Beban Administrasi Guru di 2026',
      slug: 'agentic-ai-mangkas-beban-administrasi-guru',
      excerpt: 'Pelajari bagaimana platform AI mengubah cara guru membuat RPP dan modul ajar hanya dalam hitungan menit, bukan lagi berjam-jam.',
      content: '<p>Berdasarkan riset terbaru, implementasi <strong>Agentic AI</strong> dari Studihome terbukti memangkas waktu pengerjaan administrasi sekolah hingga 72%. Guru tidak perlu lagi menghabiskan waktu berjam-jam untuk membuat RPP manual.</p><p>Dengan <strong>Agentic AI</strong>, guru cukup memberikan instruksi singkat — misalnya "Buatkan RPP Tema Lingkungan untuk Kelas 4 SD, Kurikulum Merdeka" — dan AI akan membuatkan rencana pelaksanaan pembelajaran yang lengkap dan sesuai standar nasional.</p><p><strong>Keunggulan utama:</strong></p><ul><li>Otomatisasi pembuatan RPP, modul ajar, dan soal asesmen</li><li>Integrasi langsung dengan Kurikulum Merdeka terbaru</li><li>Gratis untuk guru aktif melalui Studihome</li><li>Hasil bisa diunduh dalam format PDF</li></ul><p>Mulai sekarang, bebaskan diri dari beban administrasi yang menguras waktu dan energi Anda.</p>',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      category: 'Tentang Kami',
      tags: ['Studihome', 'Platform AI', 'Agentic AI', 'Indonesia'],
      status: 'published',
      createdAt: '2026-08-26T07:00:00Z',
      updatedAt: '2026-08-26T07:00:00Z'
    },
    {
      id: 'art-005',
      title: 'Cara Membuat 30 Konten Jualan UMKM dalam 5 Menit dengan Prompt AI',
      slug: 'cara-membuat-30-konten-jualan-umkm-dengan-prompt-ai',
      excerpt: 'Panduan praktis untuk pemilik UMKM mengotomatiskan pembuatan caption, ide jualan, dan skrip video pendek hanya menggunakan 1 Master Prompt.',
      content: '<h2>Konten konsisten tanpa menghabiskan hari kerja</h2><p>Pemilik UMKM sering mengetahui produknya dengan sangat baik, tetapi waktu untuk menulis caption, menentukan sudut promosi, dan membuat skrip video sangat terbatas. Prompt yang terstruktur membantu AI menjaga konteks produk, target pelanggan, dan tujuan penjualan dalam satu alur kerja.</p><h3>Mulai dari satu brief yang jelas</h3><p>Tentukan produk, manfaat utama, persona audiens, gaya bahasa, dan penawaran. Setelah itu, minta AI menyusun variasi konten agar pesan tetap konsisten tanpa terdengar berulang.</p><pre><code class="prompt-block">Anda adalah strategist konten untuk UMKM Indonesia. Buatkan 30 ide konten jualan untuk produk [NAMA PRODUK]. Target pelanggan: [TARGET]. Manfaat utama: [MANFAAT]. Gunakan gaya bahasa [GAYA]. Bagi hasil menjadi caption Instagram, hook video pendek, CTA, dan ide visual. Pastikan tiap ide memiliki sudut berbeda dan tidak membuat klaim yang tidak dapat dibuktikan.</code></pre><p>Tinjau hasil AI sebelum dipublikasikan. Sesuaikan harga, stok, promo, dan fakta produk dengan kondisi bisnis yang sebenarnya.</p>',
      image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80',
      category: 'UMKM & Bisnis',
      tags: ['UMKM', 'Copywriting', 'Otomasi AI', 'Marketing'],
      status: 'published',
      createdAt: '2026-08-29T08:00:00Z',
      updatedAt: '2026-08-29T08:00:00Z'
    },
    {
      id: 'art-006',
      title: 'Script Prompt AI Balas Chat Pelanggan 10x Lebih Cepat & Auto-Closing',
      slug: 'script-prompt-ai-balas-chat-pelanggan-auto-closing',
      excerpt: 'Ubah AI menjadi Asisten Admin WhatsApp 24/7 yang mampu menjawab pertanyaan pelanggan, menangani komplain, dan meningkatkan konversi penjualan.',
      content: '<h2>Respons cepat tetap harus terasa manusiawi</h2><p>Chat pelanggan yang terlambat dibalas dapat membuat peluang penjualan hilang. AI dapat membantu menyiapkan draf jawaban, tetapi admin tetap perlu memeriksa stok, harga, kebijakan pengiriman, dan nada komunikasi sebelum mengirimkan pesan.</p><h3>Struktur untuk menangani keberatan</h3><p>Mulai dengan mengakui pertanyaan pelanggan, jelaskan manfaat yang relevan, sampaikan bukti atau detail yang tersedia, lalu arahkan ke langkah berikutnya. Untuk komplain, jangan menjanjikan solusi yang belum disetujui tim operasional.</p><pre><code class="prompt-block">Bertindak sebagai admin WhatsApp untuk [NAMA BISNIS]. Buatkan 3 draf balasan yang ramah, singkat, dan akurat untuk pesan pelanggan berikut: [PESAN PELANGGAN]. Gunakan data produk ini: [DATA PRODUK]. Jika informasi tidak tersedia, minta klarifikasi dan jangan mengarang. Akhiri dengan CTA yang sesuai: katalog, checkout, atau konsultasi singkat.</code></pre><p>Gunakan draf sebagai bantuan kerja, bukan pengganti verifikasi manusia untuk harga, pembayaran, retur, atau keluhan sensitif.</p>',
      image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80',
      category: 'UMKM & Bisnis',
      tags: ['UMKM', 'Customer Service', 'Sales', 'Otomasi'],
      status: 'published',
      createdAt: '2026-08-29T08:05:00Z',
      updatedAt: '2026-08-29T08:05:00Z'
    },
    {
      id: 'art-007',
      title: 'Master Prompt Pembuat Modul Ajar & RPP Kurikulum Merdeka 2026',
      slug: 'master-prompt-pembuat-modul-ajar-rpp-kurikulum-merdeka',
      excerpt: 'Pangkas waktu administrasi mengajar hingga 70%. Cukup masukkan topik pelajaran, AI akan menyusun modul ajar lengkap dengan rubrik penilaian.',
      content: '<h2>Administrasi mengajar perlu ringkas, bukan asal cepat</h2><p>Guru memerlukan waktu untuk memahami kebutuhan murid, menyusun aktivitas, dan menilai pembelajaran. AI dapat mempercepat draf modul ajar, tetapi hasilnya tetap perlu ditelaah agar sesuai fase, konteks sekolah, capaian pembelajaran, dan kebutuhan peserta didik.</p><h3>Gunakan parameter pembelajaran yang lengkap</h3><p>Masukkan mata pelajaran, fase, topik, alokasi waktu, profil murid, tujuan pembelajaran, serta bentuk asesmen. Dengan parameter tersebut, AI dapat menyusun struktur awal yang lebih mudah diperiksa dan disempurnakan.</p><pre><code class="prompt-block">Buatkan draf modul ajar Kurikulum Merdeka untuk mata pelajaran [MAPEL], fase [FASE], topik [TOPIK], durasi [ALOKASI WAKTU]. Sertakan tujuan pembelajaran, pemahaman bermakna, langkah kegiatan, diferensiasi, asesmen diagnostik-formatif-sumatif, dan rubrik penilaian. Gunakan bahasa Indonesia yang jelas. Tandai bagian yang harus diverifikasi guru terhadap kebijakan sekolah dan kebutuhan murid.</code></pre><p>Gunakan output sebagai draf kerja. Guru tetap menjadi penanggung jawab akhir atas akurasi materi, asesmen, dan keputusan pedagogis.</p>',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      category: 'Pendidikan & Guru',
      tags: ['Guru Produktif', 'Kurikulum Merdeka', 'RPP AI', 'Pendidikan'],
      status: 'published',
      createdAt: '2026-08-29T08:10:00Z',
      updatedAt: '2026-08-29T08:10:00Z'
    },
    {
      id: 'art-008',
      title: 'Era Agentic AI 2026: Mengapa Chatbot Biasa Ketinggalan Zaman?',
      slug: 'era-agentic-ai-2026-mengapa-chatbot-biasa-ketinggalan-zaman',
      excerpt: 'Simak revolusi AI terbaru di mana Agentic AI tidak sekadar menjawab pertanyaan, tetapi mampu mengeksekusi alur kerja kompleks secara mandiri.',
      content: '<h2>Dari jawaban menjadi orkestrasi pekerjaan</h2><p>Chatbot konvensional umumnya merespons satu pertanyaan pada satu waktu. Agentic AI dirancang untuk membantu mengurai tujuan menjadi langkah kerja, menggunakan alat yang diizinkan, dan meminta konfirmasi ketika keputusan berisiko diperlukan.</p><h3>Chatbot dan AI Agent memiliki peran berbeda</h3><p>Chatbot cocok untuk tanya jawab, pencarian informasi, dan draf singkat. AI Agent lebih relevan saat pekerjaan membutuhkan urutan tindakan, konteks lintas langkah, dan pengawasan manusia. Keduanya tetap memerlukan batas akses, evaluasi kualitas, serta data yang tepat.</p><h3>Penerapan yang bertanggung jawab di Studihome</h3><p>Di Studihome, pendekatan agentic diarahkan untuk membantu penyusunan materi, ide konten, dan alur kerja produktivitas. Output perlu diverifikasi sebelum dipakai untuk keputusan penting, komunikasi eksternal, atau aktivitas yang menyentuh data pribadi.</p><pre><code class="prompt-block">Petakan alur kerja [NAMA PROSES] menjadi langkah yang dapat dibantu AI. Untuk setiap langkah, jelaskan input, output, risiko, data yang tidak boleh diekspos, dan titik persetujuan manusia. Jangan mengeksekusi tindakan eksternal tanpa konfirmasi.</code></pre><p>Masa depan AI bukan sekadar kecepatan respons, tetapi kemampuan membantu pekerjaan secara terukur, aman, dan dapat diaudit.</p>',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      category: 'Teknologi AI',
      tags: ['Agentic AI', 'Otomasi AI', 'Teknologi 2026', 'Trend AI'],
      status: 'published',
      createdAt: '2026-08-29T08:15:00Z',
      updatedAt: '2026-08-29T08:15:00Z'
    }
  ];

  // ---- Data helpers ----
  function getAll() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
      if (stored && Array.isArray(stored)) {
        if (storedVersion >= CURRENT_VERSION) return stored;
        const correctedLegacyImage = 'https://images.unsplash.com/photo-1556742049-0a67daf40955?auto=format&fit=crop&w=800&q=80';
        const seedById = new Map(SEED_ARTICLES.map(article => [article.id, article]));
        const migrated = stored.map(article => {
          if (!article) return article;
          const seed = seedById.get(article.id);
          if (article.id === 'art-005' && article.image === correctedLegacyImage) {
            return Object.assign({}, article, { image: seed.image });
          }
          if (seed && ['art-001', 'art-002', 'art-003', 'art-004'].includes(article.id) && !String(article.image || '').trim()) {
            return Object.assign({}, article, { image: seed.image });
          }
          return article;
        });
        const existingKeys = new Set(migrated.filter(Boolean).flatMap(article => [article.id, article.slug]));
        const additions = SEED_ARTICLES.filter(article => !existingKeys.has(article.id) && !existingKeys.has(article.slug));
        const merged = migrated.concat(additions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
        return merged;
      }
    } catch (e) { /* fall through */ }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES));
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    return SEED_ARTICLES.slice();
  }

  function getPublished() {
    return getAll()
      .filter(a => a.status === 'published')
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function getBySlug(slug) {
    return getAll().find(a => a.slug === slug && a.status === 'published') || null;
  }

  function getById(id) {
    return getAll().find(a => a.id === id) || null;
  }

  function normalizeTags(value) {
    const raw = Array.isArray(value) ? value : String(value || '').split(',');
    const seen = new Set();
    return raw.reduce((tags, item) => {
      const tag = String(item || '').trim().replace(/^#+/, '').slice(0, 40);
      const key = tag.toLocaleLowerCase('id-ID');
      if (tag && !seen.has(key) && tags.length < 12) {
        seen.add(key);
        tags.push(tag);
      }
      return tags;
    }, []);
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
    article.tags = normalizeTags(article.tags);
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
  function normalizeArticleImageSrc(value) {
    const source = String(value || '').trim().split('\\').join('/');
    if (!source) return '';
    if (source.startsWith('data:image/') || source.startsWith('blob:') || source.startsWith('https://') || source.startsWith('http://')) return source;
    if (source.startsWith('//')) return 'https:' + source;
    return '/' + source.replace(/^[./]+/, '');
  }

  function renderBlogImageGuardStyles() {
    return `<style id="blog-mobile-image-guard">
      .balkon-card-media{width:100%;aspect-ratio:16 / 9;height:auto;overflow:hidden}
      .balkon-card-image{width:100%;height:100%;display:block;object-fit:cover;object-position:center}
      .blog-article-hero-image{width:100%;height:220px;display:block;object-fit:cover;object-position:center}
      .blog-article-content img{max-width:100%!important;height:auto!important;display:block!important;margin:1.5rem auto!important;border-radius:.75rem!important}
      @media (min-width:640px){.blog-article-hero-image{height:300px}}
      @media (min-width:768px){.blog-article-hero-image{height:400px}}
    </style>`;
  }

  function getArticleImageSrc(article) {
    const source = normalizeArticleImageSrc(article && article.image);
    if (source) return source;

    // A deterministic, locally rendered cover for articles without an uploaded image.
    // It uses only the article's existing public title/category and avoids remote stock assets.
    const category = String(article && article.category || 'Artikel').replace(/[<>&"]/g, '').slice(0, 28);
    const title = String(article && article.title || 'Studihome').replace(/[<>&"]/g, '').slice(0, 54);
    const palette = category === 'Bisnis'
      ? ['#0f766e', '#14b8a6']
      : category === 'Tentang Kami'
        ? ['#7c3aed', '#a78bfa']
        : ['#151c75', '#3f48bf'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>
      </defs>
      <rect width="1200" height="675" fill="url(#b)"/>
      <circle cx="1040" cy="80" r="220" fill="#facc15" fill-opacity=".22" filter="url(#s)"/>
      <circle cx="160" cy="610" r="260" fill="#fff" fill-opacity=".10" filter="url(#s)"/>
      <path d="M0 510C250 410 520 680 1200 420V675H0Z" fill="#fff" fill-opacity=".10"/>
      <text x="78" y="100" fill="#fff" fill-opacity=".88" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="4">STUDIHOME</text>
      <text x="78" y="165" fill="#fef3c7" font-family="Arial, sans-serif" font-size="26" font-weight="700">${category.toUpperCase()}</text>
      <text x="78" y="510" fill="#fff" font-family="Arial, sans-serif" font-size="52" font-weight="700">${title}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

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
    const imageSrc = getArticleImageSrc(article);

    return `<article class="blog-card"><a href="/balkon/${encodeURIComponent(article.slug)}" data-balkon-link data-balkon-slug="${esc(article.slug)}" class="block h-full group">
      <div class="card-3d rounded-2xl overflow-hidden bg-white border border-blue-50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div class="w-full h-auto overflow-hidden rounded-t-2xl bg-slate-100">
          <img src="${esc(imageSrc)}" alt="${esc(article.title)}" class="block w-full h-[200px] sm:h-[220px] md:h-[240px] object-cover object-center rounded-t-2xl transition-transform duration-700 ease-in-out group-hover:scale-105" loading="lazy">
        </div>
        <div class="p-3">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${catClass}">${esc(article.category || 'Artikel')}</span>
            <span class="text-[10px] text-slate-400">${dateStr}</span>
          </div>
          <h3 class="text-sm font-extrabold text-[#151c75] leading-snug mb-1 line-clamp-2 group-hover:text-[#3f48bf] transition-colors">${esc(article.title)}</h3>
          ${showExcerpt !== false ? `<p class="text-xs text-slate-500 leading-relaxed line-clamp-2">${esc(article.excerpt || '')}</p>` : ''}
        </div>
      </div>
    </a></article>`;
  }

  function renderBalkonCardHTML(article, index) {
    const imageSrc = getArticleImageSrc(article);
    const prioritize = Number(index) < 4;
    const loading = prioritize ? 'eager' : 'lazy';
    const fetchPriority = Number(index) < 2 ? 'high' : 'auto';

    return `<article class="w-full">
      <a href="/balkon/${encodeURIComponent(article.slug)}" data-balkon-link data-balkon-slug="${esc(article.slug)}" class="block w-full cursor-pointer transition-transform hover:-translate-y-1 group">
        <div class="card-3d w-full rounded-2xl overflow-hidden flex flex-col bg-white p-3.5 sm:p-4 border border-slate-200/80 transition-all duration-200 hover:shadow-md">
          <div class="balkon-card-media relative aspect-video w-full rounded-xl overflow-hidden mb-2.5 card-3d-inset">
            <img src="${esc(imageSrc)}" alt="${esc(article.title)}" class="balkon-card-image block w-full h-full object-cover object-center transition-transform duration-700 ease-in-out group-hover:scale-105" loading="${loading}" fetchpriority="${fetchPriority}" referrerpolicy="no-referrer">
          </div>
          <h2 class="font-extrabold text-sm sm:text-base leading-snug text-[#151c75] transition-colors group-hover:text-[#3f48bf]">${esc(article.title)}</h2>
          <p class="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">${esc(article.excerpt || '')}</p>
        </div>
      </a>
    </article>`;
  }

  function renderBalkonPage() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const posts = getPublished();
    const featuredPosts = posts.slice(0, 2);
    const regularPosts = posts.slice(2);
    const featuredCards = featuredPosts.map((article, index) => renderBalkonCardHTML(article, index)).join('');
    const regularCards = regularPosts.map((article, index) => renderBalkonCardHTML(article, index + featuredPosts.length)).join('');

    main.innerHTML = `${renderBlogImageGuardStyles()}<section class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <a href="/" data-balkon-home-link class="inline-flex items-center gap-1.5 text-xs font-bold text-[#151c75] hover:text-[#3f48bf] transition-colors mb-6">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kembali ke Teras
      </a>
      <header class="mb-8 sm:mb-10">
        <h1 class="balkon-title text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-8 flex items-center gap-2 whitespace-nowrap">
          <span class="text-amber-500">Balkon</span>
          <span class="text-blue-900">Studihome</span>
        </h1>
      </header>
      ${posts.length ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">${featuredCards}</div>
        ${regularPosts.length ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${regularCards}</div>` : ''}
      ` : `<div class="rounded-2xl bg-white px-6 py-16 text-center shadow-sm"><i class="fa-regular fa-newspaper text-4xl text-slate-300" aria-hidden="true"></i><h2 class="mt-4 text-lg font-bold text-slate-700">Belum ada artikel</h2><p class="mt-1 text-sm text-slate-500">Artikel baru akan segera hadir.</p></div>`}
    </section>`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function prefetchBalkonArticle(slug) {
    return getBySlug(slug) || null;
  }

  function openBalkonArticle(slug) {
    const article = getBySlug(slug);
    if (!article) { App.router.navigate('balkon'); return; }
    const main = document.getElementById('main-content');
    if (!main) return;
    const data = App.state.publicData || {};
    main.innerHTML = `<div class="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-8 sm:py-12">${renderArticleDetail(article, data.products || [])}</div>`;
    const back = main.querySelector('.blog-article-back');
    if (back) {
      back.onclick = (event) => {
        event.preventDefault();
        App.router.navigate('balkon');
      };
      back.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kembali ke Balkon';
    }
    const canonicalPath = '/balkon/' + encodeURIComponent(article.slug);
    App.ui.updateSeo({
      title: article.title + ' | Balkon Studihome',
      description: article.excerpt || article.title,
      path: canonicalPath,
      ogType: 'article',
      image: article.image || 'https://studihome.id/assets/og-image.png',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt || article.title,
        image: [article.image || 'https://studihome.id/assets/og-image.png'],
        datePublished: article.createdAt || null,
        dateModified: article.updatedAt || article.createdAt || null,
        author: { '@type': 'Organization', name: 'Studihome' },
        publisher: { '@type': 'Organization', name: 'Studihome', url: 'https://studihome.id/' },
        mainEntityOfPage: 'https://studihome.id' + canonicalPath
      }
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function renderArticleDetail(article, products) {
    const dateStr = new Date(article.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const imageSrc = getArticleImageSrc(article);

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

    return `${renderBlogImageGuardStyles()}
      <style>
        .blog-article-page{width:min(100%,80rem);margin:0 auto;padding:0 0 clamp(2.5rem,5vw,3rem);box-sizing:border-box}
        .blog-article-canvas,.blog-article-promo{width:100%;box-sizing:border-box}
        .blog-article-inner{padding:clamp(1.25rem,3vw,2rem) clamp(.75rem,4vw,3rem) clamp(1.5rem,4vw,2.5rem)}
        .blog-article-back{margin-bottom:clamp(1.25rem,2.5vw,1.75rem)}
        .blog-article-category{margin:0 0 clamp(1.25rem,2.5vw,1.75rem)}
        .blog-article-actions{margin:clamp(4.375rem,8.5vw,5.75rem) 0 clamp(.75rem,2vw,1.25rem);padding-top:clamp(1.5rem,3vw,2rem)}
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
            <figure class="rounded-2xl overflow-hidden mb-8 bg-slate-50 border border-slate-100">
              <img src="${esc(imageSrc)}" alt="${esc(article.title)}" class="blog-article-hero-image block w-full h-[220px] sm:h-[300px] md:h-[400px] object-cover object-center rounded-2xl my-6 shadow-md" loading="eager">
            </figure>

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
    const articleImageClass = 'blog-article-content-image block w-full h-auto object-cover rounded-xl my-6';
    const normalizedHtml = html.replace(/<img\b([^>]*)>/gi, function(match, attrs) {
      const sourceMatch = attrs.match(/\ssrc=(["'])(.*?)\1/i);
      const normalizedSource = normalizeArticleImageSrc(sourceMatch ? sourceMatch[2] : '');
      const withoutClass = attrs
        .replace(/\sclass=(["'])[^"']*\1/gi, '')
        .replace(/\ssrc=(["'])(.*?)\1/gi, '');
      const srcAttr = normalizedSource ? ' src="' + esc(normalizedSource) + '"' : '';
      return '<img' + withoutClass + srcAttr + ' class="' + articleImageClass + '" style="max-width:100%;height:auto;display:block;margin:1.5rem auto;border-radius:0.75rem;">';
    });
    return normalizedHtml.replace(/<pre><code(?:\s+class="prompt-block")?>([\s\S]*?)<\/code><\/pre>/gi, function(match, code) {
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
    normalizeTags,
    save,
    remove,
    renderCardHTML,
    renderBalkonPage,
    openBalkonArticle,
    prefetchBalkonArticle,
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
