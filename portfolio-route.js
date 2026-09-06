'use strict';

const MAX_SLUG_LENGTH = 120;
const COLLISION_SEPARATOR = '--';
const COLLISION_SUFFIX_STEPS = [8, 12, 16, 20, 24, 28, 32];

const slugify = value => String(value || '')
  .toLowerCase()
  .trim()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, MAX_SLUG_LENGTH);

const normalizeId = value => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const baseSlug = item => {
  const fromTitle = slugify(item?.title);
  if (fromTitle) return fromTitle;
  const fromId = normalizeId(item?.id).slice(0, MAX_SLUG_LENGTH);
  return fromId || 'portfolio';
};

const collisionCount = (item, siblings = []) => {
  const base = baseSlug(item);
  return (Array.isArray(siblings) ? siblings : [])
    .filter(candidate => baseSlug(candidate) === base)
    .length;
};

const routeSlug = (item, siblings = []) => {
  const base = baseSlug(item);
  if (collisionCount(item, siblings) <= 1) return base;

  const normalizedId = normalizeId(item?.id);
  if (!normalizedId) return base;

  const collidingItems = (Array.isArray(siblings) ? siblings : [])
    .filter(candidate => baseSlug(candidate) === base);
  const suffixLength = COLLISION_SUFFIX_STEPS.find(length => {
    const candidatePrefix = normalizedId.slice(0, length);
    if (!candidatePrefix) return false;
    return collidingItems.filter(
      candidate => normalizeId(candidate?.id).slice(0, length) === candidatePrefix
    ).length === 1;
  }) || normalizedId.length;

  const suffix = normalizedId.slice(0, suffixLength);
  const baseLimit = Math.max(
    1,
    MAX_SLUG_LENGTH - COLLISION_SEPARATOR.length - suffix.length
  );
  return `${base.slice(0, baseLimit)}${COLLISION_SEPARATOR}${suffix}`;
};

const findByRouteSlug = (siblings = [], candidateSlug = '') => {
  const items = Array.isArray(siblings) ? siblings : [];
  const normalized = String(candidateSlug || '').trim().toLowerCase();
  if (!normalized) return null;

  const canonical = items.find(
    item => routeSlug(item, items) === normalized
  );
  if (canonical) return canonical;

  // Backward compatibility for historical title-only deep links.
  return items.find(
    item =>
      baseSlug(item) === normalized ||
      String(item?.id || '').trim().toLowerCase() === normalized
  ) || null;
};

module.exports = {
  MAX_SLUG_LENGTH,
  COLLISION_SEPARATOR,
  slugify,
  baseSlug,
  routeSlug,
  findByRouteSlug
};
