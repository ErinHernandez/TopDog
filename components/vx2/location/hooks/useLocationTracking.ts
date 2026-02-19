/**
 * useLocationTracking Hook
 * 
 * Manages location tracking with automatic detection and security checks.
 */

import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { createScopedLogger } from '@/lib/clientLogger';
import { db } from '@/lib/firebase';
import { getCurrentLocation } from '@/lib/location/geolocationProvider';
import {
  trackLocation,
  getUserLocations,
  getUnlockedFlags,
  markLocationTrusted,
  untrustLocation,
} from '@/lib/location/locationService';
import {
  checkLoginSecurity,
  logSuspiciousAttempt,
} from '@/lib/location/securityService';
import type { 
  GeoLocation, 
  UserLocations, 
  SecurityCheck,
  KnownLocation,
} from '@/lib/location/types';

import { useLocationConsent } from './useLocationConsent';

const logger = createScopedLogger('[useLocationTracking]');

interface UseLocationTrackingReturn {
  /** Current detected location */
  currentLocation: GeoLocation | null;
  /** User's location history */
  userLocations: UserLocations;
  /** Unlocked flag codes for customization */
  unlockedFlags: string[];
  /** Known locations for security */
  knownLocations: KnownLocation[];
  /** Loading state */
  isLoading: boolean;
  /** Whether tracking is enabled (consent granted) */
  isTrackingEnabled: boolean;
  /** Manually trigger location detection and tracking */
  detectAndTrack: () => Promise<GeoLocation | null>;
  /** Mark a location as trusted */
  trustLocation: (code: string) => Promise<void>;
  /** Remove trusted status from location */
  removeTrust: (code: string) => Promise<void>;
  /** Check security for current location */
  checkSecurity: () => Promise<SecurityCheck | null>;
  /** Error state */
  error: Error | null;
}

export function useLocationTracking(): UseLocationTrackingReturn {
  const { user } = useAuth();
  const { isGranted } = useLocationConsent();
  const userId = user?.uid;

  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocations>({ countries: [], states: [] });
  const [unlockedFlags, setUnlockedFlags] = useState<string[]>([]);
  const [knownLocations, setKnownLocations] = useState<KnownLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Subscribe to location document changes
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from browser APIs on mount
      setIsLoading(false);
      return;
    }

    if (!db) {
      setError(new Error('Firebase Firestore is not initialized'));
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'userLocations', userId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          
          // Update locations
          const locs = data?.locations || { countries: [], states: [] };
          setUserLocations(locs);
          
          // Update unlocked flags
          const flags: string[] = [
            ...locs.countries,
            ...locs.states.map((s: string) => `US-${s}`),
          ];
          setUnlockedFlags(flags);
          
          // Update known locations
          setKnownLocations(data?.security?.knownLocations || []);
        }
        setIsLoading(false);
      },
      (err) => {
        logger.error('Location tracking subscription error:', err instanceof Error ? err : new Error(String(err)));
        setError(err);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [userId]);
  
  // Auto-track on mount when consent is granted
  useEffect(() => {
    if (!userId || !isGranted) return;

    const doTrack = async () => {
      try {
        const location = await trackLocation(userId);
        if (location) {
          setCurrentLocation(location);
        }
      } catch (err) {
        logger.error('Auto-track failed:', err instanceof Error ? err : new Error(String(err)));
      }
    };

    doTrack();
  }, [userId, isGranted]);
  
  const detectAndTrack = useCallback(async (): Promise<GeoLocation | null> => {
    if (!userId) return null;

    try {
      setError(null);

      // First detect location
      const location = await getCurrentLocation();
      if (!location) {
        return null;
      }

      setCurrentLocation(location);

      // If consent granted, track it
      if (isGranted) {
        await trackLocation(userId);
      }

      return location;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [userId, isGranted]);
  
  const trustLocation = useCallback(async (code: string) => {
    if (!userId) return;

    try {
      await markLocationTrusted(userId, code);
    } catch (err) {
      setError(err as Error);
    }
  }, [userId]);
  
  const removeTrust = useCallback(async (code: string) => {
    if (!userId) return;

    try {
      await untrustLocation(userId, code);
    } catch (err) {
      setError(err as Error);
    }
  }, [userId]);
  
  const checkSecurity = useCallback(async (): Promise<SecurityCheck | null> => {
    if (!userId) return null;

    try {
      // Get current location first
      const location = currentLocation || await getCurrentLocation();
      if (!location) return null;

      const securityCheck = await checkLoginSecurity(userId, location);

      // Log if suspicious
      if (securityCheck.action !== 'allow') {
        await logSuspiciousAttempt(
          userId,
          location.countryCode,
          securityCheck.action === 'block' ? 'blocked' :
            securityCheck.action === 'verify' ? 'warned' : 'allowed',
          `Risk score: ${securityCheck.riskScore}, ` +
          `New: ${securityCheck.isNewLocation}`
        );
      }

      return securityCheck;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [userId, currentLocation]);
  
  return {
    currentLocation,
    userLocations,
    unlockedFlags,
    knownLocations,
    isLoading,
    isTrackingEnabled: isGranted,
    detectAndTrack,
    trustLocation,
    removeTrust,
    checkSecurity,
    error,
  };
}

export default useLocationTracking;
