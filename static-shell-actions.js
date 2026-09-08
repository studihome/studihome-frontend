(() => {
  'use strict';

  function bindStaticShellActions() {
    const install = document.getElementById('pwa-install-link');
    const productClose = document.getElementById('product-detail-modal-close');
    const checkoutClose = document.getElementById('checkout-modal-close');
    const moduleClose = document.getElementById('module-modal-close');

    if (install) {
      install.addEventListener('click', event => {
        event.preventDefault();
        if (window.StudihomePWA) {
          window.StudihomePWA.show();
        }
      });
    }

    if (productClose) {
      productClose.addEventListener('click', () => {
        document.querySelectorAll('#product-detail-modal iframe').forEach(frame => {
          frame.src = '';
        });
        window.App.ui.toggleModal('product-detail-modal', false);
      });
    }

    if (checkoutClose) {
      checkoutClose.addEventListener('click', () => {
        window.App.ui.toggleModal('checkout-modal', false);
      });
    }

    if (moduleClose) {
      moduleClose.addEventListener('click', () => {
        window.App.ui.toggleModal('module-modal', false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStaticShellActions, { once: true });
  } else {
    bindStaticShellActions();
  }
})();
