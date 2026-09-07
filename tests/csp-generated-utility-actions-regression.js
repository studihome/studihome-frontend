'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('generated-utility-actions.js', 'utf8');

const inlineScripts = [];
for (const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1] || '')) continue;
  inlineScripts.push(match[2] || '');
}
assert(inlineScripts.length >= 5, 'Expected core inline runtime');
const core = inlineScripts[4];

function countGeneratedHandlers(source) {
  let count = 0;
  const regex = /<[a-zA-Z][^>]*?\s(on[a-z]+)\s*=/g;
  while (regex.exec(source)) count += 1;
  return count;
}

function sectionSource(name) {
  const start = core.search(new RegExp('\\n\\s{12}' + name + ':\\s*\\{'));
  assert(start >= 0, 'Section missing: ' + name);
  const rest = core.slice(start + 1);
  const next = rest.search(/\n\s{12}[A-Za-z_$][\w$]*:\s*\{/);
  assert(next > 0, 'Section end missing: ' + name);
  return core.slice(start, start + 1 + next);
}

assert(
  countGeneratedHandlers(core) <= 174,
  'Expected at most 174 core generated HTML event attributes after utility phase'
);
assert(
  countGeneratedHandlers(sectionSource('ui')) === 0,
  'UI section must contain zero generated event attributes'
);
assert(
  countGeneratedHandlers(sectionSource('auth')) === 0,
  'Auth section must contain zero generated event attributes'
);

assert(
  (index.match(/data-global-action=/g) || []).length === 2,
  'Expected exactly two generated utility action data contracts'
);
assert(
  index.includes('data-global-action="reload"'),
  'Reload utility contract missing'
);
assert(
  index.includes('data-global-action="home"'),
  'Home utility contract missing'
);
assert(
  (index.match(/generated-utility-actions\.js\?v=1/g) || []).length === 1,
  'Generated utility action loader must exist exactly once'
);

for (const forbidden of [
  'onclick="window.location.reload()"',
  'onclick="App.router.navigate(\'home\')"'
]) {
  assert(!index.includes(forbidden), 'Legacy generated utility handler restored: ' + forbidden);
}

for (const marker of [
  "getElementById('main-content')",
  "target.closest('[data-global-action]')",
  'element.dataset.globalAction',
  'window.location.reload()',
  "window.App.router.navigate('home')"
]) {
  assert(actions.includes(marker), 'Generated utility action marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Utility binder must not inject markup');
assert(!actions.includes('fetch('), 'Utility binder must not perform network calls');
assert(!actions.includes('supabase'), 'Utility binder must not touch Supabase');

console.log('CSP generated utility actions regression: PASS');
