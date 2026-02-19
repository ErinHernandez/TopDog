import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { db } from '../lib/firebase';
import { useUser } from '../lib/userContext';

const logger = createScopedLogger('[UserPreferences]');

/**
 * Custom hook for managing user preferences including border color customization
 */
export function useUserPreferences() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    publicProfile: true,
    borderColor: '#4285F4' // Default navbar blue
  });
  const [loading, setLoading] = useState(true);

  // Load user preferences from Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.preferences) {
            setPreferences(prevPrefs => ({
              ...prevPrefs,
              ...userData.preferences,
              // Ensure borderColor has a default value
              borderColor: userData.preferences.borderColor || '#4285F4'
            }));
          }
        }
      } catch (error) {
        logger.error('Error loading user preferences', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Update a specific preference
  const updatePreference = async (key, value) => {
    if (!user?.uid) return;

    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        [`preferences.${key}`]: value,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      logger.error('Error updating preference', error, { key });
      // Revert local state on error
      setPreferences(preferences);
      return { success: false, error: error.message };
    }
  };

  // Update border color specifically
  const updateBorderColor = async (color) => {
    return await updatePreference('borderColor', color);
  };

  // Get current border color
  const getBorderColor = () => {
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
