(() => {
  'use strict';

  /**
   * Canonical Kamar -> Dapur CTA synchronizer.
   *
   * The Kamar panel is rendered by index.html. This controller only
   * synchronizes its label + destination from authenticated, server-backed
   * Creator access and the user's own creator profile.
   *
   * Security boundary: Supabase RPC/RLS. The button is UX/navigation only.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const LEGACY_LABELS = new Set(['Mulai di Dapur', 'Buka Dapur']);
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/i;
  const CHECK_DELAY = 180;

  let timer = 0;
  let inFlight = false;
  let observer = null;
  let authSubscription = null;

  const db = () => window.supabaseClient || null;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeCreatorPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/dapur/${encodeURIComponent(slug)}` : null;
  }

  function findButton() {
    return document.querySelector(BUTTON_SELECTOR);
  }

  function normalizeLegacyState() {
    const button = findButton();
    if (!button) return;

    const label = String(button.textContent || '').trim();
    if (LEGACY_LABELS.has(label)) {
      if (button.textContent !== 'Memuat Dapur...') button.textContent = 'Memuat Dapur...';
      if (!button.disabled) button.disabled = true;
      if (button.getAttribute('aria-busy') !== 'true') button.setAttribute('aria-busy', 'true');
    }
  }

  async function resolveTarget() {
    const client = db();
    if (!client?.auth) return null;

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;

    const user = userData?.user;
    if (!user?.id) return null;

    // Single authoritative access decision for Creator workspace.
    const { data: access, error: accessError } = await client.rpc('has_creator_workspace_access');
    if (accessError) throw accessError;
    if (access !== true) return null;

    const { data: creator, error: creatorError } = await client
      .from('creator_profiles')
      .select('username')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (creatorError) throw creatorError;

    const creatorPath = safeCreatorPath(creator?.username);

    return {
      label: creatorPath ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: creatorPath || '/dapur'
    };
  }

  function applyTarget(target) {
    const button = findButton();
    if (!button || !target) return false;

    const currentPath = button.dataset.dapurTarget || '';
    const currentLabel = String(button.textContent || '').trim();

    button.removeAttribute('onclick');
    button.type = 'button';

    if (currentLabel !== target.label) button.textContent = target.label;
    if (button.disabled) button.disabled = false;
    if (button.hasAttribute('aria-busy')) button.removeAttribute('aria-busy');
    if (button.hasAttribute('aria-disabled')) button.removeAttribute('aria-disabled');
    if (button.dataset.dapurCtaManaged !== '1') button.dataset.dapurCtaManaged = '1';
    if (currentPath !== target.path) button.dataset.dapurTarget = target.path;

    if (button.dataset.dapurListenerBound !== '1') {
      button.addEventListener('click', (event) => {
        event.preventDefault();

        const rawPath = button.dataset.dapurTarget || '/dapur';
        const safePath = rawPath === '/dapur'
          ? '/dapur'
          : safeCreatorPath(rawPath.replace(/^\/dapur\//, ''));

        if (!safePath) return;
        window.location.assign(safePath);
      }, { passive: false });

      button.dataset.dapurListenerBound = '1';
    }

    return true;
  }

  async function sync() {
    const button = findButton();
    if (!button || inFlight) return;

    inFlight = true;
    try {
      normalizeLegacyState();
      const target = await resolveTarget();
      if (target) applyTarget(target);
    } catch (error) {
      console.warn('[Studihome Dapur CTA]', error?.message || error);
      // Never invent a Creator URL. Preserve Kamar if access lookup fails.
      const current = findButton();
      if (current && current.dataset.dapurCtaManaged !== '1') {
        current.disabled = false;
        current.removeAttribute('aria-busy');
      }
    } finally {
      inFlight = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = window.setTimeout(() => void sync(), CHECK_DELAY);
  }

  async function boot() {
    for (let i = 0; i < 120; i += 1) {
      if (db()?.auth) break;
      await sleep(50);
    }
    if (!db()?.auth) return;

    schedule();

    if (!observer && document.body) {
      observer = new MutationObserver(() => {
        if (document.querySelector(SELECTOR)) schedule();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (!authSubscription) {
      const { data } = db().auth.onAuthStateChange(() => schedule());
      authSubscription = data?.subscription || null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
