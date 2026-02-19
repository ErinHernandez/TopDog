import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { db } from '../lib/firebase';
import { useUser } from '../lib/userContext';

const logger = createScopedLogger('[UserPreferences]');

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  publicProfile: boolean;
  borderColor: string;
  [key: string]: unknown;
}

interface UpdateResult {
  success: boolean;
  error?: string;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  updatePreference: (key: string, value: unknown) => Promise<UpdateResult>;
  updateBorderColor: (color: string) => Promise<UpdateResult>;
  getBorderColor: () => string;
}

/**
 * Custom hook for managing user preferences including border color customization
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    emailUpdates: true,
    publicProfile: true,
    borderColor: '#4285F4' // Default navbar blue
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load user preferences from Firestore
  useEffect(() => {
    const loadPreferences = async (): Promise<void> => {
      if (!user?.uid || !db) {
        setLoading(false);
        return;
      }

      try {
        const uid = user.uid || '';
        const userDoc = await getDoc(doc(db!, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as Record<string, unknown>;
          if (userData.preferences) {
            const userPrefs = userData.preferences as Record<string, unknown>;
            setPreferences(prevPrefs => ({
              ...prevPrefs,
              ...userPrefs,
              // Ensure borderColor has a default value
              borderColor: (userPrefs.borderColor as string) || '#4285F4'
            }));
          }
        }
      } catch (error) {
        logger.error('Error loading user preferences', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Update a specific preference
  const updatePreference = async (key: string, value: unknown): Promise<UpdateResult> => {
    if (!user?.uid || !db) return { success: false };

    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // Update in Firestore
      const uid = user.uid || '';
      await updateDoc(doc(db!, 'users', uid), {
        [`preferences.${key}`]: value,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating preference', error instanceof Error ? error : new Error(String(error)), { key });
      // Revert local state on error
      setPreferences(preferences);
      return { success: false, error: errorMessage };
    }
  };

  // Update border color specifically
  const updateBorderColor = async (color: string): Promise<UpdateResult> => {
    return await updatePreference('borderColor', color);
  };

  // Get current border color
  const getBorderColor = (): string => {
    return preferences.borderColor || '#4285F4';
  };

  return {
    preferences,
    loading,
    updatePreference,
    updateBorderColor,
    getBorderColor
  };
}
