'use strict';

const fs = require('fs');

const gudang = fs.readFileSync('admin-gudang-v2.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredQueryMarkers = [
  ".eq('status', 'VERIFIED')",
  ".eq('payment_status', 'PAID')",
  ".not('payment_confirmed_at', 'is', null)",
  ".not('verified_by', 'is', null)",
  ".order('payment_confirmed_at', { ascending: false })",
  'confirmedAt: o.payment_confirmed_at'
];

for (const marker of requiredQueryMarkers) {
  assert(
    gudang.includes(marker),
    `Confirmed-sales query contract missing: ${marker}`
  );
}

assert(
  !gudang.includes(".in('payment_status', ['PAID', 'CONFIRMED'])"),
  'Gudang must not count broad PAID/CONFIRMED payment states as accepted sales'
);

assert(
  !gudang.includes('createdAt: o.created_at'),
  'Gudang sales recap must not use order creation time as the recognition timestamp'
);

assert(
  gudang.includes('localMonthKey(o.confirmedAt)'),
  'Gudang period filtering must use payment confirmation time'
);

assert(
  gudang.includes('paid.map(o => localMonthKey(o.confirmedAt))'),
  'Gudang month options must be derived from confirmed sales'
);

for (const label of [
  'Total Transaksi Terkonfirmasi · Keseluruhan',
  'Total Harga Terkonfirmasi · Keseluruhan',
  'Transaksi Terkonfirmasi · ',
  'Total Harga Terkonfirmasi · '
]) {
  assert(gudang.includes(label), `Confirmed-sales UI label missing: ${label}`);
}

assert(
  index.includes('<script src="/admin-gudang-v2.js?v=6"></script>'),
  'Active Gudang runtime must use the v6 cache-busted asset'
);

console.log('Admin Gudang confirmed-sales regression: PASS');
