/**
 * useAuthToken — Firebase ID Token Provider for WebSocket Auth
 *
 * Provides a fresh Firebase ID token for authenticating WebSocket connections.
 * Tokens are auto-refreshed before expiry (Firebase tokens last ~1 hour).
 *
 * Usage:
 *   const { token, isReady, error } = useAuthToken();
 *   // Pass `token` to SyncManager's authToken option
 *
 * The hook:
 * 1. Listens to Firebase auth state changes
 * 2. Fetches a fresh ID token when the user is authenticated
 * 3. Sets up proactive refresh 5 minutes before expiry
 * 4. Returns null token when not authenticated
 *
 * @module lib/auth/useAuthToken
 */

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

const logger = {
  info: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

/** How many milliseconds before token expiry to trigger a proactive refresh */
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes

/** Firebase ID tokens last approximately this long */
const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

export interface AuthTokenState {
  /** The current Firebase ID token, or null if not authenticated */
  token: string | null;
  /** True once the initial token fetch has completed (even if user is not logged in) */
  isReady: boolean;
  /** Error message if token fetch failed */
  error: string | null;
  /** Force a token refresh */
  refresh: () => Promise<string | null>;
}

export function useAuthToken(): AuthTokenState {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  /**
   * Fetch a fresh ID token from the current Firebase user.
   * If forceRefresh is true, bypasses the cache and gets a brand new token.
   */
  const fetchToken = useCallback(async (user: User | null, forceRefresh = false): Promise<string | null> => {
    if (!user) {
      if (mountedRef.current) {
        setToken(null);
        setError(null);
        setIsReady(true);
      }
      return null;
    }

    try {
      const idToken = await user.getIdToken(forceRefresh);

      if (mountedRef.current) {
        setToken(idToken);
        setError(null);
        setIsReady(true);
      }

      return idToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get auth token';
      logger.error('Token fetch failed:', err);

      if (mountedRef.current) {
        setToken(null);
        setError(message);
        setIsReady(true);
      }

      return null;
    }
  }, []);

  /**
   * Schedule a proactive token refresh before the current token expires.
   */
  const scheduleRefresh = useCallback(
    (user: User) => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      // Schedule refresh 5 minutes before expiry
      const refreshIn = TOKEN_LIFETIME_MS - REFRESH_MARGIN_MS;

      refreshTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;

        logger.info('Proactively refreshing auth token');
        const newToken = await fetchToken(user, true);

        if (newToken && mountedRef.current) {
          // Schedule the next refresh
          scheduleRefresh(user);
        }
      }, refreshIn);
    },
    [fetchToken]
  );

  /**
   * Public refresh method — forces a fresh token fetch.
   */
  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      return await fetchToken(user, true);
    } catch (err) {
      logger.error('Manual refresh failed:', err);
      return null;
    }
  }, [fetchToken]);

  useEffect(() => {
    mountedRef.current = true;

    let unsubscribe: (() => void) | null = null;

    try {
      const auth = getAuth();

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!mountedRef.current) return;

        if (user) {
          const idToken = await fetchToken(user);
          if (idToken) {
            scheduleRefresh(user);
          }
        } else {
          // User signed out
          setToken(null);
          setError(null);
          setIsReady(true);

          // Clear refresh timer
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }
        }
      });
    } catch (err) {
      // Firebase not initialized (SSR or test environment)
      logger.error('Firebase auth not available:', err);
      if (mountedRef.current) {
        setError('Firebase auth not available');
        setIsReady(true);
      }
    }

    return () => {
      mountedRef.current = false;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      unsubscribe?.();
    };
  }, [fetchToken, scheduleRefresh]);

  return { token, isReady, error, refresh };
}
