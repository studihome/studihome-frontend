'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('static-search-actions.js', 'utf8');

const staticMarkup = index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const counts = {};
for (const match of staticMarkup.matchAll(/\s(on[a-z]+)\s*=/gi)) {
  const name = match[1].toLowerCase();
  counts[name] = (counts[name] || 0) + 1;
}

const totalHandlers = Object.values(counts).reduce((sum, value) => sum + value, 0);

assert(totalHandlers === 18, `Expected 18 static inline handlers after Search phase, found ${totalHandlers}`);
assert((counts.onclick || 0) === 15, `Expected 15 static onclick handlers, found ${counts.onclick || 0}`);
assert((counts.onsubmit || 0) === 3, `Expected 3 static onsubmit handlers, found ${counts.onsubmit || 0}`);
assert((counts.onkeydown || 0) === 0, `Static onkeydown must be zero after Search phase, found ${counts.onkeydown || 0}`);

for (const id of [
  'studihome-brand-home',
  'global-search-open-desktop',
  'global-search-open-mobile',
  'global-search-close-icon',
  'global-search-modal-input',
  'global-search-close-secondary',
  'global-search-submit'
]) {
  const pattern = new RegExp(`id=["']${id}["']`, 'g');
  const found = (index.match(pattern) || []).length;
  assert(found === 1, `Expected exactly one #${id}, found ${found}`);
  assert(actions.includes(`getElementById('${id}')`), `Search action binder missing #${id}`);
}

assert(
  (index.match(/static-search-actions\.js\?v=1/g) || []).length === 1,
  'Static Search action loader must exist exactly once'
);

for (const forbidden of [
  'onclick="App.search.',
  "onclick='App.search.",
  'onkeydown="if(event.key=',
  'onclick="App.router.navigate(\'home\')"'
]) {
  assert(!staticMarkup.includes(forbidden), `Search phase inline handler restored: ${forbidden}`);
}

for (const marker of [
  "addEventListener('click'",
  "addEventListener('keydown'",
  "event.key === 'Enter'",
  "window.App.router.navigate('home')",
  'window.App.search.openModal()',
  'window.App.search.closeModal()',
  'window.App.search.submitFromModal(input.value)'
]) {
  assert(actions.includes(marker), `Static Search action behavior marker missing: ${marker}`);
}

assert(!actions.includes('innerHTML'), 'Static Search binder must not inject markup');
assert(!actions.includes('fetch('), 'Static Search binder must not perform network calls');
assert(!actions.includes('supabase'), 'Static Search binder must not touch Supabase');

console.log('CSP static Search actions regression: PASS');
