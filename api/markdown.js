'use strict';

const MAX_USERNAME_LENGTH = 64;
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

const escapeMarkdown = value => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/([\`*_{}\[\]()#+\-.!|])/g, '\\$1');

const textBlock = value => escapeMarkdown(String(value || '').trim())
  .replace(/\r\n?/g, '\n')
  .replace(/\n{3,}/g, '\n\n');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'index, follow');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('# Method Not Allowed\n');
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');
  const rawPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
  const username = decodeURIComponent(String(rawPath || ''))
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
    .trim()
    .toLowerCase();

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !username ||
    username.length > MAX_USERNAME_LENGTH ||
    !/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(username)
  ) {
    return res.status(400).send('# Error\n\nParameter profil tidak valid.\n');
  }

  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    Accept: 'application/json'
  };

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
    const profileQuery = new URLSearchParams({
      username: `eq.${username}`,
      is_published: 'eq.true',
      select: 'id,username,display_name,bio,avatar_url,location,updated_at',
      limit: '1'
    });
    const profiles = await readJson(`${supabaseUrl}/rest/v1/creator_profiles?${profileQuery}`);
    const creator = profiles[0];

    if (!creator) {
      return res.status(404).send('# 404 Not Found\n\nCreator tidak ditemukan atau belum dipublikasikan.\n');
    }

    const portfolioQuery = new URLSearchParams({
      creator_id: `eq.${creator.id}`,
      is_active: 'eq.true',
      select: 'title,description,media_type,media_url,created_at',
      order: 'sort_order.asc,created_at.desc',
      limit: '100'
    });
    const portfolios = await readJson(`${supabaseUrl}/rest/v1/creator_portfolios?${portfolioQuery}`);

    const displayName = textBlock(creator.display_name || creator.username);
    const safeUsername = escapeMarkdown(creator.username);
    let markdown = `# Profil Creator: ${displayName}\n\n`;
    markdown += `**Username:** @${safeUsername}\n\n`;
    markdown += '**Layanan:** AI & Digital Operations\n\n';
    markdown += '**Organisasi:** [Studihome](https://studihome.id/)\n\n';
    markdown += `**Profil Publik:** https://studihome.id/${encodeURIComponent(creator.username)}\n\n`;
    markdown += `## Deskripsi\n\n${textBlock(creator.bio || 'Ahli AI dan Otomatisasi di Studihome.')}\n\n`;

    if (creator.location) {
      markdown += `## Lokasi Layanan\n\n${textBlock(creator.location)}\n\n`;
    }

    if (portfolios.length > 0) {
      markdown += '## Portofolio & Layanan\n\n';
      portfolios.forEach(portfolio => {
        markdown += `### ${textBlock(portfolio.title || 'Portofolio')}\n\n`;
        if (portfolio.description) markdown += `${textBlock(portfolio.description)}\n\n`;
      });
    }

    markdown += '---\n\nSumber resmi: [Studihome](https://studihome.id/)\n';

    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(markdown);
  } catch (error) {
    console.error('[markdown] Request failed', error?.message || error);
    return res.status(502).send('# Error\n\nGagal mengambil data profil.\n');
  }
};
