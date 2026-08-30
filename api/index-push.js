'use strict';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'studihome.id';
const KEY_FILE = 'a383b6cbcb704c04bf1dcb60f201d1af.txt';
const EXPECTED_KEY = 'a383b6cbcb704c04bf1dcb60f201d1af';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const indexNowKey = String(process.env.INDEXNOW_KEY || '').trim();
  if (!indexNowKey) {
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

  let targetUrl;
  try {
    targetUrl = new URL(String(body?.url || '').trim());
  } catch {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  if (
    targetUrl.protocol !== 'https:' ||
    targetUrl.hostname.toLowerCase() !== HOST ||
    targetUrl.port ||
    targetUrl.username ||
    targetUrl.password
  ) {
    return res.status(400).json({ error: 'URL must be an HTTPS URL on studihome.id.' });
  }

  targetUrl.hash = '';
  const normalizedUrl = targetUrl.toString();
  if (normalizedUrl.length > 2048) {
    return res.status(400).json({ error: 'URL is too long.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
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
    return res.status(502).json({ error: 'Unable to reach IndexNow.' });
  } finally {
    clearTimeout(timeoutId);
  }
};
