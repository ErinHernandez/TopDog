/**
 * VX2 Draft Logic - Connection Status Hook
 *
 * Monitors and handles connection state for real-time draft updates.
 * Provides reconnection logic and offline detection.
 *
 * Key features:
 * - Detects online/offline status
 * - Monitors Firestore connection health
 * - Auto-reconnect with exponential backoff
 * - Provides connection quality indicators
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[ConnectionStatus]');

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface ConnectionInfo {
  /** Current connection state */
  state: ConnectionState;
  /** Whether currently online (browser reports online) */
  isOnline: boolean;
  /** Whether Firestore is connected */
  isFirestoreConnected: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: number | null;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Time until next reconnection attempt (ms) */
  nextReconnectIn: number | null;
  /** Error message if in error state */
  errorMessage: string | null;
}

export interface UseConnectionStatusOptions {
  /** Room ID to monitor (optional, for room-specific health checks) */
  roomId?: string;
  /** Whether to enable auto-reconnection */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts before giving up */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff (ms) */
  baseReconnectDelay?: number;
  /** Maximum delay between reconnection attempts (ms) */
  maxReconnectDelay?: number;
  /** Callback when connection is restored */
  onReconnected?: () => void;
  /** Callback when connection is lost */
  onDisconnected?: () => void;
  /** Callback when reconnection fails */
  onReconnectFailed?: () => void;
}

export interface UseConnectionStatusResult extends ConnectionInfo {
  /** Manually trigger reconnection */
  reconnect: () => Promise<void>;
  /** Force disconnect (for testing) */
  disconnect: () => Promise<void>;
  /** Reset connection state */
  reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_BASE_RECONNECT_DELAY = 1000; // 1 second
const DEFAULT_MAX_RECONNECT_DELAY = 30000; // 30 seconds

// ============================================================================
// HOOK
// ============================================================================

export function useConnectionStatus({
  roomId,
  autoReconnect = true,
  maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  baseReconnectDelay = DEFAULT_BASE_RECONNECT_DELAY,
  maxReconnectDelay = DEFAULT_MAX_RECONNECT_DELAY,
  onReconnected,
  onDisconnected,
  onReconnectFailed,
}: UseConnectionStatusOptions = {}): UseConnectionStatusResult {
  // State
  const [state, setState] = useState<ConnectionState>('connecting');
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [nextReconnectIn, setNextReconnectIn] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onReconnectedRef = useRef(onReconnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onReconnectFailedRef = useRef(onReconnectFailed);
  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  // Update callback refs
  useEffect(() => {
    onReconnectedRef.current = onReconnected;
    onDisconnectedRef.current = onDisconnected;
    onReconnectFailedRef.current = onReconnectFailed;
  }, [onReconnected, onDisconnected, onReconnectFailed]);

  // -------------------------------------------------------------------------
  // BROWSER ONLINE/OFFLINE DETECTION
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      logger.info('Browser went online');
      setIsOnline(true);

      // Trigger reconnection when coming back online
      if (autoReconnect && state === 'disconnected') {
        scheduleReconnectRef.current?.();
      }
    };

    const handleOffline = () => {
      logger.info('Browser went offline');
      setIsOnline(false);
      setState('disconnected');
      onDisconnectedRef.current?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoReconnect, state]);

