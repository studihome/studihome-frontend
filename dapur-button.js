(() => {
  'use strict';

  /**
   * Kamar → Dapur CTA controller.
   *
   * This file is intentionally additive: it only owns the optional
   * #kamar-creator-entry CTA and never changes the existing Kamar flow.
   * Security remains server-side in the Dapur access gate / RLS.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/i;

  let refreshTimer = null;
  let observer = null;
  let wired = false;
  let inFlight = false;

  const db = () => window.supabaseClient || null;
  const app = () => window.App || null;

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeCreatorPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/dapur/${encodeURIComponent(slug)}` : null;
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
    const path = safeCreatorPath(username);
    return path ? { username, path } : null;
  }

  async function hasCreatorEligibility() {
    const client = db();
    if (!client) return false;

    // Exact eligibility check used by the Creator backend.
    const { data, error } = await client.rpc('is_creator_eligible');
    if (error) throw error;
    return data === true;
  }

  async function resolveTarget() {
    const user = app()?.state?.user;
    if (!user?.id) return null;

    // Do not rely on client-side product metadata as an authorization decision.
    // The RPC is the source of truth for Creator eligibility.
    const eligible = await hasCreatorEligibility();
    if (!eligible && String(user.role || '').toLowerCase() !== 'admin') return null;

    const creator = await getOwnCreator(user.id);
    return {
      label: creator ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: creator?.path || '/dapur'
    };
  }

  function applyTarget(target) {
    const button = document.querySelector(BUTTON_SELECTOR);
    if (!button) return false;

    // Remove the legacy router handler before attaching the canonical action.
    button.removeAttribute('onclick');
    button.type = 'button';
    button.textContent = target.label;
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = target.path;

    // Prevent duplicate listeners after Kamar re-renders the optional panel.
    if (button.dataset.dapurListenerBound === '1') return true;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const path = safeCreatorPath(button.dataset.dapurTarget?.replace(/^\/dapur\//, ''))
        || (button.dataset.dapurTarget === '/dapur' ? '/dapur' : null);
      if (!path) return;
      window.location.assign(path);
    });

    button.dataset.dapurListenerBound = '1';
    return true;
  }

  async function refresh() {
    if (inFlight) return;
    if (!document.querySelector(SELECTOR)) return;

    inFlight = true;
    try {
      const target = await resolveTarget();
      if (target) applyTarget(target);
    } catch (error) {
      // Fail closed for CTA customization: never replace or break Kamar.
      // The existing CTA remains available if eligibility/profile lookup fails.
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
    // Wait briefly for the canonical Kamar/Supabase bootstrap.
    for (let i = 0; i < 80; i += 1) {
      if (db()?.auth && app()?.state) break;
      await wait(50);
    }

    if (!db()?.auth || !app()?.state) return;

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
