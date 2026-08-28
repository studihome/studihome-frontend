(() => {
  'use strict';
  // ============================================================
  // STUDIHOME Dynamic Sitemap Builder
  // ============================================================
  // Generates a sitemap.xml from live Supabase data.
  // Usage: Admin visits /admin → click "Generate Sitemap" button
  //        OR run: App.sitemapBuilder.generate()
  //
  // Output: downloadable sitemap.xml or copy to clipboard
  // ============================================================

  const BASE_URL = 'https://studihome.id';
  const TODAY = new Date().toISOString().split('T')[0];

  // Static pages always included
  const STATIC_PAGES = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/products', priority: '0.9', changefreq: 'daily' },
    { loc: '/studio-ai', priority: '0.9', changefreq: 'daily' },
    { loc: '/ai-video', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-automation', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-content', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-untuk-guru', priority: '0.8', changefreq: 'weekly' },
    { loc: '/ai-untuk-umkm', priority: '0.8', changefreq: 'weekly' },
  ];

  function escXml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function urlEntry(loc, lastmod, changefreq, priority, images) {
    let xml = '  <url>\n';
    xml += `    <loc>${escXml(BASE_URL + loc)}</loc>\n`;
    if (lastmod) xml += `    <lastmod>${escXml(lastmod)}</lastmod>\n`;
    xml += `    <changefreq>${escXml(changefreq || 'weekly')}</changefreq>\n`;
    xml += `    <priority>${escXml(priority || '0.5')}</priority>\n`;
    if (Array.isArray(images)) {
      images.forEach(img => {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escXml(img.url)}</image:loc>\n`;
        if (img.title) xml += `      <image:title>${escXml(img.title)}</image:title>\n`;
        xml += `    </image:image>\n`;
      });
    }
    xml += '  </url>\n';
    return xml;
  }

  function buildXml(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n';

    // Static pages
    xml += '  <!-- Core Pages -->\n';
    STATIC_PAGES.forEach(p => {
      xml += urlEntry(p.loc, TODAY, p.changefreq, p.priority);
    });

    // Dynamic pages
    urls.forEach(u => { xml += u; });

    xml += '\n</urlset>';
    return xml;
  }

  async function fetchDynamicUrls(db) {
    const urls = [];

    // 1. Creator profiles
    try {
      const { data: creators } = await db
        .from('creators')
        .select('username, display_name, cover_url, avatar_url, updated_at, is_published')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(5000);

      if (creators && creators.length) {
        urls.push('\n  <!-- Creator Profiles -->\n');
        creators.forEach(c => {
          const lastmod = c.updated_at ? c.updated_at.split('T')[0] : TODAY;
          const images = [];
          if (c.avatar_url) images.push({ url: c.avatar_url, title: c.display_name || c.username });
          if (c.cover_url && c.cover_url !== c.avatar_url) images.push({ url: c.cover_url, title: c.display_name || c.username });
          urls.push(urlEntry(`/${c.username}`, lastmod, 'weekly', '0.8', images));
        });
      }
    } catch (e) {
      console.warn('[Sitemap] Creators fetch failed:', e);
    }

    // 2. Creator portfolios
    try {
      const { data: portfolios } = await db
        .from('creator_portfolios')
        .select('id, creator_id, title, media_url, media_type, is_active, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(5000);

      // We need creator usernames — fetch from creators table
      let creatorMap = {};
      try {
        const { data: allCreators } = await db.from('creators').select('id, username');
        if (allCreators) allCreators.forEach(c => { creatorMap[c.id] = c.username; });
      } catch (_) {}

      if (portfolios && portfolios.length) {
        urls.push('\n  <!-- Creator Portfolios -->\n');
        portfolios.forEach(p => {
          const username = creatorMap[p.creator_id];
          if (!username) return;
          const slug = String(p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const lastmod = p.updated_at ? p.updated_at.split('T')[0] : TODAY;
          const images = [];
          if (p.media_type === 'image' && p.media_url) images.push({ url: p.media_url, title: p.title });
          urls.push(urlEntry(`/${username}/portfolio/${slug}`, lastmod, 'monthly', '0.6', images));
        });
      }
    } catch (e) {
      console.warn('[Sitemap] Portfolios fetch failed:', e);
    }

    // 3. Studio AI categories (static but generated)
    try {
      const { data: categories } = await db
        .from('creator_categories')
        .select('slug, name, updated_at')
        .order('name', { ascending: true })
        .limit(200);

      if (categories && categories.length) {
        urls.push('\n  <!-- Studio AI Categories -->\n');
        categories.forEach(cat => {
          const slug = String(cat.slug || '').toLowerCase();
          if (!slug) return;
          const lastmod = cat.updated_at ? cat.updated_at.split('T')[0] : TODAY;
          urls.push(urlEntry(`/${slug}`, lastmod, 'weekly', '0.8'));
        });
      }
    } catch (e) {
      console.warn('[Sitemap] Categories fetch failed:', e);
    }

    return urls;
  }

  async function generate() {
    const db = window.supabaseClient || window.App?.supabase || window.App?.db;
    if (!db || !db.from) {
      console.error('[Sitemap] Supabase client not available');
      return null;
    }

    console.log('[Sitemap] Generating dynamic sitemap...');
    const dynamicUrls = await fetchDynamicUrls(db);
    const xml = buildXml(dynamicUrls);

    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length + dynamicUrls.filter(u => u.includes('<loc>')).length} URLs`);
    return xml;
  }

  function download(xml, filename) {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function generateAndDownload() {
    const xml = await generate();
    if (xml) download(xml);
    return xml;
  }

  // Attach to App
  if (window.App) {
    App.sitemapBuilder = { generate, generateAndDownload, download };
  }

  console.log('[Sitemap] Builder loaded. Use App.sitemapBuilder.generate() or App.sitemapBuilder.generateAndDownload()');
})();
