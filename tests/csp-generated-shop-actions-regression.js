'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('generated-shop-actions.js', 'utf8');

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
  countGeneratedHandlers(core) <= 170,
  'Expected at most 170 core generated HTML event attributes after Shop phase'
);
assert(
  countGeneratedHandlers(sectionSource('shop')) === 0,
  'Shop section must contain zero generated HTML event attributes'
);

assert(
  (index.match(/data-shop-submit=/g) || []).length === 1,
  'Expected exactly one generated Shop submit contract'
);
assert(
  (index.match(/data-shop-change=/g) || []).length === 1,
  'Expected exactly one generated Shop change contract'
);
assert(
  (index.match(/data-shop-action=/g) || []).length === 2,
  'Expected exactly two generated Shop click contracts'
);
assert(index.includes('data-shop-submit="order-step1"'), 'Shop order-step1 submit contract missing');
assert(index.includes('data-shop-change="payment-confirm"'), 'Shop payment change contract missing');
assert(index.includes('data-shop-action="payment-confirm"'), 'Shop payment confirmation action missing');
assert(index.includes('data-shop-action="checkout-close"'), 'Shop checkout close action missing');
assert(
  (index.match(/generated-shop-actions\.js\?v=1/g) || []).length === 1,
  'Generated Shop action loader must exist exactly once'
);

for (const forbidden of [
  'onsubmit="App.shop.submitOrderStep1(event)"',
  'onchange="App.shop.updatePaymentConfirmButton()"',
  'onclick="App.shop.submitPaymentConfirmation()"',
  "onclick=\"App.ui.toggleModal('checkout-modal', false)\""
]) {
  assert(!index.includes(forbidden), 'Legacy generated Shop handler restored: ' + forbidden);
}

for (const marker of [
  "getElementById('checkout-modal-content')",
  "container.addEventListener('submit'",
  "container.addEventListener('change'",
  "container.addEventListener('click'",
  "target.closest('[data-shop-submit]')",
  "target.closest('[data-shop-change]')",
  "target.closest('[data-shop-action]')",
  'window.App.shop.submitOrderStep1(event)',
  'window.App.shop.updatePaymentConfirmButton()',
  'window.App.shop.submitPaymentConfirmation()',
  "window.App.ui.toggleModal('checkout-modal', false)"
]) {
  assert(actions.includes(marker), 'Generated Shop action marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Shop binder must not inject markup');
assert(!actions.includes('fetch('), 'Shop binder must not perform network calls');
assert(!actions.includes('supabase'), 'Shop binder must not touch Supabase');

console.log('CSP generated Shop actions regression: PASS');
