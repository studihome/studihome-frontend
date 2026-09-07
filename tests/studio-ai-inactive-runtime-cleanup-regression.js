'use strict';

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const removed = [
  'studio-ai-enhancements.js',
  'studio-ai-production-enhancements.js',
  'studio-ai-search.js'
];

for (const file of removed) {
  assert(!fs.existsSync(file), `Inactive Studio AI runtime unexpectedly exists: ${file}`);
}

assert(
  fs.existsSync('studio-ai-creator-card.js'),
  'Active Studio AI creator-card runtime must remain present'
);

const index = fs.readFileSync('index.html', 'utf8');
assert(
  index.includes('studio-ai-creator-card.js?v=6'),
  'Active Studio AI creator-card loader must remain in index.html'
);

for (const file of removed) {
  assert(
    !index.includes(file),
    `Removed Studio AI runtime unexpectedly referenced by index.html: ${file}`
  );
}

const runtimeFiles = fs.readdirSync('.')
  .filter(name =>
    (name.endsWith('.js') || name.endsWith('.html') || name.endsWith('.json')) &&
    !name.startsWith('package-lock')
  )
  .filter(name => !removed.includes(name));

for (const runtimeFile of runtimeFiles) {
  const stat = fs.statSync(runtimeFile);
  if (!stat.isFile()) continue;
  const content = fs.readFileSync(runtimeFile, 'utf8');
  for (const removedFile of removed) {
    assert(
      !content.includes(removedFile),
      `Removed Studio AI runtime referenced by active root runtime ${runtimeFile}: ${removedFile}`
    );
  }
}

console.log('Studio AI inactive runtime cleanup regression: PASS');
