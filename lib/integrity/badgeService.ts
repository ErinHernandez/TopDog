/**
 * Badge Service
 * 
 * Read and manage user badges derived from pick locations
 * 
 * NOTE: County badges and division badges are disabled indefinitely. The delete functions
 * remain for future use, but these badges are not currently being created.
 */

import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserBadges, BadgeRecord } from './types';

/**
 * Get user badges
 */
export async function getUserBadges(userId: string): Promise<UserBadges> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) {
    return {
      userId,
      countries: [],
      states: [],
      counties: [],
      divisions: [],
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };
  }

  const data = badgeSnap.data();
  return {
    userId: data.userId || userId,
    countries: data.countries || [],
    states: data.states || [],
    counties: data.counties || [],
    divisions: data.divisions || [],
    updatedAt: data.updatedAt || Timestamp.now(),
    createdAt: data.createdAt || Timestamp.now(),
  };
}

/**
 * Delete a county badge
 * 
 * NOTE: County badges are currently disabled, so this function will not be called
 * in normal operation. It remains for future use when county badges are re-enabled.
 */
export async function deleteCountyBadge(userId: string, countyCode: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) return;

  const data = badgeSnap.data();
  const counties = (data.counties || []).filter((c: BadgeRecord) => c.code !== countyCode);

  await updateDoc(badgeRef, {
    counties,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a state badge
 */
export async function deleteStateBadge(userId: string, stateCode: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) return;

  const data = badgeSnap.data();
  const states = (data.states || []).filter((s: BadgeRecord) => s.code !== stateCode);

  await updateDoc(badgeRef, {
    states,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a country badge
 */
export async function deleteCountryBadge(userId: string, countryCode: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) return;

  const data = badgeSnap.data();
  const countries = (data.countries || []).filter((c: BadgeRecord) => c.code !== countryCode);

  await updateDoc(badgeRef, {
    countries,
    updatedAt: serverTimestamp(),
  });
}
