'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('generated-home-actions.js', 'utf8');

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

const totalGenerated = countGeneratedHandlers(core);
assert(
  totalGenerated <= 176,
  'Expected at most 176 core generated HTML event attributes after Home phase, found ' + totalGenerated
);

const homeStart = core.search(/\n\s{12}home:\s*\{/);
assert(homeStart >= 0, 'Home source section missing');
const afterHome = core.slice(homeStart + 1);
const nextSection = afterHome.search(/\n\s{12}[A-Za-z_$][\w$]*:\s*\{/);
assert(nextSection > 0, 'Home source end boundary missing');
const homeSource = core.slice(homeStart, homeStart + 1 + nextSection);

assert(
  countGeneratedHandlers(homeSource) === 0,
  'Home source must contain zero generated HTML event attributes'
);
assert(
  !/setAttribute\(\s*['"]on[a-z]+['"]\s*,/i.test(homeSource),
  'Home source must not dynamically set event-handler attributes'
);
assert(
  !homeSource.includes('[onclick*="handleCtaClick"]'),
  'Legacy Hero CTA onclick selector restored'
);

assert(
  (index.match(/data-home-cta-url=/g) || []).length === 2,
  'Expected exactly two Home CTA URL data contracts'
);
assert(
  (index.match(/data-home-route=/g) || []).length === 1,
  'Expected exactly one Home route data contract'
);
assert(
  (index.match(/generated-home-actions\.js\?v=1/g) || []).length === 1,
  'Generated Home action loader must exist exactly once'
);

for (const marker of [
  "getElementById('main-content')",
  "target.closest('[data-home-cta-url], [data-home-route]')",
  'element.dataset.homeCtaUrl',
  'window.App.home.handleCtaClick(ctaUrl)',
  'element.dataset.homeRoute',
  'window.App.router.navigate(route)'
]) {
  assert(actions.includes(marker), 'Generated Home action marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Home binder must not inject markup');
assert(!actions.includes('fetch('), 'Home binder must not perform network calls');
assert(!actions.includes('supabase'), 'Home binder must not touch Supabase');

console.log('CSP generated Home actions regression: PASS');
