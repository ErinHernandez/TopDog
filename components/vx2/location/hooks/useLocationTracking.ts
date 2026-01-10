/**
 * useLocationTracking Hook
 * 
 * Manages location tracking with automatic detection and security checks.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { useLocationConsent } from './useLocationConsent';
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
import { getCurrentLocation } from '@/lib/location/geolocationProvider';
import type { 
  GeoLocation, 
  UserLocations, 
  SecurityCheck,
  KnownLocation,
} from '@/lib/location/types';

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
  
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocations>({ countries: [], states: [] });
  const [unlockedFlags, setUnlockedFlags] = useState<string[]>([]);
  const [knownLocations, setKnownLocations] = useState<KnownLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Subscribe to location document changes
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    
    const docRef = doc(db, 'userLocations', user.uid);
    
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
        console.error('Location tracking subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  // Auto-track on mount when consent is granted
  useEffect(() => {
    if (!user?.uid || !isGranted) return;
    
    const doTrack = async () => {
      try {
        const location = await trackLocation(user.uid);
        if (location) {
          setCurrentLocation(location);
        }
      } catch (err) {
        console.error('Auto-track failed:', err);
      }
    };
    
    doTrack();
  }, [user?.uid, isGranted]);
  
  const detectAndTrack = useCallback(async (): Promise<GeoLocation | null> => {
    if (!user?.uid) return null;
    
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
        await trackLocation(user.uid);
      }
      
      return location;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [user?.uid, isGranted]);
  
  const trustLocation = useCallback(async (code: string) => {
    if (!user?.uid) return;
    
    try {
      await markLocationTrusted(user.uid, code);
    } catch (err) {
      setError(err as Error);
    }
  }, [user?.uid]);
  
  const removeTrust = useCallback(async (code: string) => {
    if (!user?.uid) return;
    
    try {
      await untrustLocation(user.uid, code);
    } catch (err) {
      setError(err as Error);
    }
  }, [user?.uid]);
  
  const checkSecurity = useCallback(async (): Promise<SecurityCheck | null> => {
    if (!user?.uid) return null;
    
    try {
      // Get current location first
      const location = currentLocation || await getCurrentLocation();
      if (!location) return null;
      
      const securityCheck = await checkLoginSecurity(user.uid, location);
      
      // Log if suspicious
      if (securityCheck.action !== 'allow') {
        await logSuspiciousAttempt(
          user.uid,
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
  }, [user?.uid, currentLocation]);
  
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
