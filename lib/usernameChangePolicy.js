/**
 * Username Change Policy
 * 
 * Enforces cooldown periods for username changes to prevent abuse.
 * 
 * @example
 * ```js
 * const policy = new UsernameChangePolicy();
 * const canChange = await policy.canChangeUsername(uid);
 * if (!canChange.allowed) {
 *   console.log(`Cooldown active. Try again in ${canChange.retryAfterDays} days`);
 * }
 * ```
 */

import { 
  getFirestore,
  doc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// CONSTANTS
// ============================================================================

const COOLDOWN_PERIODS = {
  DEFAULT: 90, // days
  WHALE: 30,   // days (for users with 150+ tournament entries)
  FIRST_CHANGE: 90, // days (first change is free but has cooldown)
};

const WHALE_THRESHOLD = 150; // tournament entries

// ============================================================================
// POLICY CLASS
// ============================================================================

export class UsernameChangePolicy {
  /**
   * Check if a user can change their username
   * @param {string} uid - User's Firebase UID
   * @returns {Promise<{ allowed: boolean, retryAfterDays?: number, retryAfterDate?: Date, reason?: string }>}
   */
  async canChangeUsername(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { allowed: false, reason: 'User not found' };
      }
      
      const userData = userDoc.data();
      const lastChange = userData.lastUsernameChange;
      const changeCount = userData.usernameChangeCount || 0;
      const tournamentEntries = userData.tournamentsEntered || 0;
      
      // Determine cooldown period
      const isWhale = tournamentEntries >= WHALE_THRESHOLD;
      const cooldownDays = isWhale ? COOLDOWN_PERIODS.WHALE : COOLDOWN_PERIODS.DEFAULT;
      
      // If never changed, allow (first change is free)
      if (!lastChange) {
        return { allowed: true };
      }
      
      // Check cooldown
      const lastChangeDate = lastChange?.toDate?.() || new Date(lastChange);
      const now = new Date();
      const daysSinceChange = Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceChange < cooldownDays) {
        const retryAfterDays = cooldownDays - daysSinceChange;
        const retryAfterDate = new Date(lastChangeDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
        
        return {
          allowed: false,
          retryAfterDays,
          retryAfterDate,
          reason: `Username can only be changed once every ${cooldownDays} days`,
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking username change policy:', error);
      // Fail closed for security
      return { allowed: false, reason: 'Error checking change policy' };
    }
  }

  /**
   * Get cooldown information for a user
   * @param {string} uid - User's Firebase UID
   * @returns {Promise<{ cooldownDays: number, daysRemaining?: number, retryAfterDate?: Date, isWhale: boolean }>}
   */
  async getCooldownInfo(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { cooldownDays: COOLDOWN_PERIODS.DEFAULT, isWhale: false };
      }
      
      const userData = userDoc.data();
      const tournamentEntries = userData.tournamentsEntered || 0;
      const isWhale = tournamentEntries >= WHALE_THRESHOLD;
      const cooldownDays = isWhale ? COOLDOWN_PERIODS.WHALE : COOLDOWN_PERIODS.DEFAULT;
      
      const lastChange = userData.lastUsernameChange;
      if (!lastChange) {
        return { cooldownDays, isWhale, daysRemaining: 0 };
      }
      
      const lastChangeDate = lastChange?.toDate?.() || new Date(lastChange);
      const now = new Date();
      const daysSinceChange = Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, cooldownDays - daysSinceChange);
      const retryAfterDate = new Date(lastChangeDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
      
      return {
        cooldownDays,
        daysRemaining,
        retryAfterDate,
        isWhale,
      };
    } catch (error) {
      console.error('Error getting cooldown info:', error);
      return { cooldownDays: COOLDOWN_PERIODS.DEFAULT, isWhale: false };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const usernameChangePolicy = new UsernameChangePolicy();

export default UsernameChangePolicy;

