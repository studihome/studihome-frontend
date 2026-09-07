'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync('index.html', 'utf8');

const inlineScripts = [];
for (const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1] || '')) continue;
  inlineScripts.push(match[2] || '');
}

assert(inlineScripts.length >= 6, 'Expected at least six inline scripts');
const smartScript = inlineScripts[5];

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
  totalGenerated <= 183,
  'Expected at most 183 generated HTML event attributes after SMART phase, found ' + totalGenerated
);
assert(
  generatedHandlerCount(smartScript) === 0,
  'SMART Team-vs-Solo script must contain zero generated HTML event attributes'
);
assert(
  (smartScript.match(/data-smart-next-action=/g) || []).length === 1,
  'SMART generated action data contract must exist exactly once'
);
for (const marker of [
  "box.addEventListener('click'",
  "target.closest('[data-smart-next-action]')",
  'button.dataset.smartNextAction',
  "smart._executeNextBestAction(button.dataset.smartNextAction || '')",
  "box.dataset.smartTeamSoloActionBound = '1'"
]) {
  assert(smartScript.includes(marker), 'SMART delegated action marker missing: ' + marker);
}

assert(
  !smartScript.includes('onclick="App.studioAI._executeNextBestAction'),
  'Legacy SMART generated onclick restored'
);

console.log('CSP SMART generated action regression: PASS');
