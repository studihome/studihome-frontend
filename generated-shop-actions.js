(() => {
  'use strict';

  function bindGeneratedShopActions() {
    const container = document.getElementById('checkout-modal-content');
    if (!container || container.dataset.shopActionsBound === '1') return;

    container.addEventListener('submit', event => {
      const form = event.target instanceof Element
        ? event.target.closest('[data-shop-submit]')
        : null;
      if (!form || !container.contains(form)) return;

      if (form.dataset.shopSubmit === 'order-step1') {
        window.App.shop.submitOrderStep1(event);
      }
    });

    container.addEventListener('change', event => {
      const element = event.target instanceof Element
        ? event.target.closest('[data-shop-change]')
        : null;
      if (!element || !container.contains(element)) return;

      if (element.dataset.shopChange === 'payment-confirm') {
        window.App.shop.updatePaymentConfirmButton();
      }
    });

    container.addEventListener('click', event => {
      const element = event.target instanceof Element
        ? event.target.closest('[data-shop-action]')
        : null;
      if (!element || !container.contains(element)) return;

      const action = element.dataset.shopAction || '';
      if (action === 'payment-confirm') {
        window.App.shop.submitPaymentConfirmation();
        return;
      }
      if (action === 'checkout-close') {
        window.App.ui.toggleModal('checkout-modal', false);
      }
    });

    container.dataset.shopActionsBound = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGeneratedShopActions, { once: true });
  } else {
    bindGeneratedShopActions();
  }
})();
