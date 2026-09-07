'use strict';

const fs = require('fs');

const entry = fs.readFileSync('dapur-entry.js', 'utf8');
const shell = fs.readFileSync('dapur.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const required = [
  "authModal.setAttribute('aria-hidden','true');authModal.inert=true;",
  "modal.inert=false;modal.setAttribute('aria-hidden','false');modal.style.display='flex'",
  "requestAnimationFrame(()=>{const target=modal.querySelector('#login-email')",
  "if(active instanceof HTMLElement&&authModal.contains(active))active.blur();",
  "authModal.inert=true;authModal.setAttribute('aria-hidden','true');authModal.style.display='none';",
  "restore.focus({preventScroll:true})",
  "if(password.length<6){toast('Kata sandi minimal 6 karakter.'"
];

for (const marker of required) {
  assert(entry.includes(marker), `Dapur auth accessibility guard missing: ${marker}`);
}

const closeStart = entry.indexOf('function closeAuth()');
assert(closeStart >= 0, 'closeAuth() missing');
const closeEnd = entry.indexOf('function validatePhoneForRegister', closeStart);
const closeBody = entry.slice(closeStart, closeEnd);
const blurPos = closeBody.indexOf('active.blur()');
const hiddenPos = closeBody.indexOf("setAttribute('aria-hidden','true')");
const inertPos = closeBody.indexOf('authModal.inert=true');
assert(blurPos >= 0 && hiddenPos >= 0 && inertPos >= 0, 'closeAuth ordering markers missing');
assert(blurPos < inertPos && blurPos < hiddenPos, 'Focus must leave modal before inert/aria-hidden is applied');

assert(
  shell.includes('/dapur-entry.js?v=20260907a11y1'),
  'Dapur shell must load the refreshed auth runtime asset'
);

console.log('Dapur auth modal accessibility regression: PASS');
