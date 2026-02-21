/**
 * useLocationConsent Hook
 *
 * Manages location consent state with real-time Firebase updates.
 */

import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { createScopedLogger } from '@/lib/clientLogger';
import { db } from '@/lib/firebase';
import {
  getConsent,
  updateConsent as updateConsentFn,
  incrementPromptCount,
  shouldShowPrompt as checkShouldPrompt,
  revokeConsent as revokeConsentFn,
} from '@/lib/location/consentManager';
import type { LocationConsent, ConsentStatus } from '@/lib/location/types';

const logger = createScopedLogger('[useLocationConsent]');

interface UseLocationConsentReturn {
  /** Current consent state */
  consent: LocationConsent | null;
  /** Loading state */
  isLoading: boolean;
  /** Whether consent has been granted */
  isGranted: boolean;
  /** Whether we should show the consent prompt */
  shouldPrompt: boolean;
  /** Grant location consent */
  grantConsent: (dontAskAgain?: boolean) => Promise<void>;
  /** Revoke location consent */
  revokeConsent: () => Promise<void>;
  /** Dismiss prompt without granting (increments prompt count) */
  dismissPrompt: (dontAskAgain?: boolean) => Promise<void>;
  /** Error state */
  error: Error | null;
}

export function useLocationConsent(): UseLocationConsentReturn {
  const { user } = useAuth();
  const userId = user?.uid;
  const [consent, setConsent] = useState<LocationConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time listener for consent changes
  useEffect(() => {
    if (!userId) {
      setConsent(null);
      setIsLoading(false);
      return;
    }

    if (!db) {
      setError(new Error('Firebase Firestore is not initialized'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const docRef = doc(db, 'userLocations', userId);

    const unsubscribe = onSnapshot(
      docRef,
      snap => {
        if (snap.exists()) {
          const data = snap.data();
          const consentData = data?.consent;

          if (consentData) {
            setConsent({
              status: consentData.status || 'pending',
              grantedAt: consentData.grantedAt?.toDate?.() ?? consentData.grantedAt,
              revokedAt: consentData.revokedAt?.toDate?.() ?? consentData.revokedAt,
              promptCount: consentData.promptCount || 0,
              lastPromptAt: consentData.lastPromptAt?.toDate?.() ?? consentData.lastPromptAt,
              dontAskAgain: consentData.dontAskAgain || false,
            });
          } else {
            setConsent({
              status: 'pending',
              promptCount: 0,
              dontAskAgain: false,
            });
          }
        } else {
          setConsent({
            status: 'pending',
            promptCount: 0,
            dontAskAgain: false,
          });
        }
        setIsLoading(false);
      },
      err => {
        logger.error(
          'Consent subscription error:',
          err instanceof Error ? err : new Error(String(err)),
        );
        setError(err);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const grantConsent = useCallback(
    async (dontAskAgain = false) => {
      if (!userId) return;

      try {
        await updateConsentFn(userId, 'granted', dontAskAgain);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [userId],
  );

  const revokeConsent = useCallback(async () => {
    if (!userId) return;

    try {
      await revokeConsentFn(userId);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [userId]);

  const dismissPrompt = useCallback(
    async (dontAskAgain = false) => {
      if (!userId) return;

      try {
        if (dontAskAgain) {
          await updateConsentFn(userId, 'denied', true);
        } else {
          await incrementPromptCount(userId);
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [userId],
  );

  return {
    consent,
    isLoading,
    isGranted: consent?.status === 'granted',
    shouldPrompt: consent ? checkShouldPrompt(consent) : false,
    grantConsent,
    revokeConsent,
    dismissPrompt,
    error,
  };
}

export default useLocationConsent;
