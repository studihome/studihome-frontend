'use strict';

const fs = require('fs');

const migrationPath = 'supabase/migrations/20260907004000_constrain_creator_trust_metrics_visibility.sql';
const migration = fs.readFileSync(migrationPath, 'utf8');
const preflight = fs.readFileSync('supabase/tests/creator_trust_metrics_preflight.sql', 'utf8');
const verification = fs.readFileSync('supabase/tests/creator_trust_metrics_visibility_verification.sql', 'utf8');
const rollback = fs.readFileSync('supabase/rollbacks/20260907004000_restore_creator_trust_metrics_visibility.sql', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredMigrationMarkers = [
  'create or replace function public.get_creator_trust_metrics(p_creator_id uuid)',
  'security definer',
  "set search_path to ''",
  'cp.is_published = true',
  'public.is_admin() as is_admin',
  'cp.user_id = c.uid',
  'public.has_creator_workspace_access()',
  'from allowed_creator;'
];

for (const marker of requiredMigrationMarkers) {
  assert(
    migration.toLowerCase().includes(marker.toLowerCase()),
    `Creator trust visibility hardening marker missing: ${marker}`
  );
}

const forbiddenMigrationMarkers = [
  'alter table ',
  'create table ',
  'drop table ',
  'create policy ',
  'alter policy ',
  'drop policy ',
  'grant ',
  'revoke ',
  'security invoker'
];

for (const marker of forbiddenMigrationMarkers) {
  assert(
    !migration.toLowerCase().includes(marker),
    `Unexpected blast-radius expansion in trust metrics migration: ${marker}`
  );
}

const requiredPreflightMarkers = [
  'get_creator_trust_metrics',
  'SECURITY DEFINER',
  'has_function_privilege',
  'anon',
  'authenticated',
  'creator_like_adjustments',
  'creator_external_ratings',
  'already hardened or changed',
  'creator_trust_metrics_preflight'
];

for (const marker of requiredPreflightMarkers) {
  assert(
    preflight.includes(marker),
    `Creator trust preflight marker missing: ${marker}`
  );
}

for (const marker of ['insert into ', 'update public.', 'delete from ', 'alter table ', 'grant ', 'revoke ']) {
  assert(
    !preflight.toLowerCase().includes(marker),
    `Creator trust preflight must remain read-only: ${marker}`
  );
}

const requiredVerificationMarkers = [
  'begin;',
  "set_config('request.jwt.claim.sub'",
  'Published Creator metrics unexpectedly denied.',
  'Anonymous caller can still read unpublished Creator metrics.',
  'Active Admin unexpectedly denied unpublished Creator metrics.',
  'Owning Creator with workspace access unexpectedly denied.',
  'rollback;'
];

for (const marker of requiredVerificationMarkers) {
  assert(
    verification.includes(marker),
    `Creator trust SQL verification marker missing: ${marker}`
  );
}

const forbiddenVerificationMarkers = [
  'insert into ',
  'update public.',
  'delete from ',
  'alter table ',
  'drop table ',
  'create table '
];

for (const marker of forbiddenVerificationMarkers) {
  assert(
    !verification.toLowerCase().includes(marker),
    `Creator trust verification must stay application-data read-only: ${marker}`
  );
}

const requiredRollbackMarkers = [
  'create or replace function public.get_creator_trust_metrics(p_creator_id uuid)',
  'security definer',
  "set search_path to ''",
  'where creator_id = p_creator_id'
];

for (const marker of requiredRollbackMarkers) {
  assert(
    rollback.toLowerCase().includes(marker.toLowerCase()),
    `Creator trust rollback marker missing: ${marker}`
  );
}

for (const marker of ['grant ', 'revoke ', 'alter table ', 'create policy ', 'drop policy ']) {
  assert(
    !rollback.toLowerCase().includes(marker),
    `Creator trust rollback must not widen blast radius: ${marker}`
  );
}

const profileAction = index.indexOf("action === 'GET_CREATOR_PROFILE'");
assert(profileAction >= 0, 'GET_CREATOR_PROFILE action missing from index.html');

const profileBlockEnd = index.indexOf("} else if (action ===", profileAction + 1);
const profileBlock = index.slice(
  profileAction,
  profileBlockEnd >= 0 ? profileBlockEnd : profileAction + 18000
);

const publishGuard = profileBlock.indexOf("if (!creator || !creator.is_published)");
const trustRpc = profileBlock.indexOf("rpc('get_creator_trust_metrics'");
assert(publishGuard >= 0, 'Published Creator guard missing before trust metrics RPC');
assert(trustRpc >= 0, 'Trust metrics RPC missing from current public Creator profile flow');
assert(
  publishGuard < trustRpc,
  'Public Creator profile must reject unpublished Creator before trust metrics RPC'
);

assert(
  !index.includes("rpc('get_creator_like_count'"),
  'Legacy get_creator_like_count unexpectedly became a runtime caller'
);

console.log('Creator trust metrics visibility regression: PASS');
