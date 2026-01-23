/**
 * useCustomization Hook
 * 
 * Manages customization preferences with Firebase persistence.
 * Integrates with location tracking for flag unlocking.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import {
  CustomizationPreferences,
  DEFAULT_PREFERENCES,
  FlagOption,
  UserLocations,
} from '@/lib/customization/types';
import {
  subscribeToPreferences,
  subscribeToLocations,
  saveCustomizationPreferences,
} from '@/lib/customization/storage';
import {
  detectLocation,
  recordLocationVisit,
  hasLocationConsent,
  grantLocationConsent,
} from '@/lib/customization/geolocation';
import { useLocationConsent } from '@/components/vx2/location/hooks/useLocationConsent';
import { trackLocation } from '@/lib/location/locationService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseCustomizationReturn {
  // Saved state
  preferences: CustomizationPreferences;
  isLoading: boolean;
  error: Error | null;

  // Draft state (form)
  draft: CustomizationPreferences;
  updateDraft: (updates: Partial<CustomizationPreferences>) => void;
  isDirty: boolean;

  // Actions
  save: () => Promise<void>;
  reset: () => void;
  isSaving: boolean;

  // Flags
  availableFlags: FlagOption[];
  flagsLoading: boolean;

  // Location consent
  locationConsent: boolean;
  enableLocationTracking: () => Promise<void>;
}

// Dev flags for development mode
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
  { code: 'IE', name: 'Ireland', type: 'country' },
  // Sample divisions for testing
  { code: 'CA-ON', name: 'Ontario', type: 'division' },
  { code: 'AU-NSW', name: 'New South Wales', type: 'division' },
  { code: 'GB-ENG', name: 'England', type: 'division' },
  { code: 'DE-BY', name: 'Bavaria', type: 'division' },
  { code: 'FR-IDF', name: 'Île-de-France', type: 'division' },
];

export function useCustomization(): UseCustomizationReturn {
  const { user } = useAuth();
  const { isGranted: locationConsentGranted, grantConsent } = useLocationConsent();

  // Saved preferences from Firebase
  const [preferences, setPreferences] = useState<CustomizationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Draft state for the form
  const [draft, setDraft] = useState<CustomizationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  // Available flags from location history
  const [availableFlags, setAvailableFlags] = useState<FlagOption[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);

  // Location consent (use the enhanced hook value)
  const [locationConsent, setLocationConsent] = useState(false);

  // Track if we've attempted auto-detection to prevent multiple attempts
  const hasAutoDetectedRef = useRef(false);

  // Sync location consent from the enhanced hook
  useEffect(() => {
    setLocationConsent(locationConsentGranted);
  }, [locationConsentGranted]);

  // Reset auto-detection ref when user changes
  useEffect(() => {
    hasAutoDetectedRef.current = false;
  }, [user?.uid]);

  // Subscribe to preferences
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    // Set a timeout to clear loading state if subscription doesn't fire within 5 seconds
    // This prevents infinite loading if Firebase is slow or unavailable
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribe = subscribeToPreferences(
      user.uid,
      (prefs) => {
        clearTimeout(timeoutId);
        setPreferences(prefs);
        setDraft(prefs);
        setIsLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user?.uid]);

  // Subscribe to locations and badges
  useEffect(() => {
    if (!user?.uid) {
      // In dev mode, show dev flags even without user
      if (process.env.NODE_ENV === 'development') {
        setAvailableFlags(DEV_FLAGS);
      }
      setFlagsLoading(false);
      return;
    }

    if (!db) {
      setFlagsLoading(false);
      return;
    }

    let locationsData: UserLocations | null = null;
    let badgeData: any = null;

    // Helper to combine and set flags
    const updateFlags = () => {
      const flags: FlagOption[] = [];
      
      // Add countries from locations or badges
      if (locationsData?.countries?.length) {
        flags.push(...locationsData.countries.map((c) => ({
          code: c.code,
          name: c.name,
          type: 'country' as const,
        })));
      } else if (badgeData?.countries?.length) {
        flags.push(...badgeData.countries.map((c: any) => ({
          code: c.code,
          name: c.name,
          type: 'country' as const,
        })));
      }
      
      // Add states from locations or badges
      if (locationsData?.states?.length) {
        flags.push(...locationsData.states.map((s) => ({
          code: `US-${s.code}`,
          name: s.name,
          type: 'state' as const,
        })));
      } else if (badgeData?.states?.length) {
        flags.push(...badgeData.states.map((s: any) => ({
          code: s.code,
          name: s.name,
          type: 'state' as const,
        })));
      }
      
      // Add counties from badges only
      if (badgeData?.counties?.length) {
        flags.push(...badgeData.counties.map((c: any) => ({
          code: c.code,
          name: c.name,
          type: 'county' as const,
        })));
      }
      
      // Add divisions from badges (international administrative divisions)
      if (badgeData?.divisions?.length) {
        flags.push(...badgeData.divisions.map((d: any) => ({
          code: d.code,
          name: d.name,
          type: 'division' as const,
        })));
      }

      if (flags.length > 0 || locationsData || badgeData) {
        setLocationConsent(true);
        const finalFlags = process.env.NODE_ENV === 'development'
          ? [
              ...DEV_FLAGS,
              ...flags.filter(
                (f) => !DEV_FLAGS.some((df) => df.code === f.code)
              ),
            ]
          : flags;
        setAvailableFlags(finalFlags);
        setFlagsLoading(false);
      } else if (!hasAutoDetectedRef.current) {
        // No locations exist - automatically detect and record location
        hasAutoDetectedRef.current = true;
        
        (async () => {
          try {
            await grantLocationConsent(user.uid);
            setLocationConsent(true);
            try {
              const location = await detectLocation();
              if (location.country) {
                await recordLocationVisit(user.uid, location);
              } else {
                setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
                setFlagsLoading(false);
              }
            } catch (detectErr) {
              console.warn('Location detection failed:', detectErr);
              setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
              setFlagsLoading(false);
            }
          } catch (err) {
            console.error('Auto-location setup failed:', err);
            setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
            setFlagsLoading(false);
          }
        })();
      } else {
        setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
        setFlagsLoading(false);
      }
    };

    // Subscribe to locations
    const unsubscribeLocations = subscribeToLocations(user.uid, (locations) => {
      locationsData = locations;
      updateFlags();
    });

    // Subscribe to badges
    const unsubscribeBadges = onSnapshot(
      doc(db, 'userBadges', user.uid),
      (badgeSnap) => {
        badgeData = badgeSnap.exists() ? badgeSnap.data() : null;
        updateFlags();
      },
      (err) => {
        console.error('Badge subscription error:', err);
        setFlagsLoading(false);
      }
    );

    return () => {
      unsubscribeLocations();
      unsubscribeBadges();
    };
  }, [user?.uid]);

  // Check if draft differs from saved
  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(preferences);
  }, [draft, preferences]);

  // Update draft
  const updateDraft = useCallback((updates: Partial<CustomizationPreferences>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save draft to Firebase
  const save = useCallback(async () => {
    if (!user?.uid || !isDirty) return;

    setIsSaving(true);
    try {
      await saveCustomizationPreferences(user.uid, draft);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, draft, isDirty]);

  // Reset draft to saved preferences
  const reset = useCallback(() => {
    setDraft(preferences);
  }, [preferences]);

  // Enable location tracking (uses enhanced system)
  const enableLocationTracking = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Grant consent via the enhanced system
      await grantConsent();
      setLocationConsent(true);

      // Also grant via legacy system for backward compatibility
      await grantLocationConsent(user.uid);

      // Detect and record current location
      const location = await detectLocation();
      if (location.country) {
        await recordLocationVisit(user.uid, location);
      }

      // Also track via the new system
      await trackLocation(user.uid);
    } catch (err) {
      console.error('Error enabling location tracking:', err);
      setError(err as Error);
    }
  }, [user?.uid, grantConsent]);

  return {
    preferences,
    isLoading,
    error,
    draft,
    updateDraft,
    isDirty,
    save,
    reset,
    isSaving,
    availableFlags,
    flagsLoading,
    locationConsent,
    enableLocationTracking,
  };
}

export default useCustomization;
