'use strict';

const BASE_URL = 'https://studihome.id';
const MAX_QUERY_LENGTH = 120;
const MAX_SOURCE_ROWS = 200;
const MAX_RESULTS = 5;
const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

const normalizeText = value => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9@._+\-\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const parseQuery = rawQuery => {
  const value = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  return String(value || '').trim().replace(/\s+/g, ' ');
};

const asNullableNumber = value => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatRupiah = value => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(value);

const formatPrice = (minimum, maximum) => {
  if (minimum === null && maximum === null) return 'Hubungi Creator';
  if (minimum !== null && maximum !== null && maximum !== minimum) {
    return `${formatRupiah(minimum)} - ${formatRupiah(maximum)}`;
  }
  return `Mulai ${formatRupiah(minimum ?? maximum)}`;
};

const creatorFromRelation = relation => (
  Array.isArray(relation) ? relation[0] : relation
);

const scoreService = (service, creator, normalizedQuery, tokens) => {
  if (!normalizedQuery) return 1;

  const title = normalizeText(service.title);
  const description = normalizeText(service.description);
  const creatorName = normalizeText(creator?.display_name);
  const username = normalizeText(creator?.username);

  let score = 0;
  if (title === normalizedQuery) score += 100;
  if (title.includes(normalizedQuery)) score += 40;
  if (description.includes(normalizedQuery)) score += 18;
  if (creatorName.includes(normalizedQuery) || username.includes(normalizedQuery)) score += 30;

  tokens.forEach(token => {
    if (title.includes(token)) score += 12;
    if (description.includes(token)) score += 4;
    if (creatorName.includes(token) || username.includes(token)) score += 8;
  });

  return score;
};

const sendJson = (res, status, body, headOnly = false) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (headOnly) return res.status(status).end();
  return res.status(status).json(body);
};

module.exports = async (req, res) => {
  const isHead = req.method === 'HEAD';
  if (req.method !== 'GET' && !isHead) {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return sendJson(res, 503, { error: 'Service temporarily unavailable' }, isHead);
  }

  const query = parseQuery(req.query?.q);
  if (query.length > MAX_QUERY_LENGTH) {
    return sendJson(res, 400, {
      error: `Parameter q maksimal ${MAX_QUERY_LENGTH} karakter.`
    }, isHead);
  }

  let loggingTask = Promise.resolve();
  if (query.length > 2) {
    loggingTask = fetch(`${supabaseUrl}/rest/v1/rpc/record_ai_search`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ p_query_text: query })
    })
      .then(response => {
        if (!response.ok) console.warn('[agent-search] Intent logging failed', response.status);
      })
      .catch(error => console.warn('[agent-search] Intent logging failed', error?.message || error));

  }

  const normalizedQuery = normalizeText(query);
  const tokens = [...new Set(normalizedQuery.split(' ').filter(token => token.length >= 2))];
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    Accept: 'application/json'
  };

  try {
    const params = new URLSearchParams({
      is_active: 'eq.true',
      select: 'title,description,price_from,price_to,delivery_days,created_at,creator_profiles!inner(username,display_name,is_published)',
      'creator_profiles.is_published': 'eq.true',
      order: 'created_at.desc',
      limit: String(MAX_SOURCE_ROWS)
    });
    const [, response] = await Promise.all([
      loggingTask,
      fetch(`${supabaseUrl}/rest/v1/creator_services?${params}`, { headers })
    ]);
    if (!response.ok) {
      console.error('[agent-search] Supabase read failed', response.status);
      return sendJson(res, 502, { error: 'Upstream data source unavailable' }, isHead);
    }

    const payload = await response.json();
    const services = Array.isArray(payload) ? payload : [];
    const ranked = services
      .map((service, index) => {
        const creator = creatorFromRelation(service.creator_profiles);
        if (!creator?.username || creator.is_published === false) return null;
        const score = scoreService(service, creator, normalizedQuery, tokens);
        return { service, creator, score, index };
      })
      .filter(item => item && (!normalizedQuery || item.score > 0))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, MAX_RESULTS);

    const results = ranked.map(({ service, creator }) => {
      const minimum = asNullableNumber(service.price_from);
      const maximum = asNullableNumber(service.price_to);
      return {
        layanan: String(service.title || 'Layanan AI'),
        deskripsi: String(service.description || ''),
        creator: String(creator.display_name || creator.username),
        username: String(creator.username),
        harga: formatPrice(minimum, maximum),
        harga_idr: { minimum, maximum },
        estimasi_hari: asNullableNumber(service.delivery_days),
        link_profil: `${BASE_URL}/${encodeURIComponent(creator.username)}`
      };
    });

    return sendJson(res, 200, {
      status: 'success',
      source: 'Studihome AI Action',
      query,
      count: results.length,
      results,
      ...(results.length ? {} : { message: 'Tidak ditemukan layanan yang cocok.' })
    }, isHead);
  } catch (error) {
    console.error('[agent-search] Unexpected error', error?.message || error);
    return sendJson(res, 500, { error: 'Internal Server Error' }, isHead);
  }
};

