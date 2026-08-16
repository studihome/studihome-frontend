(() => {
  'use strict';

  /**
   * Kamar → Dapur CTA controller.
   *
   * Additive-only integration: this file owns only the optional
   * #kamar-creator-entry CTA and never changes the existing Kamar flow.
   * Authorization remains server-side in the Creator access gate / RLS.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/i;

  let refreshTimer = null;
  let observer = null;
  let inFlight = false;

  const app = () => window.App || null;
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeCreatorPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/dapur/${encodeURIComponent(slug)}` : null;
  }

  async function resolveTarget() {
    const A = app();
    const user = A?.state?.user;
    if (!user?.id || typeof A?.api?.post !== 'function') return null;

    // Reuse the canonical server-backed Creator eligibility/profile contract.
    // Do not infer authorization from client-side product metadata.
    const studio = await A.api.post('GET_CREATOR_STUDIO');
    if (!studio?.eligible && String(user.role || '').toLowerCase() !== 'admin') return null;

    const creatorPath = safeCreatorPath(studio?.profile?.username);
    return {
      label: creatorPath ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: creatorPath || '/dapur'
    };
  }

  function applyTarget(target) {
    const button = document.querySelector(BUTTON_SELECTOR);
    if (!button) return false;

    // Remove the legacy inline router action before attaching the canonical route.
    button.removeAttribute('onclick');
    button.type = 'button';
    button.textContent = target.label;
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = target.path;

    // Kamar may rerender this panel; do not stack click handlers on the same node.
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
      // Preserve the existing Kamar experience when the optional lookup fails.
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
    // Wait for the canonical Kamar bootstrap so App.api and App.state are ready.
    for (let i = 0; i < 80; i += 1) {
      if (app()?.state && typeof app()?.api?.post === 'function') break;
      await wait(50);
    }

    if (!app()?.state || typeof app()?.api?.post !== 'function') return;

    scheduleRefresh();

    const main = document.getElementById('main-content');
    if (!main || observer) return;

    // The Kamar panel is rendered asynchronously. Observe only its content root.
    observer = new MutationObserver(() => scheduleRefresh());
    observer.observe(main, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
