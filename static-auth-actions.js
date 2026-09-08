(() => {
  'use strict';

  function bindStaticAuthActions() {
    const close = document.getElementById('auth-modal-close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');

    if (close) {
      close.addEventListener('click', () => {
        window.App.ui.toggleModal('auth-modal', false);
      });
    }

    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => {
        window.App.auth.toggleAuthMode(button.dataset.authMode || 'login');
      });
    });

    if (loginForm) {
      loginForm.addEventListener('submit', event => {
        window.App.auth.handleLogin(event);
      });
    }
    if (registerForm) {
      registerForm.addEventListener('submit', event => {
        window.App.auth.handleRegister(event);
      });
    }
    if (forgotForm) {
      forgotForm.addEventListener('submit', event => {
        window.App.auth.handleForgotPassword(event);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStaticAuthActions, { once: true });
  } else {
    bindStaticAuthActions();
  }
})();
