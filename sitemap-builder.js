(() => {
  'use strict';

  const BASE_URL = 'https://studihome.id';
  const today = () => new Date().toISOString().slice(0, 10);
  const STATIC_PAGES = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/foyer', priority: '0.9', changefreq: 'daily' },
    { loc: '/studio-ai', priority: '0.9', changefreq: 'daily' },
    { loc: '/balkon', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ai-video', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-automation', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-content', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-untuk-guru', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-untuk-umkm', priority: '0.8', changefreq: 'weekly' }
  ];

  const escXml = value => String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const dateOnly = value => {
    const parsed = String(value || '').match(/^\d{4}-\d{2}-\d{2}/);
    return parsed ? parsed[0] : today();
  };

  const portfolioSlug = value => String(value || '').toLowerCase().trim().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 120);

  function urlEntry(loc, lastmod, changefreq, priority, images = []) {
    let xml = '  <url>\n';
    xml += `    <loc>${escXml(BASE_URL + loc)}</loc>\n`;
    xml += `    <lastmod>${escXml(lastmod || today())}</lastmod>\n`;
    xml += `    <changefreq>${escXml(changefreq || 'weekly')}</changefreq>\n`;
    xml += `    <priority>${escXml(priority || '0.5')}</priority>\n`;
    images.filter(image => image?.url).forEach(image => {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escXml(image.url)}</image:loc>\n`;
      if (image.title) xml += `      <image:title>${escXml(image.title)}</image:title>\n`;
      xml += '    </image:image>\n';
    });
    return xml + '  </url>\n';
  }

  function buildXml(dynamicUrls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n';
    STATIC_PAGES.forEach(page => { xml += urlEntry(page.loc, today(), page.changefreq, page.priority); });
    dynamicUrls.forEach(entry => { xml += entry; });
    return xml + '</urlset>\n';
  }

  async function fetchDynamicUrls(db) {
    const urls = [];
    const creatorById = new Map();

    try {
      const { data, error } = await db.from('creator_profiles')
        .select('id,username,display_name,avatar_url,cover_url,updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      (data || []).forEach(creator => {
        if (!creator.id || !creator.username) return;
        creatorById.set(creator.id, creator);
        const images = [
          creator.avatar_url ? { url: creator.avatar_url, title: creator.display_name || creator.username } : null,
          creator.cover_url && creator.cover_url !== creator.avatar_url ? { url: creator.cover_url, title: creator.display_name || creator.username } : null
        ].filter(Boolean);
        urls.push(urlEntry(`/${encodeURIComponent(creator.username)}`, dateOnly(creator.updated_at), 'weekly', '0.8', images));
      });
    } catch (error) {
      console.warn('[Sitemap] Creator profiles unavailable:', error);
    }

    try {
      const { data, error } = await db.from('ai_categories')
        .select('slug,name')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(200);
      if (error) throw error;
      (data || []).forEach(category => {
        const slug = String(category.slug || '').trim().toLowerCase();
        if (slug) urls.push(urlEntry(`/${encodeURIComponent(slug)}`, today(), 'weekly', '0.8'));
      });
    } catch (error) {
      console.warn('[Sitemap] AI categories unavailable:', error);
    }

    try {
      const { data, error } = await db.from('creator_portfolios')
        .select('id,creator_id,title,media_url,media_type,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      (data || []).forEach(portfolio => {
        const creator = creatorById.get(portfolio.creator_id);
        const slug = portfolioSlug(portfolio.title);
        if (!creator?.username || !slug) return;
        const images = portfolio.media_type === 'image' && portfolio.media_url
          ? [{ url: portfolio.media_url, title: portfolio.title || '' }]
          : [];
        urls.push(urlEntry(`/${encodeURIComponent(creator.username)}/portfolio/${encodeURIComponent(slug)}`, dateOnly(portfolio.created_at), 'monthly', '0.6', images));
      });
    } catch (error) {
      console.warn('[Sitemap] Creator portfolios unavailable:', error);
    }

    try {
      const articles = window.App?.blog?.getPublished?.() || [];
      articles.forEach(article => {
        const slug = String(article?.slug || '').trim().toLowerCase();
        if (!slug) return;
        const image = article.image || article.thumbnail || '';
        urls.push(urlEntry(`/balkon/${encodeURIComponent(slug)}`, dateOnly(article.updated_at || article.published_at || article.date), 'monthly', '0.7', image ? [{ url: image, title: article.title || '' }] : []));
      });
    } catch (error) {
      console.warn('[Sitemap] Balkon articles unavailable:', error);
    }

    return urls;
  }

  async function generate() {
    const db = window.supabaseClient || window.App?.supabase || window.App?.db;
    if (!db?.from) {
      console.error('[Sitemap] Supabase client not available');
      return null;
    }
    const dynamicUrls = await fetchDynamicUrls(db);
    return buildXml(dynamicUrls);
  }

  function download(xml, filename = 'sitemap.xml') {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function generateAndDownload() {
    const xml = await generate();
    if (xml) download(xml);
    return xml;
  }

  window.App = window.App || {};
  App.sitemapBuilder = { generate, generateAndDownload, download };
})();
