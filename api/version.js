'use strict';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const ALLOWED_ENVIRONMENTS = new Set([
  'production',
  'preview',
  'development'
]);

const sendJson = (res, status, body, headOnly = false) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (headOnly) return res.status(status).end();
  return res.status(status).json(body);
};

module.exports = (req, res) => {
  const isHead = req.method === 'HEAD';
  if (req.method !== 'GET' && !isHead) {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(
      res,
      405,
      { status: 'error', error: 'Method Not Allowed' }
    );
  }

  const commit = String(
    process.env.VERCEL_GIT_COMMIT_SHA || ''
  ).trim().toLowerCase();

  const rawEnvironment = String(
    process.env.VERCEL_ENV || ''
  ).trim().toLowerCase();

  const environment = ALLOWED_ENVIRONMENTS.has(rawEnvironment)
    ? rawEnvironment
    : 'unknown';

  if (!SHA_PATTERN.test(commit)) {
    return sendJson(
      res,
      503,
      {
        status: 'unavailable',
        commit: null,
        environment
      },
      isHead
    );
  }

  return sendJson(
    res,
    200,
    {
      status: 'ok',
      commit,
      environment
    },
    isHead
  );
};
