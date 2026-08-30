'use strict';

const { SEED_ARTICLES = [] } = require('../blog-data.js');

const MAX_PATH_LENGTH = 240;
const MAX_USERNAME_LENGTH = 64;
const MAX_SLUG_LENGTH = 160;
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';


const PSEO_SERVICES = {
  'otomasi-whatsapp': {
    name: 'Otomasi WhatsApp',
    summary: 'Merapikan alur respons, tindak lanjut, dan pencatatan percakapan dengan tetap memberi ruang verifikasi manusia.',
    checklist: ['petakan pertanyaan berulang dan jalur eskalasi', 'siapkan sumber jawaban yang akurat', 'uji persetujuan manusia sebelum pesan penting dikirim'],
    keywords: ['whatsapp', 'automation', 'otomasi', 'workflow', 'customer service', 'sales']
  },
  'ai-content': {
    name: 'Konten dengan AI',
    summary: 'Membantu riset ide, penyusunan draf, dan adaptasi format konten tanpa menghilangkan proses editorial.',
    checklist: ['tetapkan audiens dan tujuan konten', 'susun panduan suara merek', 'verifikasi fakta dan klaim sebelum publikasi'],
    keywords: ['content', 'konten', 'copywriting', 'social media', 'caption', 'marketing']
  },
  'ai-video': {
    name: 'Video dengan AI',
    summary: 'Mempercepat pengembangan konsep, naskah, aset visual, dan variasi video dengan kontrol kualitas yang jelas.',
    checklist: ['tentukan format dan kanal distribusi', 'siapkan naskah serta referensi visual', 'periksa hak penggunaan aset dan hasil akhir'],
    keywords: ['video', 'motion', 'animasi', 'visual', 'affiliate']
  },
  'ai-chatbot': {
    name: 'Chatbot AI',
    summary: 'Menyediakan jalur tanya jawab terstruktur yang merujuk pada sumber resmi dan mengalihkan kasus sensitif kepada manusia.',
    checklist: ['tentukan cakupan pertanyaan yang boleh dijawab', 'hubungkan basis pengetahuan terverifikasi', 'siapkan fallback dan jalur eskalasi'],
    keywords: ['chatbot', 'ai agent', 'agentic', 'customer service', 'support', 'chat']
  },
  'webapp-tanpa-coding': {
    name: 'Webapp Tanpa Coding',
    summary: 'Membangun alur kerja dan aplikasi web ringan melalui alat no-code dengan struktur data serta hak akses yang terencana.',
    checklist: ['petakan pengguna dan proses inti', 'rancang data serta izin akses', 'uji alur utama sebelum digunakan lebih luas'],
    keywords: ['no-code', 'nocode', 'webapp', 'website', 'aplikasi', 'digital operations']
  }
};

const PSEO_INDUSTRIES = {
  umkm: {
    name: 'UMKM',
    context: 'UMKM membutuhkan proses yang hemat waktu, mudah dipelihara, dan tetap sesuai dengan kapasitas tim.',
    priority: 'Mulai dari satu pekerjaan berulang yang paling sering menyita waktu, lalu ukur hasilnya sebelum memperluas otomasi.',
    keywords: ['umkm', 'bisnis lokal', 'usaha', 'sales']
  },
  sekolah: {
    name: 'Sekolah',
    context: 'Sekolah memerlukan solusi yang membantu administrasi dan pembelajaran tanpa mengabaikan kebijakan, privasi, serta keputusan pendidik.',
    priority: 'Tentukan penanggung jawab, sumber data resmi, dan tahap pemeriksaan manusia pada setiap keluaran yang dipakai sekolah.',
    keywords: ['sekolah', 'education', 'edukasi', 'guru', 'pembelajaran']
  },
  klinik: {
    name: 'Klinik',
    context: 'Klinik membutuhkan alur yang menjaga kerahasiaan data serta tidak menggantikan penilaian tenaga kesehatan.',
    priority: 'Batasi otomasi pada proses administratif yang aman dan lakukan telaah privasi sebelum memakai data pasien.',
    keywords: ['klinik', 'health', 'kesehatan', 'administrasi']
  },
  kreator: {
    name: 'Kreator',
    context: 'Kreator membutuhkan produksi yang konsisten sekaligus menjaga orisinalitas, hak penggunaan aset, dan identitas personal.',
    priority: 'Bangun alur dari ide hingga publikasi dengan tahap kurasi agar kualitas dan suara kreator tetap terjaga.',
    keywords: ['creator', 'kreator', 'content', 'video', 'visual']
  },
  'toko-online': {
    name: 'Toko Online',
    context: 'Toko online memerlukan informasi produk, layanan pelanggan, dan tindak lanjut yang konsisten di berbagai kanal.',
    priority: 'Sinkronkan sumber harga, stok, dan kebijakan toko sebelum mengotomatiskan respons atau materi promosi.',
    keywords: ['e-commerce', 'toko online', 'produk', 'sales', 'marketing']
  }
};

