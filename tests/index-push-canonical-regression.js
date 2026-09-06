'use strict';

const assert = require('node:assert/strict');

const originalFetch = global.fetch;
const originalEnv = {
  INDEXNOW_KEY: process.env.INDEXNOW_KEY,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
};

process.env.INDEXNOW_KEY = 'a383b6cbcb704c04bf1dcb60f201d1af';
process.env.VITE_SUPABASE_URL = 'https://supabase.test';
process.env.VITE_SUPABASE_ANON_KEY = 'test-publishable-key';

const jsonResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => data == null ? '' : JSON.stringify(data)
});

const makeRes = () => {
  const output = {
    statusCode: 200,
    headers: {},
    body: null
  };

  return {
    output,
    setHeader(name, value) {
      output.headers[String(name).toLowerCase()] = value;
    },
    status(code) {
      output.statusCode = code;
      return this;
    },
    json(body) {
      output.body = body;
      return this;
    }
  };
};

const portfolios = [
  {
    id: 'aaaaaaaa-1111-4111-8111-111111111111',
    title: 'AI Video Growth — Showcase Layanan'
  },
  {
    id: 'bbbbbbbb-2222-4222-8222-222222222222',
    title: 'AI Video Growth — Showcase Layanan'
  }
];

const handler = require('../api/index-push.js');

const invoke = async (url, fetchMock) => {
  global.fetch = fetchMock;
  const res = makeRes();
  await handler({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer user-token'
    },
    body: { url }
  }, res);
  return res.output;
};

const baseFetch = async (url) => {
  const value = String(url);
  if (value.endsWith('/auth/v1/user')) {
    return jsonResponse({
      id: 'user-1',
      is_anonymous: false
    });
  }
  if (value.includes('/creator_profiles?')) {
    return jsonResponse([{ id: 'creator-1' }]);
  }
  if (value.includes('/creator_portfolios?')) {
    return jsonResponse(portfolios);
  }
  throw new Error(`Unexpected fetch URL: ${value}`);
};

const run = async () => {
  const legacy = await invoke(
    'https://studihome.id/aksara/portfolio/ai-video-growth-showcase-layanan',
    baseFetch
  );

  assert.equal(legacy.statusCode, 409);
  assert.deepEqual(legacy.body, {
    error: 'Use the canonical portfolio URL.',
    canonicalUrl:
      'https://studihome.id/aksara/portfolio/' +
      'ai-video-growth-showcase-layanan--aaaaaaaa'
  });

  let reservationBody = null;
  let indexNowBody = null;
  const canonical = await invoke(
    'https://studihome.id/aksara/portfolio/' +
      'ai-video-growth-showcase-layanan--bbbbbbbb',
    async (url, options = {}) => {
      const value = String(url);
      if (value.endsWith('/auth/v1/user')) {
        return jsonResponse({
          id: 'user-1',
          is_anonymous: false
        });
      }
      if (value.includes('/creator_profiles?')) {
        return jsonResponse([{ id: 'creator-1' }]);
      }
      if (value.includes('/creator_portfolios?')) {
        return jsonResponse(portfolios);
      }
      if (value.includes('/rpc/reserve_indexnow_submission')) {
        reservationBody = JSON.parse(String(options.body || '{}'));
        return jsonResponse({ allowed: true });
      }
      if (value === 'https://api.indexnow.org/indexnow') {
        indexNowBody = JSON.parse(String(options.body || '{}'));
        return jsonResponse(null, 200);
      }
      throw new Error(`Unexpected fetch URL: ${value}`);
    }
  );

  assert.equal(canonical.statusCode, 200);
  assert.equal(canonical.body?.success, true);
  assert.equal(
    canonical.body?.url,
    'https://studihome.id/aksara/portfolio/' +
      'ai-video-growth-showcase-layanan--bbbbbbbb'
  );
  assert.equal(
    reservationBody?.p_target_url,
    canonical.body.url
  );
  assert.deepEqual(indexNowBody?.urlList, [canonical.body.url]);

  console.log('IndexNow portfolio canonical regression: PASS');
};

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
