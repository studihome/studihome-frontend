'use strict';

const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const version = '20260907112500';
const migration = fs.readFileSync(
  `supabase/migrations/${version}_reconcile_creator_portfolio_media_policy.sql`,
  'utf8'
);
const rollback = fs.readFileSync(
  `supabase/rollbacks/${version}_restore_creator_portfolio_media_policy.sql`,
  'utf8'
);
const preflight = fs.readFileSync(
  'supabase/tests/creator_portfolio_media_policy_preflight.sql',
  'utf8'
);
const verification = fs.readFileSync(
  'supabase/tests/creator_portfolio_media_policy_verification.sql',
  'utf8'
);
const editor = fs.readFileSync('dapur-editor.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/pr-syntax-validation.yml', 'utf8');

for (const marker of [
  'creator_portfolios_media_policy_v2',
  'validate constraint creator_portfolios_media_policy_v2',
  'd7871cbca030e70439584c39de0b65c1',
  'c05819a550b8add8316bb3dcc36aaeb6',
  '85efa3cd08de7b6ceb7c6eb6334fcf57',
  '155912782affbcc9d00fe952c28c38bf',
  "media_type='link'",
  "media_type='image'",
  "media_type='youtube'",
  'drop constraint creator_portfolios_external_media_policy',
  'drop constraint creator_portfolios_supported_media_check'
]) {
  assert(migration.includes(marker), `Migration marker missing: ${marker}`);
}

assert(
  !migration.includes("media_type='video'"),
  'Unified policy must not broaden current effective contract to native video'
);
assert(
  !migration.includes('lower(coalesce(media_type'),
  'Unified policy must preserve current case-sensitive effective media_type contract'
);

for (const marker of [
  'creator_portfolio_media_policy_preflight',
  'constraint fingerprint drifted',
  'rows_compatible'
]) {
  assert(preflight.includes(marker), `Preflight marker missing: ${marker}`);
}

for (const marker of [
  'allow_link',
  'allow_image',
  'allow_youtube',
  'allow_drive',
  'allow_tiktok',
  'allow_instagram',
  'deny_video',
  'deny_http',
  'deny_wrong_youtube_host',
  'deny_youtube_subdomain',
  'deny_uppercase_type',
  'deny_unknown_type',
  'rollback;'
]) {
  assert(verification.includes(marker), `Verification marker missing: ${marker}`);
}

for (const marker of [
  'creator_portfolios_external_media_policy',
  'creator_portfolios_media_type_check',
  'creator_portfolios_media_url_https_check',
  'creator_portfolios_supported_media_check',
  'drop constraint creator_portfolios_media_policy_v2'
]) {
  assert(rollback.toLowerCase().includes(marker.toLowerCase()), `Rollback marker missing: ${marker}`);
}

const notValidCount=(rollback.match(/not\s+valid;/gi)||[]).length;
assert(
  notValidCount===2,
  `Rollback must restore exactly two NOT VALID legacy constraints, found ${notValidCount}`
);

for (const [label,source] of [
  ['migration',migration],
  ['preflight',preflight],
  ['verification',verification],
  ['rollback',rollback]
]) {
  const lower=source.toLowerCase();
  for (const forbidden of [' grant ','\ngrant ',' revoke ','\nrevoke ','create policy','drop policy','alter policy']) {
    assert(!lower.includes(forbidden), `${label} unexpectedly changes permissions/RLS: ${forbidden}`);
  }
}

const startMarker='/* PORTFOLIO_INTAKE_PURE_START */';
const endMarker='/* PORTFOLIO_INTAKE_PURE_END */';
const start=editor.indexOf(startMarker);
const end=editor.indexOf(endMarker);
assert(start>=0 && end>start,'Portfolio pure helper markers missing');
const pure=editor.slice(start+startMarker.length,end);
const context={URL};
vm.createContext(context);
vm.runInContext(pure+'\nthis.__detect=detectPortfolioMedia;',context);
assert(
  context.__detect('https://cdn.example.com/work.mp4')==='link',
  'Current frontend must keep direct video files on safe link fallback while DB video remains disabled'
);

assert(
  workflow.includes('Creator portfolio media policy regression') &&
  workflow.includes('node tests/creator-portfolio-media-policy-regression.js'),
  'Release Gate wiring missing'
);

console.log('Creator portfolio media policy regression: PASS');
