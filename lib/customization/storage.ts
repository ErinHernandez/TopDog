import { doc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CustomizationPreferences, DEFAULT_PREFERENCES, UserLocations } from './types';

export function subscribeToPreferences(
  userId: string,
  callback: (prefs: CustomizationPreferences) => void,
  onError?: (error: Error) => void
): () => void {
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
  const updates: Record<string, any> = {};

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
    await updateDoc(doc(db, 'users', userId), updates);
  }
}

function extractCustomizationPrefs(raw: any): CustomizationPreferences {
  if (!raw) return DEFAULT_PREFERENCES;

  return {
    borderColor: raw.borderColor ?? DEFAULT_PREFERENCES.borderColor,
    backgroundType: raw.backgroundType ?? DEFAULT_PREFERENCES.backgroundType,
    backgroundFlagCode: raw.backgroundFlagCode,
    backgroundSolidColor: raw.backgroundSolidColor,
    overlayEnabled: raw.overlayEnabled ?? DEFAULT_PREFERENCES.overlayEnabled,
    overlayImageId: raw.overlayImageId ?? DEFAULT_PREFERENCES.overlayImageId,
    overlayPattern: raw.overlayPattern ?? DEFAULT_PREFERENCES.overlayPattern,
    overlaySize: raw.overlaySize ?? DEFAULT_PREFERENCES.overlaySize,
    overlayPositionX: raw.overlayPositionX,
    overlayPositionY: raw.overlayPositionY,
  };
}
