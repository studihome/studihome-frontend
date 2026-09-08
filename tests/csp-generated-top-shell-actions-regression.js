'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('generated-top-shell-actions.js', 'utf8');

const inlineScripts = [];
for (const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1] || '')) continue;
  inlineScripts.push(match[2] || '');
}

function generatedHandlerCount(source) {
  let count = 0;
  const regex = /<[a-zA-Z][^>]*?\s(on[a-z]+)\s*=/g;
  while (regex.exec(source)) count += 1;
  return count;
}

const totalGenerated = inlineScripts.reduce(
  (sum, source) => sum + generatedHandlerCount(source),
  0
);

assert(
  totalGenerated <= 179,
  'Expected at most 179 generated HTML event attributes after top-shell phase, found ' + totalGenerated
);

assert(
  (index.match(/data-app-route=/g) || []).length === 2,
  'Expected exactly two generated top navigation route data contracts'
);
assert(
  (index.match(/data-top-auth-action=/g) || []).length === 2,
  'Expected exactly two generated top-auth action data contracts'
);
assert(
  (index.match(/generated-top-shell-actions\.js\?v=1/g) || []).length === 1,
  'Generated top-shell action loader must exist exactly once'
);

const topShellStart = index.indexOf('renderNavigation: () => {');
const topShellEnd = index.indexOf('\n            router: {', topShellStart);
assert(topShellStart >= 0 && topShellEnd > topShellStart, 'Top-shell source boundary missing');
const topShellSource = index.slice(topShellStart, topShellEnd);

for (const forbidden of [
  'onclick="App.router.navigate',
  'onclick="App.auth.logout()',
  "onclick=\"App.ui.toggleModal('auth-modal', true)\""
]) {
  assert(!topShellSource.includes(forbidden), 'Legacy top-shell generated handler restored: ' + forbidden);
}

for (const marker of [
  'document.getElementById(containerId)',
  "bindDelegatedClick(\n      'top-nav-links'",
  "bindDelegatedClick(\n      'mobile-nav-links'",
  "bindDelegatedClick(\n      'top-auth-area'",
  "target.closest(selector)",
  'button.dataset.appRoute',
  'window.App.router.navigate(route)',
  'button.dataset.topAuthAction',
  'window.App.auth.logout()',
  "window.App.ui.toggleModal('auth-modal', true)"
]) {
  assert(actions.includes(marker), 'Generated top-shell action marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Top-shell binder must not inject markup');
assert(!actions.includes('fetch('), 'Top-shell binder must not perform network calls');
assert(!actions.includes('supabase'), 'Top-shell binder must not touch Supabase');

console.log('CSP generated top-shell actions regression: PASS');
