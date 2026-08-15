/*
 * LEGACY COMPATIBILITY TOMBSTONE — DO NOT ADD FEATURES HERE.
 *
 * The current Admin architecture no longer uses /admin-dapur.js.
 * This file exists temporarily so stale browser shells that still request
 * the old script cannot resurrect the global Dapur header or create a
 * second Supabase client.
 */
(() => {
  'use strict';
  if (window.__STUDIHOME_LEGACY_DAPUR_TOMBSTONE__) return;
  window.__STUDIHOME_LEGACY_DAPUR_TOMBSTONE__ = true;

  const removeLegacyDapurFromGlobalNav = () => {
    const roots = [
      document.getElementById('top-nav-links'),
      document.getElementById('mobile-nav-links')
    ].filter(Boolean);

    const normalize = (value = '') =>
      String(value).replace(/\s+/g, ' ').trim().toLowerCase();

    roots.forEach(root => {
      root.querySelectorAll('button, a').forEach(el => {
        const text = normalize(el.textContent || '');
        if (text === 'dapur' || text === 'dapur creator' || text === 'creator') {
          el.remove();
        }
      });
    });
  };

  const run = () => {
    removeLegacyDapurFromGlobalNav();
    // Re-render canonical navigation when available; it contains only the
    // official global items and does not register Dapur.
    try { window.App?.ui?.renderNavigation?.(); } catch (_) {}
    removeLegacyDapurFromGlobalNav();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // One short delayed pass covers stale shells whose navigation renders
  // after authentication/bootstrap. No persistent observer is used.
  setTimeout(run, 1200);
})();
