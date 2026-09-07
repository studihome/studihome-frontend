'use strict';

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const removed = new Set([
  'studio-ai-enhancements.js',
  'studio-ai-production-enhancements.js',
  'studio-ai-search.js'
]);

for (const file of removed) {
  assert(!fs.existsSync(file), `Inactive Studio AI runtime unexpectedly exists: ${file}`);
}

assert(
  fs.existsSync('studio-ai-creator-card.js'),
  'Active Studio AI creator-card runtime must remain present'
);

const index = fs.readFileSync('index.html', 'utf8');
const activeLoaderMatches = index.match(
  /<script[^>]+src=["']\/studio-ai-creator-card\.js\?v=\d+["'][^>]*><\/script>/gi
) || [];
assert(
  activeLoaderMatches.length === 1,
  `Active Studio AI creator-card loader must remain exactly once, found ${activeLoaderMatches.length}`
);

for (const file of removed) {
  assert(
    !index.includes(file),
    `Removed Studio AI runtime unexpectedly referenced by index.html: ${file}`
  );
}

const allowedIgnorePrefixes = [
  '.git/',
  '.github/',
  'tests/',
  'node_modules/'
];

const runtimeSuffixes = new Set(['.js', '.mjs', '.ts', '.html', '.json']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const normalized = full.replace(/\\/g, '/').replace(/^\.\//, '');
    if (entry.isDirectory()) {
      if (allowedIgnorePrefixes.some(prefix => (normalized + '/').startsWith(prefix))) continue;
      out.push(...walk(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!runtimeSuffixes.has(path.extname(entry.name).toLowerCase())) continue;
    out.push(full);
  }
  return out;
}

for (const runtimeFile of walk('.')) {
  const normalized = runtimeFile.replace(/\\/g, '/').replace(/^\.\//, '');
  if (removed.has(normalized)) continue;
  const content = fs.readFileSync(runtimeFile, 'utf8');
  for (const removedFile of removed) {
    assert(
      !content.includes(removedFile),
      `Removed Studio AI runtime referenced by active runtime ${normalized}: ${removedFile}`
    );
  }
}

console.log('Studio AI inactive runtime cleanup regression: PASS');
