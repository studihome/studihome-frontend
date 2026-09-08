'use strict';

const fs = require('fs');
const vm = require('vm');

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


function runBehaviorSimulation() {
  const listeners = new Map();

  class FakeElement {
    constructor(dataset = {}, parent = null, inside = true) {
      this.dataset = dataset;
      this.parentElement = parent;
      this.inside = inside;
    }

    closest(selector) {
      const keyBySelector = {
        '[data-shop-submit]': 'shopSubmit',
        '[data-shop-change]': 'shopChange',
        '[data-shop-action]': 'shopAction'
      };
      const key = keyBySelector[selector];
      if (key && Object.prototype.hasOwnProperty.call(this.dataset, key)) {
        return this;
      }
      return this.parentElement?.closest(selector) || null;
    }
  }

  const container = new FakeElement({});
  container.addEventListener = (type, handler) => {
    const entries = listeners.get(type) || [];
    entries.push(handler);
    listeners.set(type, entries);
  };
  container.contains = element => element === container || element?.inside === true;

  const calls = {
    submit: [],
    change: 0,
    confirm: 0,
    close: []
  };

  const sandbox = {
    Element: FakeElement,
    document: {
      readyState: 'complete',
      getElementById: id => id === 'checkout-modal-content' ? container : null,
      addEventListener: () => {
        throw new Error('DOMContentLoaded listener should not be needed in complete state');
      }
    },
    window: {
      App: {
        shop: {
          submitOrderStep1: event => calls.submit.push(event),
          updatePaymentConfirmButton: () => { calls.change += 1; },
          submitPaymentConfirmation: () => { calls.confirm += 1; }
        },
        ui: {
          toggleModal: (...args) => calls.close.push(args)
        }
      }
    }
  };

  vm.runInNewContext(actions, sandbox, { filename: 'generated-shop-actions.js' });

  for (const type of ['submit', 'change', 'click']) {
    assert(
      (listeners.get(type) || []).length === 1,
      'Shop binder must attach exactly one ' + type + ' listener'
    );
  }
  assert(
    container.dataset.shopActionsBound === '1',
    'Shop binder must mark its stable container as bound'
  );

  // Re-evaluating the script against the same DOM must not double-bind listeners.
  vm.runInNewContext(actions, sandbox, { filename: 'generated-shop-actions.js' });
  for (const type of ['submit', 'change', 'click']) {
    assert(
      (listeners.get(type) || []).length === 1,
      'Shop binder must remain idempotent for ' + type
    );
  }

  const submitEvent = {
    target: new FakeElement({ shopSubmit: 'order-step1' })
  };
  listeners.get('submit')[0](submitEvent);
  assert(calls.submit.length === 1, 'Order Step 1 submit must call existing Shop handler once');
  assert(
    calls.submit[0] === submitEvent,
    'Order Step 1 must receive the original native submit Event object'
  );

  const checkbox = new FakeElement({ shopChange: 'payment-confirm' });
  listeners.get('change')[0]({ target: checkbox });
  assert(calls.change === 1, 'Payment checkbox change must update confirm-button state once');

  const confirmButton = new FakeElement({ shopAction: 'payment-confirm' });
  const confirmIcon = new FakeElement({}, confirmButton);
  listeners.get('click')[0]({ target: confirmIcon });
  assert(
    calls.confirm === 1,
    'Nested payment-confirm click must reach the delegated confirmation action once'
  );

  const closeButton = new FakeElement({ shopAction: 'checkout-close' });
  listeners.get('click')[0]({ target: closeButton });
  assert(calls.close.length === 1, 'Checkout close must call modal close once');
  assert(
    calls.close[0][0] === 'checkout-modal' && calls.close[0][1] === false,
    'Checkout close must preserve toggleModal checkout-modal,false arguments'
  );

  const unknown = new FakeElement({ shopAction: 'unknown' });
  listeners.get('click')[0]({ target: unknown });
  assert(calls.confirm === 1, 'Unknown Shop action must not trigger payment confirmation');
  assert(calls.close.length === 1, 'Unknown Shop action must not close checkout');

  const outside = new FakeElement({ shopAction: 'checkout-close' }, null, false);
  listeners.get('click')[0]({ target: outside });
  assert(calls.close.length === 1, 'Delegated Shop action must ignore elements outside container');
}

runBehaviorSimulation();

console.log('CSP generated Shop actions regression: PASS');
