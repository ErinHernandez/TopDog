import { useState, useEffect, useMemo, useCallback } from 'react';
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

export function useCustomization(): UseCustomizationReturn {
  const { user } = useAuth();

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

  // Location consent
  const [locationConsent, setLocationConsent] = useState(false);

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
      setFlagsLoading(false);
      return;
    }

    const unsubscribe = subscribeToLocations(user.uid, (locations) => {
      if (locations) {
        setLocationConsent(locations.consentGiven);
        const flags: FlagOption[] = [
          ...locations.countries.map((c) => ({
            code: c.code,
            name: c.name,
            type: 'country' as const,
          })),
          ...locations.states.map((s) => ({
            code: `US-${s.code}`,
            name: s.name,
            type: 'state' as const,
          })),
        ];
        setAvailableFlags(flags);
      }
      setFlagsLoading(false);
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

  // Enable location tracking
  const enableLocationTracking = useCallback(async () => {
    if (!user?.uid) return;

    await grantLocationConsent(user.uid);
    setLocationConsent(true);

    // Detect and record current location
    const location = await detectLocation();
    if (location.country) {
      await recordLocationVisit(user.uid, location);
    }
  }, [user?.uid]);

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
