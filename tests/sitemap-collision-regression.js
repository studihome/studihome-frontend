'use strict';

const assert = require('node:assert/strict');

const originalFetch = global.fetch;
const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_ANON_KEY;

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_ANON_KEY = 'test-publishable-key';

const jsonResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => data
});

const makeRes = () => {
  const output = {
    statusCode: 200,
    headers: {},
    body: '',
    ended: false
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
    type(value) {
      output.headers['content-type'] = value;
      return this;
    },
    send(body) {
      output.body = String(body ?? '');
      output.ended = true;
      return this;
    },
    end() {
      output.ended = true;
      return this;
    }
  };
};

const creators = [{
  id: 'creator-1',
  username: 'aksara',
  display_name: 'Aksara',
  avatar_url: null,
  updated_at: '2026-09-06T00:00:00Z'
}];

const portfolios = [
  {
    id: 'aaaaaaaa-1111-4111-8111-111111111111',
    creator_id: 'creator-1',
    title: 'AI Video Growth — Showcase Layanan',
    media_url: null,
    media_type: 'link',
    created_at: '2026-09-06T00:00:00Z'
  },
  {
    id: 'bbbbbbbb-2222-4222-8222-222222222222',
    creator_id: 'creator-1',
    title: 'AI Video Growth — Showcase Layanan',
    media_url: null,
    media_type: 'link',
    created_at: '2026-09-06T00:00:00Z'
  },
  {
    id: 'cccccccc-3333-4333-8333-333333333333',
    creator_id: 'creator-1',
    title: 'AI Video Growth — Showcase Layanan',
    media_url: null,
    media_type: 'link',
    created_at: '2026-09-06T00:00:00Z'
  }
];

const run = async () => {
  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/creator_profiles?')) {
      return jsonResponse(creators);
    }
    if (value.includes('/ai_categories?')) {
      return jsonResponse([]);
    }
    if (value.includes('/creator_portfolios?')) {
      assert.match(value, /select=id%2Ccreator_id%2Ctitle|select=id,creator_id,title/);
      return jsonResponse(portfolios);
    }
    throw new Error(`Unexpected fetch URL: ${value}`);
  };

  delete require.cache[require.resolve('../api/sitemap.js')];
  const sitemap = require('../api/sitemap.js');
  const res = makeRes();

  await sitemap({ method: 'GET' }, res);

  assert.equal(res.output.statusCode, 200);
  assert.match(
    res.output.headers['content-type'],
    /application\/xml/
  );

  const locs = Array.from(
    res.output.body.matchAll(/<loc>([^<]+)<\/loc>/g),
    match => match[1]
  );

  assert.ok(locs.length > 0);
  assert.equal(
    new Set(locs).size,
    locs.length,
    'Sitemap must not emit duplicate <loc> entries.'
  );

  const portfolioLocs = locs.filter(
    value => value.includes('/aksara/portfolio/')
  );

  assert.deepEqual(portfolioLocs, [
    'https://studihome.id/aksara/portfolio/ai-video-growth-showcase-layanan-aaaaaaaa',
    'https://studihome.id/aksara/portfolio/ai-video-growth-showcase-layanan-bbbbbbbb',
    'https://studihome.id/aksara/portfolio/ai-video-growth-showcase-layanan-cccccccc'
  ]);

  console.log('Sitemap portfolio collision regression: PASS');
};

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.SUPABASE_ANON_KEY;
    } else {
      process.env.SUPABASE_ANON_KEY = originalKey;
    }
  });
