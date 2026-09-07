(() => {
  'use strict';

  function bindStaticSearchActions() {
    const brand = document.getElementById('studihome-brand-home');
    const openDesktop = document.getElementById('global-search-open-desktop');
    const openMobile = document.getElementById('global-search-open-mobile');
    const closeIcon = document.getElementById('global-search-close-icon');
    const closeSecondary = document.getElementById('global-search-close-secondary');
    const input = document.getElementById('global-search-modal-input');
    const submit = document.getElementById('global-search-submit');

    if (brand) {
      brand.addEventListener('click', () => window.App.router.navigate('home'));
    }
    if (openDesktop) {
      openDesktop.addEventListener('click', () => window.App.search.openModal());
    }
    if (openMobile) {
      openMobile.addEventListener('click', () => window.App.search.openModal());
    }
    if (closeIcon) {
      closeIcon.addEventListener('click', () => window.App.search.closeModal());
    }
    if (closeSecondary) {
      closeSecondary.addEventListener('click', () => window.App.search.closeModal());
    }
    if (input) {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          window.App.search.submitFromModal(input.value);
        }
      });
    }
    if (submit) {
      submit.addEventListener('click', () => {
        window.App.search.submitFromModal(input?.value || '');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStaticSearchActions, { once: true });
  } else {
    bindStaticSearchActions();
  }
})();
