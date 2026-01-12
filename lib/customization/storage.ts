import { doc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CustomizationPreferences, DEFAULT_PREFERENCES, UserLocations, type OverlayPattern } from './types';

export function subscribeToPreferences(
  userId: string,
  callback: (prefs: CustomizationPreferences) => void,
  onError?: (error: Error) => void
): () => void {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      const data = docSnap.data();
      const prefs = extractCustomizationPrefs(data?.preferences);
      callback(prefs);
    },
    onError
  );
}

export function subscribeToLocations(
  userId: string,
  callback: (locations: UserLocations | null) => void,
  onError?: (error: Error) => void
): () => void {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  return onSnapshot(
    doc(db, 'userLocations', userId),
    (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as UserLocations) : null);
    },
    onError
  );
}

export async function saveCustomizationPreferences(
  userId: string,
  prefs: Partial<CustomizationPreferences>
): Promise<void> {
  const updates: Record<string, unknown> = {};

  // Only update fields that are provided
  if (prefs.borderColor !== undefined) {
    updates['preferences.borderColor'] = prefs.borderColor;
  }
  if (prefs.backgroundType !== undefined) {
    updates['preferences.backgroundType'] = prefs.backgroundType;
  }
  if (prefs.backgroundFlagCode !== undefined) {
    updates['preferences.backgroundFlagCode'] = prefs.backgroundFlagCode || deleteField();
  }
  if (prefs.backgroundSolidColor !== undefined) {
    updates['preferences.backgroundSolidColor'] = prefs.backgroundSolidColor || deleteField();
  }
  if (prefs.overlayEnabled !== undefined) {
    updates['preferences.overlayEnabled'] = prefs.overlayEnabled;
  }
  if (prefs.overlayImageId !== undefined) {
    updates['preferences.overlayImageId'] = prefs.overlayImageId;
  }
  if (prefs.overlayPattern !== undefined) {
    updates['preferences.overlayPattern'] = prefs.overlayPattern;
  }
  if (prefs.overlaySize !== undefined) {
    updates['preferences.overlaySize'] = prefs.overlaySize;
  }
  if (prefs.overlayPositionX !== undefined) {
    updates['preferences.overlayPositionX'] = prefs.overlayPositionX ?? deleteField();
  }
  if (prefs.overlayPositionY !== undefined) {
    updates['preferences.overlayPositionY'] = prefs.overlayPositionY ?? deleteField();
  }

  if (Object.keys(updates).length > 0) {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    await updateDoc(doc(db, 'users', userId), updates);
  }
}

function extractCustomizationPrefs(raw: unknown): CustomizationPreferences {
  if (!raw || typeof raw !== 'object' || raw === null) return DEFAULT_PREFERENCES;

  const prefs = raw as Record<string, unknown>;

  const backgroundType = typeof prefs.backgroundType === 'string' 
    ? (prefs.backgroundType === 'none' || prefs.backgroundType === 'flag' || prefs.backgroundType === 'solid' 
       ? prefs.backgroundType 
       : DEFAULT_PREFERENCES.backgroundType)
    : DEFAULT_PREFERENCES.backgroundType;

  const overlayPattern = typeof prefs.overlayPattern === 'string'
    ? (['single', 'single-flipped', 'scattered', 'tiled', 'placement'].includes(prefs.overlayPattern)
       ? prefs.overlayPattern as OverlayPattern
       : DEFAULT_PREFERENCES.overlayPattern)
    : DEFAULT_PREFERENCES.overlayPattern;

  const overlaySize = typeof prefs.overlaySize === 'number' 
    ? prefs.overlaySize 
    : (typeof prefs.overlaySize === 'string' 
       ? (isNaN(Number(prefs.overlaySize)) ? DEFAULT_PREFERENCES.overlaySize : Number(prefs.overlaySize))
       : DEFAULT_PREFERENCES.overlaySize);

  return {
    borderColor: (typeof prefs.borderColor === 'string' ? prefs.borderColor : undefined) ?? DEFAULT_PREFERENCES.borderColor,
    backgroundType,
    backgroundFlagCode: typeof prefs.backgroundFlagCode === 'string' ? prefs.backgroundFlagCode : undefined,
    backgroundSolidColor: typeof prefs.backgroundSolidColor === 'string' ? prefs.backgroundSolidColor : undefined,
    overlayEnabled: typeof prefs.overlayEnabled === 'boolean' ? prefs.overlayEnabled : DEFAULT_PREFERENCES.overlayEnabled,
    overlayImageId: (typeof prefs.overlayImageId === 'string' ? prefs.overlayImageId : undefined) ?? DEFAULT_PREFERENCES.overlayImageId,
    overlayPattern,
    overlaySize,
    overlayPositionX: typeof prefs.overlayPositionX === 'number' ? prefs.overlayPositionX : undefined,
    overlayPositionY: typeof prefs.overlayPositionY === 'number' ? prefs.overlayPositionY : undefined,
  };
}
