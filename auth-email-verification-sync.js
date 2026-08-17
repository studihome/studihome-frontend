/**
 * AUTH EMAIL VERIFICATION SYNC MODULE
 * 
 * PURPOSE:
 * - Synchronizes auth state after email confirmation
 * - Broadcasts auth state changes to frontend modules
 * - Ensures /kamar dashboard always reads fresh verification status
 * 
 * FLOW:
 * 1. User confirms email via Supabase Auth callback
 * 2. Session now has email_verified = true
 * 3. auth.onAuthStateChange triggers
 * 4. Module syncs and broadcasts CustomEvent
 * 5. /kamar listens and updates UI immediately
 * 
 * CONSTRAINTS:
 * - No UI changes (kept in /kamar dashboard)
 * - Single canonical auth listener (no duplicates)
 * - Minimal memory footprint
 * - Compatible with existing Supabase config
 */

(function initAuthEmailVerificationSync() {
  'use strict';

  const MODULE_NAME = '[Studihome Auth Email Verification Sync]';
  const EVENT_NAME = 'auth:state-refreshed';
  const MAX_RETRIES = 120;
  const RETRY_INTERVAL = 50;

  let isInitialized = false;
  let authSubscription = null;

  /**
   * Get Supabase client singleton
   */
  function getClient() {
    return window.supabaseClient || null;
  }

  /**
   * Broadcast auth state change to all listeners
   * (Used by /kamar dashboard and other modules)
   */
  function broadcastAuthStateChange(user) {
    try {
      const event = new CustomEvent(EVENT_NAME, {
        detail: {
          user: user,
          timestamp: new Date().toISOString(),
          emailVerified: user?.email_confirmed || false,
        },
        bubbles: true,
        cancelable: false,
      });
      window.dispatchEvent(event);
      if (user) {
        console.log(
          `${MODULE_NAME} Auth state changed. Email verified: ${user.email_confirmed || false}`
        );
      }
    } catch (error) {
      console.warn(`${MODULE_NAME} Failed to broadcast auth state:`, error);
    }
  }

  /**
   * Listen to auth state changes
   * Triggered on:
   * - Initial load
   * - Email confirmation
   * - Login/logout
   * - Token refresh
   */
  function initAuthListener() {
    const client = getClient();
    if (!client?.auth) {
      console.warn(`${MODULE_NAME} Supabase client not ready`);
      return false;
    }

    // Single canonical listener (prevents duplicates)
    if (authSubscription) {
      console.log(`${MODULE_NAME} Auth listener already initialized`);
      return true;
    }

    try {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        // Event types: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, USER_UPDATED, TOKEN_REFRESHED
        const user = session?.user || null;

        if (event === 'INITIAL_SESSION') {
          console.log(
            `${MODULE_NAME} Initial session loaded. User: ${user?.id || 'anonymous'}`
          );
        }

        if (event === 'SIGNED_IN') {
          console.log(`${MODULE_NAME} User signed in: ${user?.email}`);
        }

        if (event === 'SIGNED_OUT') {
          console.log(`${MODULE_NAME} User signed out`);
        }

        // Broadcast state to all listeners (/kamar, etc.)
        broadcastAuthStateChange(user);
      });

      // Store subscription for cleanup (if needed later)
      authSubscription = data?.subscription || null;

      isInitialized = true;
      console.log(`${MODULE_NAME} Initialized successfully`);
      return true;
    } catch (error) {
      console.warn(`${MODULE_NAME} Failed to initialize:`, error);
      return false;
    }
  }

  /**
   * Wait for Supabase client to be ready
   * (Supabase config script loads it)
   */
  async function waitForSupabaseClient() {
    for (let i = 0; i < MAX_RETRIES; i++) {
      if (getClient()?.auth) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
    console.warn(`${MODULE_NAME} Supabase client did not load within timeout`);
    return false;
  }

  /**
   * Initialize on DOM ready
   */
  async function init() {
    if (isInitialized) return;

    const clientReady = await waitForSupabaseClient();
    if (!clientReady) {
      console.error(`${MODULE_NAME} Cannot initialize without Supabase client`);
      return;
    }

    initAuthListener();
  }

  /**
   * Bootstrap: wait for DOM ready, then init
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Export for debugging/testing
  window.StudihomeAuthEmailVerificationSync = {
    isInitialized: () => isInitialized,
    getEventName: () => EVENT_NAME,
    getClient,
  };
})();