const parsePseoSlug = slug => {
  const value = String(slug || '').toLowerCase();
  for (const serviceKey of Object.keys(PSEO_SERVICES)) {
    const prefix = `${serviceKey}-untuk-`;
    if (!value.startsWith(prefix)) continue;
    const industryKey = value.slice(prefix.length);
    if (PSEO_INDUSTRIES[industryKey]) return { serviceKey, industryKey };
  }
  return null;
};

const escapeMarkdown = value => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/([\`*_{}\[\]()#+\-.!|])/g, '\\$1');

const textBlock = value => escapeMarkdown(String(value || '').trim())
  .replace(/\r\n?/g, '\n')
  .replace(/\n{3,}/g, '\n\n');

const decodeHtmlEntities = value => String(value || '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

const htmlToMarkdown = html => {
  let source = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const codeBlocks = [];
  source = source.replace(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(`\n\n\`\`\`text\n${decodeHtmlEntities(code).trim()}\n\`\`\`\n\n`);
    return token;
  });
  source = source
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, value) => `\n\n${'#'.repeat(Number(level))} ${value}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '');
  source = decodeHtmlEntities(source);
  codeBlocks.forEach((block, index) => {
    source = source.replace(`@@CODE_BLOCK_${index}@@`, block);
  });
  return source
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const slugify = value => String(value || '')
  .toLowerCase()
  .trim()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const isUsername = value => value.length <= MAX_USERNAME_LENGTH && /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(value);
const isSlug = value => value.length <= MAX_SLUG_LENGTH && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'index, follow');

  const sendError = (status, markdown) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(status).send(markdown);
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendError(405, '# Method Not Allowed\n');
  }

  let decodedPath = '';
  try {
    const rawPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
    decodedPath = decodeURIComponent(String(rawPath || '')).replace(/^\/+|\/+$/g, '').replace(/\.md$/i, '').trim().toLowerCase();
  } catch (_) {
    return sendError(400, '# Error\n\nParameter rute tidak valid.\n');
  }

  if (!decodedPath || decodedPath.length > MAX_PATH_LENGTH || decodedPath.includes('..')) {
    return sendError(400, '# Error\n\nParameter rute tidak valid.\n');
  }

  const segments = decodedPath.split('/').filter(Boolean);
  const isArticleRoute = segments.length === 2 && segments[0] === 'balkon' && isSlug(segments[1]);
  const isPortfolioRoute = segments.length === 3 && segments[1] === 'portfolio' && isUsername(segments[0]) && isSlug(segments[2]);
  const isCreatorRoute = segments.length === 1 && isUsername(segments[0]);
  const pseoRoute = segments.length === 2 && segments[0] === 'solusi' && isSlug(segments[1])
    ? parsePseoSlug(segments[1])
    : null;
  const isPseoRoute = Boolean(pseoRoute);

  if (!isArticleRoute && !isPortfolioRoute && !isCreatorRoute && !isPseoRoute) {
    return sendError(404, '# 404 Not Found\n\nDokumen Markdown tidak ditemukan.\n');
  }

  if (isArticleRoute) {
    const article = SEED_ARTICLES.find(item => item.status === 'published' && String(item.slug).toLowerCase() === segments[1]);
    if (!article) return sendError(404, '# 404 Not Found\n\nArtikel tidak ditemukan atau belum dipublikasikan.\n');

    let markdown = `# ${textBlock(article.title)}\n\n`;
    if (article.excerpt) markdown += `${textBlock(article.excerpt)}\n\n`;
    markdown += `**Kategori:** ${textBlock(article.category || 'Artikel')}\n\n`;
    if (Array.isArray(article.tags) && article.tags.length) markdown += `**Topik:** ${article.tags.map(textBlock).join(', ')}\n\n`;
    if (article.createdAt) markdown += `**Diterbitkan:** ${textBlock(article.createdAt)}\n\n`;
    if (article.updatedAt) markdown += `**Diperbarui:** ${textBlock(article.updatedAt)}\n\n`;
    if (article.image && /^https:\/\//i.test(article.image)) markdown += `![${escapeMarkdown(article.title)}](${article.image})\n\n`;
    markdown += `${htmlToMarkdown(article.content)}\n\n`;
    markdown += `---\n\nSumber resmi: [Balkon Studihome](https://studihome.id/balkon/${encodeURIComponent(article.slug)})\n`;
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(markdown);
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');
  if (!supabaseUrl || !supabaseAnonKey) return sendError(503, '# Error\n\nLayanan profil belum tersedia.\n');

  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, Accept: 'application/json' };
  const readJson = async url => {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.warn('[markdown] Supabase read failed', response.status);
      const error = new Error('Supabase read failed');
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  try {
    if (isPseoRoute) {
      const service = PSEO_SERVICES[pseoRoute.serviceKey];
      const industry = PSEO_INDUSTRIES[pseoRoute.industryKey];
      const solutionSlug = `${pseoRoute.serviceKey}-untuk-${pseoRoute.industryKey}`;

      let portfolioRows = [];
      let creatorRows = [];
      try {
        const portfolioQuery = new URLSearchParams({
          is_active: 'eq.true',
          select: 'id,creator_id,title,description,media_type,media_url,created_at',
          order: 'created_at.desc',
          limit: '500'
        });
        const creatorQuery = new URLSearchParams({
          is_published: 'eq.true',
          select: 'id,username,display_name',
          limit: '500'
        });
        [portfolioRows, creatorRows] = await Promise.all([
          readJson(`${supabaseUrl}/rest/v1/creator_portfolios?${portfolioQuery}`),
          readJson(`${supabaseUrl}/rest/v1/creator_profiles?${creatorQuery}`)
        ]);
      } catch (error) {
        console.warn('[markdown] pSEO recommendations unavailable', error?.message || error);
        portfolioRows = [];
        creatorRows = [];
      }

      const creatorsById = new Map(
        creatorRows
          .filter(creator => creator?.id && creator?.username)
          .map(creator => [creator.id, creator])
      );
      const serviceKeywords = service.keywords.map(keyword => keyword.toLowerCase());
      const industryKeywords = industry.keywords.map(keyword => keyword.toLowerCase());
      const recommendations = portfolioRows
        .map(portfolio => {
          const creator = creatorsById.get(portfolio.creator_id);
          if (!creator) return null;
          const haystack = `${portfolio.title || ''} ${portfolio.description || ''}`.toLowerCase();
          const serviceScore = serviceKeywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
          if (!serviceScore) return null;
          const industryScore = industryKeywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
          return { portfolio, creator, score: (serviceScore * 3) + industryScore };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || String(a.portfolio.title).localeCompare(String(b.portfolio.title), 'id'))
        .slice(0, 3);

      const title = `${service.name} untuk ${industry.name}`;
      let markdown = `# Solusi ${textBlock(title)}\n\n`;
      markdown += `> Panduan awal Studihome untuk memilih dan menerapkan **${textBlock(service.name)}** pada kebutuhan **${textBlock(industry.name)}** secara terukur.\n\n`;
      markdown += `## Kebutuhan ${textBlock(industry.name)}\n\n${textBlock(industry.context)}\n\n`;
      markdown += `## Pendekatan ${textBlock(service.name)}\n\n${textBlock(service.summary)}\n\n`;
      markdown += `## Prioritas Implementasi\n\n${textBlock(industry.priority)}\n\n`;
      markdown += '## Checklist Awal\n\n';
      service.checklist.forEach(item => { markdown += `- ${textBlock(item)}\n`; });
      markdown += '\n## Rekomendasi Portofolio Publik\n\n';
      if (recommendations.length) {
        recommendations.forEach(({ portfolio, creator }) => {
          const portfolioSlug = slugify(portfolio.title);
          const detailUrl = `https://studihome.id/${encodeURIComponent(creator.username)}/portfolio/${encodeURIComponent(portfolioSlug)}`;
          markdown += `- [${textBlock(portfolio.title)} oleh ${textBlock(creator.display_name || creator.username)}](${detailUrl})\n`;
        });
      } else {
        markdown += 'Belum ada portofolio publik yang cocok secara langsung dengan topik ini. Gunakan [Studio AI](https://studihome.id/studio-ai) untuk menjelajahi Creator berdasarkan kebutuhanmu.\n';
      }
      markdown += `\n---\n\nSumber resmi: [Studihome](https://studihome.id/solusi/${solutionSlug}.md)\n`;
      if (req.method === 'HEAD') return res.status(200).end();
      return res.status(200).send(markdown);
    }

    const username = segments[0];
    const profileQuery = new URLSearchParams({
      username: `eq.${username}`,
      is_published: 'eq.true',
      select: 'id,username,display_name,bio,avatar_url,location,updated_at',
      limit: '1'
    });
    const profiles = await readJson(`${supabaseUrl}/rest/v1/creator_profiles?${profileQuery}`);
    const creator = profiles[0];
    if (!creator) return sendError(404, '# 404 Not Found\n\nCreator tidak ditemukan atau belum dipublikasikan.\n');

    const portfolioQuery = new URLSearchParams({
      creator_id: `eq.${creator.id}`,
      is_active: 'eq.true',
      select: 'id,service_id,title,description,media_type,media_url,created_at',
      order: 'sort_order.asc,created_at.desc',
      limit: '100'
    });
    const portfolios = await readJson(`${supabaseUrl}/rest/v1/creator_portfolios?${portfolioQuery}`);

    if (isPortfolioRoute) {
      const portfolioSlug = segments[2];
      const portfolio = portfolios.find(item => slugify(item.title) === portfolioSlug);
      if (!portfolio) return sendError(404, '# 404 Not Found\n\nPortofolio tidak ditemukan atau belum dipublikasikan.\n');

      let service = null;
      if (portfolio.service_id) {
        try {
          const serviceQuery = new URLSearchParams({
            id: `eq.${portfolio.service_id}`,
            creator_id: `eq.${creator.id}`,
            is_active: 'eq.true',
            select: 'title,description,price_from,price_to,delivery_days',
            limit: '1'
          });
          service = (await readJson(`${supabaseUrl}/rest/v1/creator_services?${serviceQuery}`))[0] || null;
        } catch (_) {
          service = null;
        }
      }

      let markdown = `# ${textBlock(portfolio.title)}\n\n`;
      markdown += `**Creator:** [${textBlock(creator.display_name || creator.username)}](https://studihome.id/${encodeURIComponent(creator.username)})\n\n`;
      markdown += '**Platform:** [Studihome](https://studihome.id/)\n\n';
      if (portfolio.description) markdown += `## Deskripsi\n\n${textBlock(portfolio.description)}\n\n`;
      if (service) {
        markdown += '## Informasi Layanan\n\n';
        if (service.title) markdown += `**Layanan:** ${textBlock(service.title)}\n\n`;
        if (service.description && service.description !== portfolio.description) markdown += `${textBlock(service.description)}\n\n`;
        if (Number.isFinite(Number(service.price_from))) markdown += `**Harga mulai:** Rp${Number(service.price_from).toLocaleString('id-ID')}\n\n`;
        if (Number.isFinite(Number(service.price_to)) && Number(service.price_to) > Number(service.price_from)) markdown += `**Harga hingga:** Rp${Number(service.price_to).toLocaleString('id-ID')}\n\n`;
        if (Number.isInteger(Number(service.delivery_days)) && Number(service.delivery_days) > 0) markdown += `**Estimasi pengerjaan:** ${Number(service.delivery_days)} hari\n\n`;
      }
      if (portfolio.media_url && /^https?:\/\//i.test(portfolio.media_url)) markdown += `[Lihat media portofolio](${portfolio.media_url})\n\n`;
      markdown += `---\n\nSumber resmi: [Studihome](https://studihome.id/${encodeURIComponent(creator.username)}/portfolio/${portfolioSlug})\n`;
      if (req.method === 'HEAD') return res.status(200).end();
      return res.status(200).send(markdown);
    }

    const displayName = textBlock(creator.display_name || creator.username);
    let markdown = `# Profil Creator: ${displayName}\n\n`;
    markdown += `**Username:** @${escapeMarkdown(creator.username)}\n\n`;
    markdown += '**Layanan:** AI & Digital Operations\n\n';
    markdown += '**Organisasi:** [Studihome](https://studihome.id/)\n\n';
    markdown += `**Profil Publik:** https://studihome.id/${encodeURIComponent(creator.username)}\n\n`;
    markdown += `## Deskripsi\n\n${textBlock(creator.bio || 'Ahli AI dan Otomatisasi di Studihome.')}\n\n`;
    if (creator.location) markdown += `## Lokasi Layanan\n\n${textBlock(creator.location)}\n\n`;
    if (portfolios.length > 0) {
      markdown += '## Portofolio & Layanan\n\n';
      portfolios.forEach(portfolio => {
        const portfolioSlug = slugify(portfolio.title);
        markdown += `### [${textBlock(portfolio.title || 'Portofolio')}](https://studihome.id/${encodeURIComponent(creator.username)}/portfolio/${portfolioSlug})\n\n`;
        if (portfolio.description) markdown += `${textBlock(portfolio.description)}\n\n`;
      });
    }
    markdown += '---\n\nSumber resmi: [Studihome](https://studihome.id/)\n';
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(markdown);
  } catch (error) {
    console.error('[markdown] Request failed', error?.message || error);
    return sendError(502, '# Error\n\nGagal mengambil data publik.\n');
  }
};

