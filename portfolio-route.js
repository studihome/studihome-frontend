'use strict';

const MAX_SLUG_LENGTH = 120;
const COLLISION_SUFFIX_LENGTH = 8;

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

  const suffix = normalizeId(item?.id).slice(0, COLLISION_SUFFIX_LENGTH);
  if (!suffix) return base;

  const baseLimit = Math.max(
    1,
    MAX_SLUG_LENGTH - 1 - suffix.length
  );
  return `${base.slice(0, baseLimit)}-${suffix}`;
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
  slugify,
  baseSlug,
  routeSlug,
  findByRouteSlug
};
