'use strict';

const assert = require('node:assert/strict');
const {
  MAX_SLUG_LENGTH,
  slugify,
  baseSlug,
  routeSlug,
  findByRouteSlug
} = require('../portfolio-route.js');

const unique = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Video Produk UMKM'
};
assert.equal(slugify('Crème Vidéo'), 'creme-video');
assert.equal(baseSlug(unique), 'video-produk-umkm');
assert.equal(routeSlug(unique, [unique]), 'video-produk-umkm');

const duplicates = [
  {
    id: 'aaaaaaaa-1111-4111-8111-111111111111',
    title: 'AI Video Growth — Showcase Layanan'
  },
  {
    id: 'bbbbbbbb-2222-4222-8222-222222222222',
    title: 'AI Video Growth — Showcase Layanan'
  },
  {
    id: 'cccccccc-3333-4333-8333-333333333333',
    title: 'AI Video Growth — Showcase Layanan'
  }
];

const collisionSlugs = duplicates.map(
  item => routeSlug(item, duplicates)
);

assert.equal(new Set(collisionSlugs).size, duplicates.length);
assert.deepEqual(collisionSlugs, [
  'ai-video-growth-showcase-layanan-aaaaaaaa',
  'ai-video-growth-showcase-layanan-bbbbbbbb',
  'ai-video-growth-showcase-layanan-cccccccc'
]);

collisionSlugs.forEach((value, index) => {
  assert.ok(value.length <= MAX_SLUG_LENGTH);
  assert.match(value, /^[a-z0-9][a-z0-9-]{0,119}$/);
  assert.equal(
    findByRouteSlug(duplicates, value)?.id,
    duplicates[index].id
  );
});

// Historical title-only URLs remain readable and resolve the same first row
// they resolved before collision-aware canonical URLs were introduced.
assert.equal(
  findByRouteSlug(
    duplicates,
    'ai-video-growth-showcase-layanan'
  )?.id,
  duplicates[0].id
);

const longTitle = 'x'.repeat(200);
const longDuplicates = [
  { id: '12345678-1111-4111-8111-111111111111', title: longTitle },
  { id: '87654321-2222-4222-8222-222222222222', title: longTitle }
];
for (const item of longDuplicates) {
  const value = routeSlug(item, longDuplicates);
  assert.equal(value.length, MAX_SLUG_LENGTH);
  assert.match(value, /^[a-z0-9][a-z0-9-]{0,119}$/);
}

assert.equal(
  routeSlug(
    { id: 'ABCDEF12-0000-4000-8000-000000000000', title: '' },
    []
  ),
  'abcdef12000040008000000000000000'
);

console.log('Portfolio route collision regression: PASS');
