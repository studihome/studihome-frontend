'use strict';

const PROJECT_HOST = 'hbfmhwwxbgidsnljupca.supabase.co';
const PUBLIC_PREFIX = '/storage/v1/object/public/creator-media/';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const AVATAR_PATH = new RegExp('^' + UUID + '(?:/' + UUID + ')?/avatar\\.webp$', 'i');
const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 5000;
const FALLBACK = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="transparent"/></svg>'
);

function setBaseHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function sendJson(res, status, body, headOnly) {
  setBaseHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.statusCode = status;
  if (headOnly) return res.end();
  return res.end(JSON.stringify(body));
}

function sendFallback(res, headOnly) {
  setBaseHeaders(res);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Studihome-Avatar-Fallback', '1');
  res.statusCode = 200;
  if (headOnly) return res.end();
  return res.end(FALLBACK);
}

module.exports = async (req, res) => {
  const isHead = req.method === 'HEAD';
  if (req.method !== 'GET' && !isHead) {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { status: 'error', error: 'Method Not Allowed' }, isHead);
  }

  const rawPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
  const objectPath = String(rawPath || '').trim();

  if (!AVATAR_PATH.test(objectPath)) {
    return sendJson(res, 400, { status: 'error', error: 'Invalid avatar path' }, isHead);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = 'https://' + PROJECT_HOST + PUBLIC_PREFIX + objectPath;
    const response = await fetch(upstream, {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: 'image/webp' }
    });

    if (!response.ok) return sendFallback(res, isHead);

    const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'image/webp') return sendFallback(res, isHead);

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
      return sendFallback(res, isHead);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_BYTES) return sendFallback(res, isHead);

    setBaseHeaders(res);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.statusCode = 200;
    if (isHead) return res.end();
    return res.end(buffer);
  } catch (_) {
    return sendFallback(res, isHead);
  } finally {
    clearTimeout(timer);
  }
};
