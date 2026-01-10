/**
 * useLocationConsent Hook
 * 
 * Manages location consent state with real-time Firebase updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { 
  getConsent,
  updateConsent as updateConsentFn,
  incrementPromptCount,
  shouldShowPrompt as checkShouldPrompt,
  revokeConsent as revokeConsentFn,
} from '@/lib/location/consentManager';
import type { LocationConsent, ConsentStatus } from '@/lib/location/types';

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
  const [consent, setConsent] = useState<LocationConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Real-time listener for consent changes
  useEffect(() => {
    if (!user?.uid) {
      setConsent(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const docRef = doc(db, 'userLocations', user.uid);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
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
      (err) => {
        console.error('Consent subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  const grantConsent = useCallback(async (dontAskAgain = false) => {
    if (!user?.uid) return;
    
    try {
      await updateConsentFn(user.uid, 'granted', dontAskAgain);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user?.uid]);
  
  const revokeConsent = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await revokeConsentFn(user.uid);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user?.uid]);
  
  const dismissPrompt = useCallback(async (dontAskAgain = false) => {
    if (!user?.uid) return;
    
    try {
      if (dontAskAgain) {
        await updateConsentFn(user.uid, 'denied', true);
      } else {
        await incrementPromptCount(user.uid);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user?.uid]);
  
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
