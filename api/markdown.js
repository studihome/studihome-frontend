'use strict';

const { SEED_ARTICLES = [] } = require('../blog-data.js');

const MAX_PATH_LENGTH = 240;
const MAX_USERNAME_LENGTH = 64;
const MAX_SLUG_LENGTH = 160;
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

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

  if (!isArticleRoute && !isPortfolioRoute && !isCreatorRoute) {
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

