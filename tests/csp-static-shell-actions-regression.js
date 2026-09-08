'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('static-shell-actions.js', 'utf8');

const staticMarkup = index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const handlers = [...staticMarkup.matchAll(/\s(on[a-z]+)\s*=/gi)];
assert(
  handlers.length === 0,
  'Static inline event handlers must be zero after Phase D, found ' + handlers.length
);

assert(
  !/\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(staticMarkup),
  'javascript: URL introduced into static markup'
);

for (const id of [
  'pwa-install-link',
  'product-detail-modal-close',
  'checkout-modal-close',
  'module-modal-close'
]) {
  const found = index.split('id="' + id + '"').length - 1;
  assert(found === 1, 'Expected exactly one #' + id + ', found ' + found);
  assert(actions.includes("getElementById('" + id + "')"), 'Shell binder missing #' + id);
}

assert(
  index.includes('id="pwa-install-link" href="#install"'),
  'PWA install link href contract must remain #install'
);
assert(
  (index.match(/static-shell-actions\.js\?v=1/g) || []).length === 1,
  'Static shell action loader must exist exactly once'
);

for (const marker of [
  "event.preventDefault()",
  "window.StudihomePWA.show()",
  "document.querySelectorAll('#product-detail-modal iframe')",
  "frame.src = ''",
  "window.App.ui.toggleModal('product-detail-modal', false)",
  "window.App.ui.toggleModal('checkout-modal', false)",
  "window.App.ui.toggleModal('module-modal', false)"
]) {
  assert(actions.includes(marker), 'Static shell behavior marker missing: ' + marker);
}

assert(
  actions.indexOf("frame.src = ''") <
    actions.indexOf("window.App.ui.toggleModal('product-detail-modal', false)"),
  'Product iframe cleanup must happen before product-detail modal close'
);

assert(!actions.includes('innerHTML'), 'Shell binder must not inject markup');
assert(!actions.includes('fetch('), 'Shell binder must not perform network calls');
assert(!actions.includes('supabase'), 'Shell binder must not touch Supabase');

console.log('CSP static shell actions regression: PASS');

assert(
  index.includes('usesNativeInstallUI: true'),
  'Home/Studio AI shell must use native Chromium install UI'
);
for (const forbidden of [
  "addEventListener('beforeinstallprompt'",
  'addEventListener("beforeinstallprompt"',
  'deferred.prompt()',
  'deferred.userChoice'
]) {
  assert(!index.includes(forbidden), 'Legacy custom Chromium install flow restored: ' + forbidden);
}
