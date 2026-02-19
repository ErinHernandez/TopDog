/**
 * Username Change Policy
 * 
 * Enforces cooldown periods for username changes to prevent abuse.
 * 
 * @example
 * ```ts
 * const policy = new UsernameChangePolicy();
 * const canChange = await policy.canChangeUsername(uid);
 * if (!canChange.allowed) {
 *   console.log(`Cooldown active. Try again in ${canChange.retryAfterDays} days`);
 * }
 * ```
 */

import {
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';

import { createScopedLogger } from './clientLogger';
import { db } from './firebase';

const logger = createScopedLogger('[UsernameChangePolicy]');

// ============================================================================
// CONSTANTS
// ============================================================================

const COOLDOWN_PERIODS = {
  DEFAULT: 90, // days
  WHALE: 30,   // days (for users with 150+ tournament entries)
  FIRST_CHANGE: 90, // days (first change is free but has cooldown)
} as const;

const WHALE_THRESHOLD = 150; // tournament entries

// ============================================================================
// TYPES
// ============================================================================

export interface CanChangeUsernameResult {
  allowed: boolean;
  retryAfterDays?: number;
  retryAfterDate?: Date;
  reason?: string;
}

export interface CooldownInfo {
  cooldownDays: number;
  daysRemaining?: number;
  retryAfterDate?: Date;
  isWhale: boolean;
}

interface UserDocument {
  lastUsernameChange?: Timestamp | Date;
  usernameChangeCount?: number;
  tournamentsEntered?: number;
}

// ============================================================================
// POLICY CLASS
// ============================================================================

export class UsernameChangePolicy {
  /**
   * Check if a user can change their username
   */
  async canChangeUsername(uid: string): Promise<CanChangeUsernameResult> {
    try {
      if (!db) {
        return { allowed: false, reason: 'Database not available' };
      }

      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { allowed: false, reason: 'User not found' };
      }
      
      const userData = userDoc.data() as UserDocument;
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
      const lastChangeDate = lastChange instanceof Timestamp
        ? lastChange.toDate()
        : lastChange instanceof Date
        ? lastChange
        : new Date(lastChange);
      const now = new Date();
      const daysSinceChange = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
      
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
      logger.error('Error checking username change policy', error instanceof Error ? error : new Error(String(error)));
      // Fail closed for security
      return { allowed: false, reason: 'Error checking change policy' };
    }
  }

  /**
   * Get cooldown information for a user
   */
  async getCooldownInfo(uid: string): Promise<CooldownInfo> {
    try {
      if (!db) {
        return { cooldownDays: COOLDOWN_PERIODS.DEFAULT, isWhale: false };
      }

      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { cooldownDays: COOLDOWN_PERIODS.DEFAULT, isWhale: false };
      }
      
      const userData = userDoc.data() as UserDocument;
      const tournamentEntries = userData.tournamentsEntered || 0;
      const isWhale = tournamentEntries >= WHALE_THRESHOLD;
      const cooldownDays = isWhale ? COOLDOWN_PERIODS.WHALE : COOLDOWN_PERIODS.DEFAULT;
      
      const lastChange = userData.lastUsernameChange;
      if (!lastChange) {
        return { cooldownDays, isWhale, daysRemaining: 0 };
      }
      
      const lastChangeDate = lastChange instanceof Timestamp
        ? lastChange.toDate()
        : lastChange instanceof Date
        ? lastChange
        : new Date(lastChange);
      const now = new Date();
      const daysSinceChange = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, cooldownDays - daysSinceChange);
      const retryAfterDate = new Date(lastChangeDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
      
      return {
        cooldownDays,
        daysRemaining,
        retryAfterDate,
        isWhale,
      };
    } catch (error) {
      logger.error('Error getting cooldown info', error instanceof Error ? error : new Error(String(error)));
      return { cooldownDays: COOLDOWN_PERIODS.DEFAULT, isWhale: false };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const usernameChangePolicy = new UsernameChangePolicy();

export default UsernameChangePolicy;
