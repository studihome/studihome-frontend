'use strict';

const BASE_URL = 'https://studihome.id';
const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/foyer', 'daily', '0.9'],
  ['/studio-ai', 'daily', '0.9'],
  ['/balkon', 'weekly', '0.9'],
  ['/ai-video', 'weekly', '0.8'],
  ['/ai-automation', 'weekly', '0.8'],
  ['/ai-content', 'weekly', '0.8'],
  ['/ai-untuk-guru', 'weekly', '0.8'],
  ['/ai-untuk-umkm', 'weekly', '0.8']
];

const escapeXml = value => String(value || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const dateOnly = value => /^\d{4}-\d{2}-\d{2}/.test(String(value || ''))
  ? String(value).slice(0, 10)
  : new Date().toISOString().slice(0, 10);

const slugify = value => String(value || '').toLowerCase().trim().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 120);

function buildUrl(path, lastmod, changefreq, priority, image) {
  let xml = '  <url>\n';
  xml += `    <loc>${escapeXml(BASE_URL + path)}</loc>\n`;
  xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
  xml += `    <changefreq>${escapeXml(changefreq)}</changefreq>\n`;
  xml += `    <priority>${escapeXml(priority)}</priority>\n`;
  if (image?.url) {
    xml += '    <image:image>\n';
    xml += `      <image:loc>${escapeXml(image.url)}</image:loc>\n`;
    if (image.title) xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
    xml += '    </image:image>\n';
  }
  return xml + '  </url>\n';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).type('text/plain').send('Sitemap service is not configured.');
  }

  const base = supabaseUrl.replace(/\/$/, '');
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    Accept: 'application/json'
  };
  const readList = async path => {
    try {
      const response = await fetch(`${base}/rest/v1/${path}`, { headers });
      if (!response.ok) {
        console.warn('[sitemap] Supabase read failed', response.status, path);
        return [];
      }
      const body = await response.json();
      return Array.isArray(body) ? body : [];
    } catch (error) {
      console.warn('[sitemap] Supabase request failed', path, error?.message || error);
      return [];
    }
  };

  const today = dateOnly();
  const [creators, categories, portfolios] = await Promise.all([
    readList('creator_profiles?is_published=eq.true&select=id,username,display_name,avatar_url,updated_at&order=updated_at.desc&limit=5000'),
    readList('ai_categories?is_active=eq.true&select=slug&order=name.asc&limit=200'),
    readList('creator_portfolios?is_active=eq.true&select=creator_id,title,media_url,media_type,created_at&order=created_at.desc&limit=5000')
  ]);

  let entries = STATIC_PAGES.map(([path, freq, priority]) => buildUrl(path, today, freq, priority)).join('');
  const creatorMap = new Map();

  creators.forEach(creator => {
    const username = String(creator.username || '').trim().toLowerCase();
    if (!creator.id || !username) return;
    creatorMap.set(creator.id, username);
    entries += buildUrl(
      `/${encodeURIComponent(username)}`,
      dateOnly(creator.updated_at),
      'weekly',
      '0.8',
      creator.avatar_url ? { url: creator.avatar_url, title: creator.display_name || username } : null
    );
  });

  categories.forEach(category => {
    const slug = String(category.slug || '').trim().toLowerCase();
    if (slug) entries += buildUrl(`/${encodeURIComponent(slug)}`, today, 'weekly', '0.8');
  });

  portfolios.forEach(portfolio => {
    const username = creatorMap.get(portfolio.creator_id);
    const slug = slugify(portfolio.title);
    if (!username || !slug) return;
    entries += buildUrl(
      `/${encodeURIComponent(username)}/portfolio/${encodeURIComponent(slug)}`,
      dateOnly(portfolio.created_at),
      'monthly',
      '0.6',
      portfolio.media_type === 'image' && portfolio.media_url
        ? { url: portfolio.media_url, title: portfolio.title || '' }
        : null
    );
  });

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    + entries
    + '</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
};
