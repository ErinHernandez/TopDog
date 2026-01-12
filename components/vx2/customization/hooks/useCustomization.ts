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
  { code: 'IE', name: 'Ireland', type: 'country' },
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

    const unsubscribe = subscribeToPreferences(
      user.uid,
      (prefs) => {
        setPreferences(prefs);
        setDraft(prefs);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to locations
  useEffect(() => {
    if (!user?.uid) {
      // In dev mode, show dev flags even without user
      if (process.env.NODE_ENV === 'development') {
        setAvailableFlags(DEV_FLAGS);
      }
      setFlagsLoading(false);
      return;
    }

    const unsubscribe = subscribeToLocations(user.uid, async (locations) => {
      if (locations && (locations.countries?.length > 0 || locations.states?.length > 0)) {
        setLocationConsent(locations.consentGiven ?? false);
        const flags: FlagOption[] = [
          ...(locations.countries || []).map((c) => ({
            code: c.code,
            name: c.name,
            type: 'country' as const,
          })),
          ...(locations.states || []).map((s) => ({
            code: `US-${s.code}`,
            name: s.name,
            type: 'state' as const,
          })),
        ];
        
        // In dev mode, merge dev flags with user flags (avoid duplicates)
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
      } else {
        // No locations exist - automatically detect and record location
        // This ensures users always have at least their country flag (and state if US)
        if (!hasAutoDetectedRef.current) {
          hasAutoDetectedRef.current = true;
          
          try {
            // Automatically grant consent (IP-based geolocation doesn't require explicit consent)
            await grantLocationConsent(user.uid);
            setLocationConsent(true);

            // Detect location using IP-based geolocation (no permission needed)
            // Wrap in try-catch to handle network errors gracefully
            try {
              const location = await detectLocation();
              if (location.country) {
                // Record the location visit - this will trigger the subscription again with new data
                await recordLocationVisit(user.uid, location);
                // Don't set flagsLoading to false yet - wait for subscription to fire with new data
              } else {
                // If detection fails, show dev flags in dev mode, otherwise empty
                setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
                setFlagsLoading(false);
              }
            } catch (detectErr) {
              // Location detection failed (network error, API down, etc.)
              console.warn('Location detection failed, user can still use customization:', detectErr);
              // Don't block the UI - allow user to proceed with dev flags in dev mode
              setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
              setFlagsLoading(false);
            }
          } catch (err) {
            // Grant consent or other error
            console.error('Auto-location setup failed:', err);
            setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
            setFlagsLoading(false);
          }
        } else {
          // Already attempted detection, show dev flags in dev mode, otherwise empty
          setAvailableFlags(process.env.NODE_ENV === 'development' ? DEV_FLAGS : []);
          setFlagsLoading(false);
        }
      }
    });

    return unsubscribe;
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