  // -------------------------------------------------------------------------
  // FIRESTORE CONNECTION MONITORING
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!db) {
      setState('error');
      setErrorMessage('Firebase not initialized');
      return;
    }

    // Monitor connection by subscribing to a lightweight document
    // We'll use the room document if available, otherwise use a health check doc
    const monitorPath = roomId
      ? `draftRooms/${roomId}`
      : '.info/connected'; // Firestore doesn't have .info, so we'll use a different approach

    // For room-specific monitoring
    if (roomId) {
      const roomRef = doc(db, 'draftRooms', roomId);

      const unsubscribe = onSnapshot(
        roomRef,
        () => {
          // Successful snapshot = connected
          if (!isFirestoreConnected) {
            logger.info('Firestore connected');
            setIsFirestoreConnected(true);
            setState('connected');
            setLastSyncAt(Date.now());
            setReconnectAttempts(0);
            setNextReconnectIn(null);
            setErrorMessage(null);

            if (reconnectAttempts > 0) {
              onReconnectedRef.current?.();
            }
          } else {
            // Update last sync time on each snapshot
            setLastSyncAt(Date.now());
          }
        },
        (error) => {
          logger.error('Firestore subscription error', error as Error);
          setIsFirestoreConnected(false);
          setErrorMessage(error.message);

          if (isOnline) {
            setState('reconnecting');
            if (autoReconnect) {
              scheduleReconnectRef.current?.();
            }
          } else {
            setState('disconnected');
          }

          onDisconnectedRef.current?.();
        }
      );

      return () => unsubscribe();
    } else {
      // Generic connection monitoring without room
      // Just check if we're online and Firebase is initialized
      if (isOnline && db) {
        setIsFirestoreConnected(true);
        setState('connected');
      }
    }
  }, [roomId, isOnline, autoReconnect, isFirestoreConnected, reconnectAttempts]);

  // -------------------------------------------------------------------------
  // RECONNECTION LOGIC
  // -------------------------------------------------------------------------

  const calculateReconnectDelay = useCallback(
    (attempts: number): number => {
      // Exponential backoff with jitter
      const exponentialDelay = baseReconnectDelay * Math.pow(2, attempts);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      return Math.min(exponentialDelay + jitter, maxReconnectDelay);
    },
    [baseReconnectDelay, maxReconnectDelay]
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      setState('error');
      setErrorMessage('Connection failed after multiple attempts');
      onReconnectFailedRef.current?.();
      return;
    }

    const delay = calculateReconnectDelay(reconnectAttempts);
    logger.info('Scheduling reconnection', { attempt: reconnectAttempts + 1, delay });

    setNextReconnectIn(delay);

    // Start countdown
    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const remaining = delay - (Date.now() - startTime);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
        setNextReconnectIn(null);
      } else {
        setNextReconnectIn(remaining);
      }
    }, 100);

    // Schedule reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      attemptReconnect();
    }, delay);
  }, [reconnectAttempts, maxReconnectAttempts, calculateReconnectDelay, attemptReconnect]);

  const attemptReconnect = useCallback(async () => {
    if (!db) return;

    logger.info('Attempting reconnection', { attempt: reconnectAttempts + 1 });
    setState('reconnecting');
    setReconnectAttempts((prev) => prev + 1);

    try {
      // Force Firestore to reconnect by toggling network
      await disableNetwork(db);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await enableNetwork(db);

      // Connection restoration will be detected by the snapshot listener
    } catch (error) {
      logger.error('Reconnection attempt failed', error as Error);

      if (reconnectAttempts + 1 < maxReconnectAttempts) {
        scheduleReconnectRef.current?.();
      } else {
        setState('error');
        setErrorMessage('Failed to reconnect');
        onReconnectFailedRef.current?.();
      }
    }
  }, [reconnectAttempts, maxReconnectAttempts]);

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // UPDATE SCHEDULE RECONNECT REF
  // -------------------------------------------------------------------------

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  // -------------------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------------------

  const reconnect = useCallback(async () => {
    logger.info('Manual reconnection triggered');
    setReconnectAttempts(0);
    await attemptReconnect();
  }, [attemptReconnect]);

  const disconnect = useCallback(async () => {
    if (!db) return;

    logger.info('Manual disconnect triggered');
    try {
      await disableNetwork(db);
      setIsFirestoreConnected(false);
      setState('disconnected');
    } catch (error) {
      logger.error('Disconnect failed', error as Error);
    }
  }, []);

  const reset = useCallback(() => {
    setReconnectAttempts(0);
    setNextReconnectIn(null);
    setErrorMessage(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------

  return {
    state,
    isOnline,
    isFirestoreConnected,
    lastSyncAt,
    reconnectAttempts,
    nextReconnectIn,
    errorMessage,
    reconnect,
    disconnect,
    reset,
  };
}

export default useConnectionStatus;
