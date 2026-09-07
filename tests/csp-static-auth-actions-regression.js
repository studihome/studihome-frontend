'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');
const actions = fs.readFileSync('static-auth-actions.js', 'utf8');

const staticMarkup = index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const counts = {};
for (const match of staticMarkup.matchAll(/\s(on[a-z]+)\s*=/gi)) {
  const name = match[1].toLowerCase();
  counts[name] = (counts[name] || 0) + 1;
}
const totalHandlers = Object.values(counts).reduce((sum, value) => sum + value, 0);

assert(totalHandlers === 4, 'Expected 4 static inline handlers after Auth phase, found ' + totalHandlers);
assert((counts.onclick || 0) === 4, 'Expected 4 remaining static onclick handlers, found ' + (counts.onclick || 0));
assert((counts.onsubmit || 0) === 0, 'Static onsubmit must be zero after Auth phase');
assert((counts.onkeydown || 0) === 0, 'Static onkeydown must remain zero');

assert((index.match(/id="auth-modal-close"/g) || []).length === 1, 'Auth modal close ID must exist exactly once');
assert((index.match(/data-auth-mode="forgot-password"/g) || []).length === 1, 'Forgot mode contract missing');
assert((index.match(/data-auth-mode="register"/g) || []).length === 1, 'Register mode contract missing');
assert((index.match(/data-auth-mode="login"/g) || []).length === 2, 'Login mode contract must exist twice');

for (const formId of ['login-form', 'register-form', 'forgot-form']) {
  assert(
    (index.match(new RegExp('id="' + formId + '"', 'g')) || []).length === 1,
    'Expected exactly one #' + formId
  );
  assert(actions.includes("getElementById('" + formId + "')"), 'Auth binder missing #' + formId);
}

assert(
  (index.match(/static-auth-actions\.js\?v=1/g) || []).length === 1,
  'Static Auth action loader must exist exactly once'
);

assert(!/\sonsubmit\s*=/i.test(staticMarkup), 'Static onsubmit attribute restored');
assert(
  !/\sonclick\s*=\s*["'][^"']*(?:App\.auth|auth-modal)/i.test(staticMarkup),
  'Static Auth inline click handler restored'
);

for (const marker of [
  "addEventListener('click'",
  "addEventListener('submit'",
  "querySelectorAll('[data-auth-mode]')",
  'button.dataset.authMode',
  "window.App.ui.toggleModal('auth-modal', false)",
  'window.App.auth.handleLogin(event)',
  'window.App.auth.handleRegister(event)',
  'window.App.auth.handleForgotPassword(event)'
]) {
  assert(actions.includes(marker), 'Static Auth behavior marker missing: ' + marker);
}

assert(!actions.includes('innerHTML'), 'Auth binder must not inject markup');
assert(!actions.includes('fetch('), 'Auth binder must not perform network calls');
assert(!actions.includes('supabase'), 'Auth binder must not touch Supabase');

console.log('CSP static Auth actions regression: PASS');
