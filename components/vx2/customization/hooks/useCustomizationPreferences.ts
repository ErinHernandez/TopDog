import { useState, useEffect } from 'react';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { CustomizationPreferences, DEFAULT_PREFERENCES } from '@/lib/customization/types';
import { subscribeToPreferences } from '@/lib/customization/storage';

/**
 * Hook to access user customization preferences in draft rooms
 * Lightweight subscription hook for read-only access
 */
export function useCustomizationPreferences(): {
  preferences: CustomizationPreferences | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<CustomizationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToPreferences(
      user.uid,
      (prefs) => {
        setPreferences(prefs);
        setIsLoading(false);
      },
      () => {
        // On error, use defaults
        setPreferences(DEFAULT_PREFERENCES);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  return { preferences, isLoading };
}
