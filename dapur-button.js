(() => {
  'use strict';

  /**
   * Kamar → Dapur CTA controller.
   *
   * Canonical UI contract:
   *   Premium + no Creator  -> Mulai Membuat Dapur -> /dapur
   *   Premium + Creator     -> Kelola Dapur Kamu   -> /dapur/{username}
   *   Non-Premium           -> leave Kamar flow untouched
   *
   * Authorization remains server-side in Dapur access gate + RLS.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/i;

  let refreshTimer = null;
  let observer = null;
  let inFlight = false;

  const app = () => window.App || null;
  const db = () => window.supabaseClient || null;
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeCreatorPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/dapur/${encodeURIComponent(slug)}` : null;
  }

  function findButton() {
    return document.querySelector(BUTTON_SELECTOR);
  }

  function normalizeLegacyButton() {
    const button = findButton();
    if (!button) return false;

    // Remove the legacy inline route immediately. The canonical controller owns this CTA.
    button.removeAttribute('onclick');
    button.type = 'button';
    button.dataset.dapurCtaManaged = '1';

    // Never leave the obsolete label visible while async state is resolving.
    if (!button.dataset.dapurResolved) {
      button.textContent = 'Mulai Membuat Dapur';
      button.dataset.dapurPending = '1';
    }

    return true;
  }

  function hasPremiumEntitlement() {
    const products = Array.isArray(app()?.state?.memberData?.verifiedProducts)
      ? app().state.memberData.verifiedProducts
      : [];
    return products.some(product => product && product.isFree === false);
  }

  async function getOwnCreator(userId) {
    const client = db();
    if (!client || !userId) return null;

    const { data, error } = await client
      .from('creator_profiles')
      .select('username')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return safeCreatorPath(data?.[0]?.username);
  }

  async function resolveTarget() {
    const A = app();
    const user = A?.state?.user;
    if (!user?.id) return null;

    const premium = hasPremiumEntitlement();
    const isAdmin = String(user.role || '').toLowerCase() === 'admin';
    if (!premium && !isAdmin) return null;

    const creatorPath = await getOwnCreator(user.id);

    return {
      label: creatorPath ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: creatorPath || '/dapur'
    };
  }

  function applyTarget(target) {
    const button = findButton();
    if (!button) return false;

    button.removeAttribute('onclick');
    button.type = 'button';
    button.textContent = target.label;
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = target.path;
    button.dataset.dapurResolved = '1';
    button.dataset.dapurPending = '0';

    if (button.dataset.dapurListenerBound === '1') return true;

    button.addEventListener('click', (event) => {
      event.preventDefault();

      const targetPath = button.dataset.dapurTarget || '/dapur';
      const safePath = targetPath === '/dapur'
        ? '/dapur'
        : safeCreatorPath(targetPath.replace(/^\/dapur\//, ''));

      if (!safePath) return;
      window.location.assign(safePath);
    });

    button.dataset.dapurListenerBound = '1';
    return true;
  }

  async function refresh() {
    if (inFlight || !findButton()) return;

    inFlight = true;
    try {
      normalizeLegacyButton();
      const target = await resolveTarget();
      if (target) {
        applyTarget(target);
      }
    } catch (error) {
      // Keep Kamar stable. Security never depends on this optional UI controller.
      console.warn('[Studihome Dapur CTA]', error?.message || error);
    } finally {
      inFlight = false;
    }
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refresh(), 80);
  }

  async function boot() {
    // Wait for canonical Kamar bootstrap.
    for (let i = 0; i < 100; i += 1) {
      if (app()?.state && db()?.auth) break;
      await wait(50);
    }

    if (!app()?.state || !db()?.auth) return;

    // Fast visual normalization first, then authoritative state resolution.
    normalizeLegacyButton();
    scheduleRefresh();

    const main = document.getElementById('main-content');
    if (!main || observer) return;

    observer = new MutationObserver(() => {
      normalizeLegacyButton();
      scheduleRefresh();
    });
    observer.observe(main, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
