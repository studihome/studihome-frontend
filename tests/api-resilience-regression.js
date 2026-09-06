'use strict';

const assert = require('node:assert/strict');

const agentSearch = require('../api/agent-search.js');
const markdown = require('../api/markdown.js');

process.env.VITE_SUPABASE_URL = 'https://supabase.test';
process.env.VITE_SUPABASE_ANON_KEY = 'test-publishable-key';

const realFetch = global.fetch;
const realSetTimeout = global.setTimeout;

const jsonResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data
});

const emptyResponse = (status = 204) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => null
});

const pendingUntilAbort = signal => new Promise((resolve, reject) => {
  const abort = () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    reject(error);
  };

  if (signal?.aborted) {
    abort();
    return;
  }

  signal?.addEventListener('abort', abort, { once: true });
});

const makeRes = () => {
  const output = {
    statusCode: 200,
    headers: {},
    body: undefined,
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
    json(body) {
      output.body = body;
      output.ended = true;
      return this;
    },
    send(body) {
      output.body = body;
      output.ended = true;
      return this;
    },
    end() {
      output.ended = true;
      return this;
    }
  };
};

const withFastTimeouts = async task => {
  global.setTimeout = (callback, timeout, ...args) =>
    realSetTimeout(callback, Math.min(Number(timeout) || 0, 25), ...args);

  try {
    await task();
  } finally {
    global.setTimeout = realSetTimeout;
  }
};

const withFetch = async (mock, task) => {
  global.fetch = mock;
  try {
    await task();
  } finally {
    global.fetch = realFetch;
  }
};

const run = async () => {
  await withFastTimeouts(async () => {
    await withFetch(async (url, options = {}) => {
      const value = String(url);
      if (value.includes('/rpc/record_ai_search')) {
        return pendingUntilAbort(options.signal);
      }
      if (value.includes('/creator_services?')) {
        return jsonResponse([{
          title: 'AI Video',
          description: 'Produksi video AI',
          price_from: 100000,
          price_to: 200000,
          delivery_days: 2,
          created_at: '2026-09-06T00:00:00Z',
          creator_profiles: {
            username: 'kyai',
            display_name: 'Kyai',
            is_published: true
          }
        }]);
      }
      throw new Error(`Unexpected fetch URL: ${value}`);
    }, async () => {
      const res = makeRes();
      await agentSearch({ method: 'GET', query: { q: 'video' } }, res);

      assert.equal(res.output.statusCode, 200);
      assert.equal(res.output.body?.status, 'success');
      assert.equal(res.output.body?.count, 1);
      assert.equal(res.output.body?.results?.[0]?.username, 'kyai');
    });

    await withFetch(async (url, options = {}) => {
      const value = String(url);
      if (value.includes('/rpc/record_ai_search')) return emptyResponse();
      if (value.includes('/creator_services?')) {
        return pendingUntilAbort(options.signal);
      }
      throw new Error(`Unexpected fetch URL: ${value}`);
    }, async () => {
      const res = makeRes();
      await agentSearch({ method: 'GET', query: { q: 'video' } }, res);

      assert.equal(res.output.statusCode, 504);
      assert.deepEqual(res.output.body, {
        error: 'Upstream data source timed out'
      });
    });

    await withFetch(async (url) => {
      const value = String(url);
      if (value.includes('/creator_profiles?')) {
        return jsonResponse([{
          id: 'creator-1',
          username: 'kyai',
          display_name: 'Kyai',
          bio: 'Creator AI',
          avatar_url: null,
          location: 'Indonesia',
          updated_at: '2026-09-06T00:00:00Z'
        }]);
      }
      if (value.includes('/creator_portfolios?')) return jsonResponse([]);
      throw new Error(`Unexpected fetch URL: ${value}`);
    }, async () => {
      const res = makeRes();
      await markdown({ method: 'GET', query: { path: 'kyai' } }, res);

      assert.equal(res.output.statusCode, 200);
      assert.match(String(res.output.body), /Profil Creator: Kyai/);
      assert.equal(res.output.headers['x-robots-tag'], 'index, follow');
    });

    await withFetch(async (url, options = {}) => {
      const value = String(url);
      if (value.includes('/creator_profiles?')) {
        return pendingUntilAbort(options.signal);
      }
      throw new Error(`Unexpected fetch URL: ${value}`);
    }, async () => {
      const res = makeRes();
      await markdown({ method: 'GET', query: { path: 'kyai' } }, res);

      assert.equal(res.output.statusCode, 502);
      assert.match(String(res.output.body), /Gagal mengambil data publik/);
      assert.equal(res.output.headers['x-robots-tag'], 'noindex, nofollow');
      assert.equal(res.output.headers['cache-control'], 'no-store');
    });

    await withFetch(async (url, options = {}) => {
      const value = String(url);
      if (
        value.includes('/creator_profiles?') ||
        value.includes('/creator_portfolios?')
      ) {
        return pendingUntilAbort(options.signal);
      }
      throw new Error(`Unexpected fetch URL: ${value}`);
    }, async () => {
      const res = makeRes();
      await markdown({
        method: 'GET',
        query: { path: 'solusi/ai-video-untuk-umkm' }
      }, res);

      assert.equal(res.output.statusCode, 200);
      assert.match(String(res.output.body), /Solusi Video dengan AI untuk UMKM/);
      assert.match(
        String(res.output.body),
        /Belum ada portofolio publik yang cocok/
      );
    });
  });

  console.log('Public API resilience regression: PASS');
};

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = realFetch;
    global.setTimeout = realSetTimeout;
  });
