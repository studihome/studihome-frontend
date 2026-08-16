(() => {
  'use strict';

  /**
   * Kamar → Dapur CTA controller.
   *
   * Additive-only integration: only owns #kamar-creator-entry.
   * UI state comes from the canonical Kamar member entitlement/profile data.
   * Security remains server-side in Dapur access gate + RLS.
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

  function hasPremiumEntitlement() {
    const A = app();
    const products = Array.isArray(A?.state?.memberData?.verifiedProducts)
      ? A.state.memberData.verifiedProducts
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

    const username = data?.[0]?.username || '';
    return safeCreatorPath(username);
  }

  async function resolveTarget() {
    const A = app();
    const user = A?.state?.user;
    if (!user?.id) return null;

    // The Kamar panel itself is only surfaced for Premium users. Re-check the
    // entitlement here so the CTA cannot accidentally expose Creator to others.
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
    const button = document.querySelector(BUTTON_SELECTOR);
    if (!button) return false;

    button.removeAttribute('onclick');
    button.type = 'button';
    button.textContent = target.label;
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = target.path;

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
    if (inFlight || !document.querySelector(SELECTOR)) return;

    inFlight = true;
    try {
      const target = await resolveTarget();
      if (target) applyTarget(target);
    } catch (error) {
      console.warn('[Studihome Dapur CTA]', error?.message || error);
    } finally {
      inFlight = false;
    }
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refresh(), 120);
  }

  async function boot() {
    for (let i = 0; i < 80; i += 1) {
      if (app()?.state && db()?.auth) break;
      await wait(50);
    }

    if (!app()?.state || !db()?.auth) return;

    scheduleRefresh();

    const main = document.getElementById('main-content');
    if (!main || observer) return;

    observer = new MutationObserver(() => scheduleRefresh());
    observer.observe(main, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
