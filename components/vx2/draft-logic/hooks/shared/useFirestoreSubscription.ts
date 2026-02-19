/**
 * useFirestoreSubscription - Real-time Firestore subscription hook
 *
 * Manages Firestore real-time subscriptions with automatic cleanup and
 * error handling. Prevents memory leaks and ensures proper unsubscribe
 * on unmount or when references change.
 *
 * @example
 * ```tsx
 * const { data: room, loading, error } = useFirestoreSubscription({
 *   reference: doc(db, 'draftRooms', roomId),
 *   onError: (err) => {
 *     console.error('Failed to load room:', err);
 *   },
 * });
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * return <DraftRoom room={data} />;
 * ```
 */

import {
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  onSnapshot,
  query,
  Query,
  doc,
  collection,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { useState, useEffect, useRef, useCallback } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[FirestoreSubscription]');

// ============================================================================
// TYPES
// ============================================================================

export interface UseFirestoreSubscriptionOptions {
  /** Document or collection reference */
  reference: DocumentReference | CollectionReference;
  /** Query constraints (for collections) */
  constraints?: QueryConstraint[];
  /** Callback on data update */
  onUpdate?: (data: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Whether to skip subscription (useful for conditional fetching) */
  skip?: boolean;
}

export interface UseFirestoreSubscriptionResult<T = unknown> {
  /** Loaded data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Whether subscription is active */
  isSubscribed: boolean;
  /** Manually retry subscription */
  retry: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing Firestore real-time subscriptions with automatic cleanup
 */
export function useFirestoreSubscription<T = unknown>({
  reference,
  constraints = [],
  onUpdate,
  onError,
  debug = false,
  skip = false,
}: UseFirestoreSubscriptionOptions): UseFirestoreSubscriptionResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Refs for tracking state and preventing memory leaks
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);

  // Store callbacks in refs to avoid stale closures
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Update callback refs
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  // Setup subscription
  const setupSubscription = useCallback(() => {
    if (skip || !isMountedRef.current) {
      return;
    }

    if (debug) {
      logger.debug('Setting up Firestore subscription', {
        skip,
        hasConstraints: constraints.length > 0,
      });
    }

    try {
      setLoading(true);
      setError(null);

      // Build query based on reference type
      const isDocReference = '_type' in reference && reference._type === 'document';

      // Setup real-time listener
      if (isDocReference) {
        // Handle DocumentReference
        unsubscribeRef.current = onSnapshot(
          reference as DocumentReference,
          (snapshot: DocumentSnapshot) => {
            if (!isMountedRef.current) {
              return;
            }

            try {
              // Document snapshot
              if (!snapshot.exists()) {
                logger.warn('Document does not exist');
                setData(null);
                setLoading(false);
                setError('Document not found');
                return;
              }

              const loadedData = {
                id: snapshot.id,
                ...snapshot.data(),
              } as unknown as T;

              if (debug) {
                logger.debug('Firestore data received', {
                  hasData: loadedData !== null,
                });
              }

              // Update state
              setData(loadedData);
              setLoading(false);
              setError(null);
              setIsSubscribed(true);
              retryCountRef.current = 0;

              // Call update callback
              onUpdateRef.current?.(loadedData);
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              logger.error('Error processing Firestore data', error);

              if (isMountedRef.current) {
                setError(error.message);
                setLoading(false);
              }

              onErrorRef.current?.(error);
            }
          },
          (err: Error) => {
            if (!isMountedRef.current) {
              return;
            }

            const error = err instanceof Error ? err : new Error(String(err));
            logger.error('Firestore subscription error', error);

            setError(error.message);
            setLoading(false);
            setIsSubscribed(false);

            // Auto-retry with exponential backoff
            if (retryCountRef.current < maxRetriesRef.current) {
              const delayMs = Math.pow(2, retryCountRef.current) * 1000;
              retryCountRef.current++;

              if (debug) {
                logger.debug('Retrying subscription', {
                  attempt: retryCountRef.current,
                  delayMs,
                });
              }

              const timeoutId = setTimeout(() => {
                if (isMountedRef.current) {
                  setupSubscription();
                }
              }, delayMs);

              return () => clearTimeout(timeoutId);
            }

            onErrorRef.current?.(error);
            return;
          }
        );
      } else {
        // Handle CollectionReference with Query
        const queryRef: Query = constraints.length > 0
          ? query(reference as CollectionReference, ...constraints)
          : (reference as CollectionReference);

        unsubscribeRef.current = onSnapshot(
          queryRef,
          (snapshot: QuerySnapshot) => {
            if (!isMountedRef.current) {
              return;
            }

            try {
              // Collection snapshot
              const loadedData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as unknown as T;

              if (debug) {
                logger.debug('Firestore data received', {
                  hasData: loadedData !== null,
                });
              }

              // Update state
              setData(loadedData);
              setLoading(false);
              setError(null);
              setIsSubscribed(true);
              retryCountRef.current = 0;

              // Call update callback
              onUpdateRef.current?.(loadedData);
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              logger.error('Error processing Firestore data', error);

              if (isMountedRef.current) {
                setError(error.message);
                setLoading(false);
              }

              onErrorRef.current?.(error);
            }
          },
          (err: Error) => {
            if (!isMountedRef.current) {
              return;
            }

            const error = err instanceof Error ? err : new Error(String(err));
            logger.error('Firestore subscription error', error);

            setError(error.message);
            setLoading(false);
            setIsSubscribed(false);

            // Auto-retry with exponential backoff
            if (retryCountRef.current < maxRetriesRef.current) {
              const delayMs = Math.pow(2, retryCountRef.current) * 1000;
              retryCountRef.current++;

              if (debug) {
                logger.debug('Retrying subscription', {
                  attempt: retryCountRef.current,
                  delayMs,
                });
              }

              const timeoutId = setTimeout(() => {
                if (isMountedRef.current) {
                  setupSubscription();
                }
              }, delayMs);

              return () => clearTimeout(timeoutId);
            }

            onErrorRef.current?.(error);
            return;
          }
        );
      }

      setIsSubscribed(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error setting up Firestore subscription', error);

      if (isMountedRef.current) {
        setError(error.message);
        setLoading(false);
      }

      onErrorRef.current?.(error);
    }
  }, [reference, constraints, skip, debug]);

  // Setup subscription on mount and when reference changes
  useEffect(() => {
    setupSubscription();

    return () => {
      // Cleanup on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [setupSubscription]);

  // Mark as unmounted on cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Manually retry subscription
  const retry = useCallback(() => {
    if (debug) {
      logger.debug('Manually retrying subscription');
    }

    retryCountRef.current = 0;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setupSubscription();
  }, [setupSubscription, debug]);

  return {
    data,
    loading,
    error,
    isSubscribed,
    retry,
  } as UseFirestoreSubscriptionResult<T>;
}

export default useFirestoreSubscription;
