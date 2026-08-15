(() => {
  'use strict';
  // Canonical /dapur routing is now handled by Vercel -> /dapur.html.
  // Keep this as a harmless compatibility shim for any legacy index.html include.
  window.StudihomeDapurRoute = Object.freeze({ canonical: true });
})();
