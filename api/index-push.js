'use strict';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'studihome.id';
const KEY_FILE = 'a383b6cbcb704c04bf1dcb60f201d1af.txt';
const EXPECTED_KEY = 'a383b6cbcb704c04bf1dcb60f201d1af';
const MAX_BODY_BYTES = 4096;
const MAX_AUTHORIZATION_BYTES = 4096;
const REQUEST_TIMEOUT_MS = 10000;
const PORTFOLIO_PATH_PATTERN = /^\/([a-z0-9][a-z0-9-]{0,62})\/portfolio\/([a-z0-9][a-z0-9-]{0,119})$/;

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json.' });
  }

  const declaredLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  const authorization = String(req.headers.authorization || '').trim();
  if (
    !authorization.startsWith('Bearer ') ||
    authorization.length <= 7 ||
    Buffer.byteLength(authorization, 'utf8') > MAX_AUTHORIZATION_BYTES
  ) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const indexNowKey = String(process.env.INDEXNOW_KEY || '').trim();
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const supabaseAnonKey = String(
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  if (!indexNowKey || !supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'IndexNow service is not configured.' });
  }
  if (indexNowKey !== EXPECTED_KEY) {
    console.error('[index-push] INDEXNOW_KEY does not match the deployed verification file.');
    return res.status(500).json({ error: 'IndexNow key configuration mismatch.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  let targetUrl;
  try {
    targetUrl = new URL(String(body.url || '').trim());
  } catch {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  if (
    targetUrl.protocol !== 'https:' ||
    targetUrl.hostname.toLowerCase() !== HOST ||
    targetUrl.port ||
    targetUrl.username ||
    targetUrl.password ||
    targetUrl.search ||
    targetUrl.hash
  ) {
    return res.status(400).json({ error: 'URL must be a canonical HTTPS portfolio URL on studihome.id.' });
  }

  const pathMatch = targetUrl.pathname.match(PORTFOLIO_PATH_PATTERN);
  if (!pathMatch) {
    return res.status(400).json({ error: 'Only canonical creator portfolio URLs can be submitted.' });
  }
  const [, username, portfolioSlug] = pathMatch;
  const normalizedUrl = `https://${HOST}${targetUrl.pathname}`;
  if (Buffer.byteLength(normalizedUrl, 'utf8') > 2048) {
    return res.status(400).json({ error: 'URL is too long.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const supabaseHeaders = {
    apikey: supabaseAnonKey,
    Authorization: authorization,
    Accept: 'application/json'
  };

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: supabaseHeaders,
      signal: controller.signal
    });
    const authUser = await parseJsonResponse(authResponse);
    if (!authResponse.ok || !authUser?.id || authUser.is_anonymous === true) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const profileQuery = new URLSearchParams({
      select: 'id',
      user_id: `eq.${authUser.id}`,
      username: `eq.${username}`,
      is_published: 'eq.true',
      limit: '1'
    });
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/creator_profiles?${profileQuery.toString()}`,
      { headers: supabaseHeaders, signal: controller.signal }
    );
    const profiles = await parseJsonResponse(profileResponse);
    if (!profileResponse.ok) {
      console.warn('[index-push] Creator ownership lookup failed', profileResponse.status);
      return res.status(502).json({ error: 'Unable to verify portfolio ownership.' });
    }
    const creator = Array.isArray(profiles) ? profiles[0] : null;
    if (!creator?.id) {
      return res.status(403).json({ error: 'Published portfolio ownership could not be verified.' });
    }

    const portfolioQuery = new URLSearchParams({
      select: 'id,title',
      creator_id: `eq.${creator.id}`,
      is_active: 'eq.true',
      limit: '1000'
    });
    const portfolioResponse = await fetch(
      `${supabaseUrl}/rest/v1/creator_portfolios?${portfolioQuery.toString()}`,
      { headers: supabaseHeaders, signal: controller.signal }
    );
    const portfolios = await parseJsonResponse(portfolioResponse);
    if (!portfolioResponse.ok) {
      console.warn('[index-push] Portfolio lookup failed', portfolioResponse.status);
      return res.status(502).json({ error: 'Unable to verify portfolio ownership.' });
    }
    const portfolioExists = Array.isArray(portfolios) &&
      portfolios.some((portfolio) => slugify(portfolio.title) === portfolioSlug);
    if (!portfolioExists) {
      return res.status(403).json({ error: 'Published portfolio ownership could not be verified.' });
    }

    const reservationResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/reserve_indexnow_submission`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_target_url: normalizedUrl }),
        signal: controller.signal
      }
    );
    const reservation = await parseJsonResponse(reservationResponse);
    if (!reservationResponse.ok) {
      console.warn('[index-push] Submission reservation failed', reservationResponse.status);
      return res.status(502).json({ error: 'Unable to reserve IndexNow submission.' });
    }
    if (reservation?.reason === 'duplicate') {
      return res.status(200).json({ success: true, duplicate: true, url: normalizedUrl });
    }
    if (reservation?.reason === 'rate_limited') {
      return res.status(429).json({ error: 'IndexNow submission limit reached.' });
    }
    if (reservation?.allowed !== true) {
      return res.status(403).json({ error: 'IndexNow submission was not authorized.' });
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: indexNowKey,
        keyLocation: `https://${HOST}/${KEY_FILE}`,
        urlList: [normalizedUrl]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn('[index-push] IndexNow rejected submission', response.status);
      return res.status(response.status).json({
        error: 'IndexNow rejected the submission.',
        indexNowStatus: response.status
      });
    }

    return res.status(200).json({
      success: true,
      message: 'URL submitted to IndexNow.',
      indexNowStatus: response.status,
      url: normalizedUrl
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'IndexNow request timed out.' });
    }
    console.error('[index-push] Request failed', error?.message || error);
    return res.status(502).json({ error: 'Unable to process IndexNow submission.' });
  } finally {
    clearTimeout(timeoutId);
  }
};

