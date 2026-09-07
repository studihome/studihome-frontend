'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const version = '20260907110644';
const migrationPath = `supabase/migrations/${version}_remove_redundant_entitlements_user_product_index.sql`;
const rollbackPath = `supabase/rollbacks/${version}_restore_redundant_entitlements_user_product_index.sql`;
const preflightPath = 'supabase/tests/entitlements_redundant_index_preflight.sql';
const verificationPath = 'supabase/tests/entitlements_redundant_index_verification.sql';

const migration = fs.readFileSync(migrationPath, 'utf8');
const rollback = fs.readFileSync(rollbackPath, 'utf8');
const preflight = fs.readFileSync(preflightPath, 'utf8');
const verification = fs.readFileSync(verificationPath, 'utf8');
const workflow = fs.readFileSync('.github/workflows/pr-syntax-validation.yml', 'utf8');

for (const marker of [
  'idx_entitlements_user_product',
  'entitlements_user_id_product_id_key',
  'indisunique=false',
  'con.contype=\'u\'',
  "execute 'drop index public.idx_entitlements_user_product'"
]) {
  assert(migration.includes(marker), `Migration marker missing: ${marker}`);
}

for (const marker of [
  'idx_entitlements_user_product',
  'entitlements_user_id_product_id_key',
  'constraint-backed replacement contract drifted',
  'idx_entitlements_user_id',
  'idx_entitlements_product_id',
  'idx_entitlements_order_id'
]) {
  assert(preflight.includes(marker), `Preflight marker missing: ${marker}`);
}

for (const marker of [
  'redundant index still exists',
  'replacement UNIQUE constraint/index invalid',
  'expected FK-leading indexes missing',
  "set_config('enable_seqscan','off',true)",
  'representative lookup lost indexed path',
  'rollback;'
]) {
  assert(verification.includes(marker), `Verification marker missing: ${marker}`);
}

assert(
  rollback.includes('create index idx_entitlements_user_product') &&
  rollback.includes('on public.entitlements using btree (user_id, product_id)'),
  'Exact rollback definition missing'
);

for (const [label, source] of [
  ['migration', migration],
  ['preflight', preflight],
  ['verification', verification],
  ['rollback', rollback]
]) {
  const lower = source.toLowerCase();
  for (const forbidden of [
    'drop table ',
    'alter table ',
    'drop constraint ',
    'create policy ',
    'alter policy ',
    'grant ',
    'revoke ',
    'insert into ',
    'update public.',
    'delete from '
  ]) {
    assert(!lower.includes(forbidden), `${label} unexpectedly widens blast radius: ${forbidden}`);
  }
}

assert(
  workflow.includes('Entitlements redundant index regression') &&
  workflow.includes('node tests/entitlements-redundant-index-regression.js'),
  'Release Gate wiring missing'
);

console.log('Entitlements redundant index regression: PASS');
