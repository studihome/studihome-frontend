'use strict';

const fs = require('fs');
const vm = require('vm');

const editor = fs.readFileSync('dapur-editor.js', 'utf8');
const entry = fs.readFileSync('dapur-entry.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const startMarker = '/* PORTFOLIO_INTAKE_PURE_START */';
const endMarker = '/* PORTFOLIO_INTAKE_PURE_END */';
const start = editor.indexOf(startMarker);
const end = editor.indexOf(endMarker);

assert(start >= 0 && end > start, 'Pure portfolio intake helper markers missing');

const pureSource = editor.slice(start + startMarker.length, end);
const context = { URL };
vm.createContext(context);
vm.runInContext(
  pureSource +
    '\nthis.__helpers={normalizePortfolioUrl,isGenericPortfolioRow,detectPortfolioMedia,derivePortfolioTitle};',
  context
);

const { normalizePortfolioUrl, isGenericPortfolioRow, detectPortfolioMedia, derivePortfolioTitle } =
  context.__helpers;

assert(normalizePortfolioUrl('http://example.com/a') === null, 'HTTP must be rejected');
assert(normalizePortfolioUrl('not a url') === null, 'Malformed URL must be rejected');
assert(
  normalizePortfolioUrl('https://user:secret@example.com/work') === null,
  'Embedded URL credentials must be rejected'
);
assert(
  normalizePortfolioUrl(' https://Example.COM/work#section ') ===
    'https://example.com/work',
  'HTTPS URL must normalize host and strip fragment'
);
assert(
  normalizePortfolioUrl('https://example.com/watch?v=1#x') ===
    'https://example.com/watch?v=1',
  'Query must be preserved while fragment is removed'
);

assert(
  isGenericPortfolioRow({ service_id: null }) === true,
  'Generic portfolio row must participate in bulk dedupe'
);
assert(
  isGenericPortfolioRow({ service_id: '11111111-1111-4111-8111-111111111111' }) === false,
  'Service-linked portfolio row must not block a generic bulk row'
);

assert(
  detectPortfolioMedia('https://www.youtube.com/watch?v=abc') === 'youtube',
  'Supported YouTube host must map to youtube'
);
assert(
  detectPortfolioMedia('https://m.youtube.com/watch?v=abc') === 'link',
  'Unsupported YouTube subdomain must fall back to link'
);
assert(
  detectPortfolioMedia('https://www.youtube.com:8443/watch?v=abc') === 'link',
  'Platform URL with non-default port must fall back to generic link'
);
assert(
  detectPortfolioMedia('https://drive.google.com/file/d/abc/view') === 'drive',
  'Drive host must map to drive'
);
assert(
  detectPortfolioMedia('https://www.tiktok.com/@x/video/1') === 'tiktok',
  'TikTok host must map to tiktok'
);
assert(
  detectPortfolioMedia('https://instagram.com/p/abc/') === 'instagram',
  'Instagram host must map to instagram'
);
assert(
  detectPortfolioMedia('https://cdn.example.com/work.JPG') === 'image',
  'Image extension must map to image'
);
assert(
  detectPortfolioMedia('https://cdn.example.com/work.mp4') === 'link',
  'Direct video files must remain link under current validated DB policy'
);

const imageTitle = derivePortfolioTitle(
  'https://cdn.example.com/my-cool_work.jpg',
  'image'
);
assert(imageTitle === 'my cool work', 'Image title derivation must be deterministic');

const youtubeTitle = derivePortfolioTitle(
  'https://www.youtube.com/watch?v=AbC_123',
  'youtube'
);
assert(
  youtubeTitle.startsWith('YouTube ') &&
    youtubeTitle.length >= 2 &&
    youtubeTitle.length <= 100,
  'YouTube title derivation must be bounded and deterministic'
);

const requiredEditorMarkers = [
  "async function requireAdmin()",
  "S().rpc('is_admin')",
  "async function bulkPortfolioIntake(id)",
  "await requireAdmin();",
  "data-admin-action=\"bulk-portfolio\"",
  "if(action==='bulk-portfolio')return await bulkPortfolioIntake(sel.value)",
  "const limited=lines.slice(0,100)",
  "service_id:null",
  "description:''",
  "is_active:false",
  ".from('creator_portfolios').insert(rows)",
  "select('media_url,sort_order,service_id')",
  "if(isGenericPortfolioRow(row)&&normalized)existing.add(normalized)",
  "existing.has(normalized)||batchSeen.has(normalized)",
  "result?.message||'Berhasil disimpan! 🎉'"
];

for (const marker of requiredEditorMarkers) {
  assert(editor.includes(marker), `Bulk portfolio guard missing: ${marker}`);
}

assert(
  !editor.includes(
    'window.AdminDapurUI={profile,categories,service,portfolio,close,adminPanel,bulkPortfolioIntake'
  ),
  'bulkPortfolioIntake must remain closure-private'
);

assert(
  entry.includes('/dapur-editor.js?v=20260907bulk2'),
  'Dapur lazy loader must use the refreshed bulk editor asset'
);

console.log('Admin bulk portfolio intake regression: PASS');
