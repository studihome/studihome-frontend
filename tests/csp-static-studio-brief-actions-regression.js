'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('static-studio-brief-actions.js', 'utf8');

const staticMarkup = index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const counts = {};
for (const match of staticMarkup.matchAll(/\s(on[a-z]+)\s*=/gi)) {
  const name = match[1].toLowerCase();
  counts[name] = (counts[name] || 0) + 1;
}
const totalHandlers = Object.values(counts).reduce((sum, value) => sum + value, 0);

assert(totalHandlers <= 12, 'Expected at most 12 static inline handlers after Studio Brief phase, found ' + totalHandlers);
assert((counts.onclick || 0) <= 9, 'Expected at most 9 static onclick handlers, found ' + (counts.onclick || 0));
assert((counts.onsubmit || 0) <= 3, 'Expected at most 3 static onsubmit handlers, found ' + (counts.onsubmit || 0));
assert((counts.onkeydown || 0) === 0, 'Static onkeydown must remain zero, found ' + (counts.onkeydown || 0));

for (const id of [
  'studio-smart-close-icon',
  'studio-smart-close-secondary',
  'studio-smart-submit'
]) {
  const found = index.split('id="' + id + '"').length - 1;
  assert(found === 1, 'Expected exactly one #' + id + ', found ' + found);
  assert(actions.includes("getElementById('" + id + "')"), 'Studio Brief binder missing #' + id);
}

for (const refinement of [
  'yang lebih murah',
  'khusus TikTok',
  'selesai 3 hari'
]) {
  const marker = 'data-studio-refinement="' + refinement + '"';
  const found = index.split(marker).length - 1;
  assert(found === 1, 'Expected exactly one refinement "' + refinement + '", found ' + found);
}

assert(
  (index.match(/data-studio-refinement=/g) || []).length === 3,
  'Studio Brief must expose exactly three refinement data contracts'
);
assert(
  (index.match(/static-studio-brief-actions\.js\?v=1/g) || []).length === 1,
  'Static Studio Brief action loader must exist exactly once'
);
assert(
  !/\sonclick\s*=\s*["'][^"']*App\.studioAI/i.test(staticMarkup),
  'Static Studio Brief inline App.studioAI handler restored'
);

for (const marker of [
  "addEventListener('click'",
  "querySelectorAll('[data-studio-refinement]')",
  'button.dataset.studioRefinement',
  'window.App.studioAI.closeSmartBrief()',
  'window.App.studioAI._applyConversationalRefinement(',
  'window.App.studioAI.submitSmartBrief(submit)'
]) {
  assert(actions.includes(marker), 'Static Studio Brief behavior marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Studio Brief binder must not inject markup');
assert(!actions.includes('fetch('), 'Studio Brief binder must not perform network calls');
assert(!actions.includes('supabase'), 'Studio Brief binder must not touch Supabase');

console.log('CSP static Studio Brief actions regression: PASS');
