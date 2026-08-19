(() => {
  'use strict';

  if (window.__STUDIO_AI_ENHANCEMENTS_V1__) return;
  window.__STUDIO_AI_ENHANCEMENTS_V1__ = true;

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/studio-ai') return;

  const style = document.createElement('style');
  style.id = 'studio-ai-enhancements-v1';
  style.textContent = `
    /* Desktop-only whitespace cleanup: remove whitespace-only nodes immediately after the footer. */
    body > .site-footer + #auth-modal,
    body > .site-footer + #studio-smart-brief-modal,
    body > .site-footer + #creator-brief-modal { margin-top: 0 !important; }
    body > .site-footer { margin-bottom: 0 !important; }

    /* Premium desktop Smart Brief modal. Mobile layout remains the existing full-screen contract. */
    @media (min-width: 641px) {
      #studio-smart-brief-modal {
        padding: 1.25rem !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(63,72,191,.26), transparent 45%),
          rgba(15,23,42,.70) !important;
      }
      #studio-smart-brief-modal .studio-smart-modal-card {
        width: min(760px, calc(100vw - 2.5rem)) !important;
        max-width: 760px !important;
        max-height: min(760px, calc(100dvh - 2.5rem)) !important;
        padding: 1.35rem !important;
        border: 1px solid rgba(191,219,254,.72) !important;
        border-radius: 1.75rem !important;
        background:
          linear-gradient(180deg, rgba(255,255,255,.985) 0%, rgba(248,251,255,.985) 100%) !important;
        box-shadow:
          0 40px 100px rgba(15,23,42,.30),
          0 14px 36px rgba(21,28,117,.16),
          0 0 0 1px rgba(255,255,255,.55) inset !important;
      }
      #studio-smart-brief-modal .studio-smart-modal-card::before {
        content: '';
        display: block;
        height: 5px;
        margin: -1.35rem -1.35rem 1.15rem;
        border-radius: 1.75rem 1.75rem 0 0;
        background: linear-gradient(90deg, #151c75 0%, #3f48bf 58%, #f59e0b 100%);
      }
      #studio-smart-brief-modal .studio-smart-modal-card > div.pr-10 {
        padding-right: 2.6rem !important;
      }
      #studio-smart-brief-modal #studio-smart-brief-input {
        min-height: 148px;
        border-color: #d9e5f7 !important;
        box-shadow: inset 0 1px 2px rgba(15,23,42,.03), 0 8px 24px rgba(21,28,117,.05);
        transition: border-color .18s ease, box-shadow .18s ease;
      }
      #studio-smart-brief-modal #studio-smart-brief-input:focus {
        border-color: rgba(63,72,191,.6) !important;
        box-shadow: 0 0 0 4px rgba(63,72,191,.10), 0 12px 28px rgba(21,28,117,.08) !important;
      }
      #studio-smart-brief-modal .studio-smart-brief-actions {
        position: sticky;
        bottom: 0;
        margin: 1rem -0.15rem -0.15rem;
        padding-top: .8rem;
        background: linear-gradient(180deg, rgba(248,251,255,0) 0%, rgba(248,251,255,.96) 32%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #studio-smart-brief-modal .studio-smart-modal-card,
      #studio-smart-brief-modal #studio-smart-brief-input { transition: none !important; }
    }
  `;
  document.head.appendChild(style);

  function removeFooterWhitespaceNodes() {
    const footer = document.querySelector('body > footer.site-footer');
    if (!footer) return;

    // Only remove whitespace-only text nodes that directly follow the footer.
    let node = footer.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (node.nodeType === Node.TEXT_NODE && !String(node.nodeValue || '').trim()) {
        node.remove();
      } else {
        break;
      }
      node = next;
    }
  }

  function polishModal() {
    const modal = document.getElementById('studio-smart-brief-modal');
    const card = modal?.querySelector('.studio-smart-modal-card');
    if (!modal || !card) return;
    card.classList.add('studio-smart-premium-card');

    const actions = card.querySelector(':scope > .mt-5.flex.flex-wrap.justify-end.gap-2');
    if (actions) actions.classList.add('studio-smart-brief-actions');
  }

  function installSmartSubmitPatch() {
    const smart = window.App?.studioAI;
    if (!smart || typeof smart.submitSmartBrief !== 'function' || smart.__smartSubmitPatchedV1) return false;

    const originalSubmit = smart.submitSmartBrief;
    smart.submitSmartBrief = async function (...args) {
      const input = document.getElementById('studio-smart-brief-input');
      const briefText = String(input?.value || '').trim();
      if (!briefText || briefText.length < 2) {
        return originalSubmit.apply(this, args);
      }

      // Let the canonical SMART engine do the ranking first; we do not replace its scoring/fairness logic.
      this._query = briefText;
      this._creatorDisplayLimit = Math.max(Number(this._creatorDisplayLimit || 6), 6);
      this._smartLastResults = [];

      try {
        await Promise.resolve(this.runSmartDiscovery());
      } catch (error) {
        console.error('[Studio AI] Smart discovery failed:', error);
        App.ui?.toast?.('Pencarian SMART belum berhasil. Coba kata kunci yang sedikit lebih spesifik, ya.', 'error');
        return;
      }

      const results = Array.isArray(this._smartLastResults) ? this._smartLastResults : [];
      const best = results[0]?.c;
      const username = String(best?.username || '').trim().toLowerCase();

      // Preserve existing UI state if no Creator clears the relevance threshold.
      if (!username) {
        const creatorSec = document.getElementById('studio-ai-creator-section');
        const catSec = document.getElementById('studio-ai-category-section');
        if (catSec) catSec.classList.add('hidden');
        if (creatorSec) creatorSec.classList.remove('hidden');
        this.renderCreators();
        this.closeSmartBrief();
        setTimeout(() => creatorSec?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
        return;
      }

      // Close first so route transition cannot leave the modal layered above the Creator page.
      this.closeSmartBrief();

      // Use the existing canonical Creator router; no new route format is introduced.
      if (typeof App.router?.goCreator === 'function') {
        App.router.goCreator(username);
      } else if (typeof App.router?.navigate === 'function') {
        App.router.navigate(username);
      } else {
        window.location.assign(`/${encodeURIComponent(username)}`);
      }

      App.studioAI._signalCreator?.(username, 'profile');
      return best;
    };

    smart.__smartSubmitPatchedV1 = true;
    return true;
  }

  function install() {
    removeFooterWhitespaceNodes();
    polishModal();
    return installSmartSubmitPatch();
  }

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries >= 80) clearInterval(timer);
    }, 150);
  }

  const observer = new MutationObserver(() => {
    removeFooterWhitespaceNodes();
    polishModal();
    installSmartSubmitPatch();
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
