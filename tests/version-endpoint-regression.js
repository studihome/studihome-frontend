'use strict';

const assert = require('node:assert/strict');
const versionHandler = require('../api/version.js');

const originalSha = process.env.VERCEL_GIT_COMMIT_SHA;
const originalEnv = process.env.VERCEL_ENV;

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
    end() {
      output.ended = true;
      return this;
    }
  };
};

const run = () => {
  process.env.VERCEL_GIT_COMMIT_SHA = 'a'.repeat(40);
  process.env.VERCEL_ENV = 'preview';

  {
    const res = makeRes();
    versionHandler({ method: 'GET' }, res);

    assert.equal(res.output.statusCode, 200);
    assert.deepEqual(res.output.body, {
      status: 'ok',
      commit: 'a'.repeat(40),
      environment: 'preview'
    });
    assert.equal(
      res.output.headers['cache-control'],
      'no-store, max-age=0'
    );
    assert.equal(
      res.output.headers['x-content-type-options'],
      'nosniff'
    );
  }

  {
    const res = makeRes();
    versionHandler({ method: 'HEAD' }, res);

    assert.equal(res.output.statusCode, 200);
    assert.equal(res.output.ended, true);
    assert.equal(res.output.body, undefined);
  }

  {
    const res = makeRes();
    versionHandler({ method: 'POST' }, res);

    assert.equal(res.output.statusCode, 405);
    assert.equal(res.output.headers.allow, 'GET, HEAD');
    assert.equal(res.output.body?.error, 'Method Not Allowed');
  }

  {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    process.env.VERCEL_ENV = 'something-else';

    const res = makeRes();
    versionHandler({ method: 'GET' }, res);

    assert.equal(res.output.statusCode, 503);
    assert.deepEqual(res.output.body, {
      status: 'unavailable',
      commit: null,
      environment: 'unknown'
    });
  }

  console.log('Runtime version endpoint regression: PASS');
};

try {
  run();
} finally {
  if (originalSha === undefined) {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
  } else {
    process.env.VERCEL_GIT_COMMIT_SHA = originalSha;
  }

  if (originalEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = originalEnv;
  }
}
