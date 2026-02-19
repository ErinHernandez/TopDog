/**
 * VX2 Profile Service
 *
 * Handles profile CRUD operations, avatar updates, and profile metadata
 */

import type { Firestore } from 'firebase/firestore';
import { doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { createScopedLogger } from '@/lib/clientLogger';
import { validateUsername, checkUsernameAvailability } from '@/lib/usernameValidation';

import { AUTH_ERROR_CODES } from '../../constants';
import type { ProfileUpdateData, UsernameChangeData, AuthResult, UserProfile, AuthUser } from '../../types';

import { withTimeout, safeToDate, createAuthError } from './helpers';

const logger = createScopedLogger('[ProfileService]');

export interface ProfileServiceConfig {
  db: Firestore;
}

/**
 * Update user profile
 */
export async function updateProfile(
  config: ProfileServiceConfig,
  user: AuthUser | null,
  currentProfile: UserProfile | null,
  data: ProfileUpdateData
): Promise<AuthResult> {
  if (!user) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  const { db } = config;

  try {
    const updates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.countryCode !== undefined) updates.countryCode = data.countryCode;
    if (data.preferences) {
      updates['preferences'] = { ...currentProfile?.preferences, ...data.preferences };
    }

    await updateDoc(doc(db, 'users', user.uid), updates);

    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Change username
 */
export async function changeUsername(
  config: ProfileServiceConfig,
  user: AuthUser | null,
  currentProfile: UserProfile | null,
  data: UsernameChangeData
): Promise<AuthResult> {
  if (!user) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  const { db } = config;

  try {
    // Validate new username
    const validation = validateUsername(data.newUsername, currentProfile?.countryCode || 'US');
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.USERNAME_INVALID,
          message: validation.errors.join(', '),
          field: 'username',
        },
      };
    }

    // Check availability
    const availability = await checkUsernameAvailability(data.newUsername);
    if (!availability.isAvailable) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.USERNAME_TAKEN,
          message: availability.message,
          field: 'username',
        },
      };
    }

    // Update username
    await updateDoc(doc(db, 'users', user.uid), {
      username: data.newUsername.toLowerCase(),
      updatedAt: serverTimestamp(),
    });

    // Record username change in audit log
    await setDoc(doc(db, 'username_change_audit', `${user.uid}_${Date.now()}`), {
      userId: user.uid,
      previousUsername: currentProfile?.username,
      newUsername: data.newUsername.toLowerCase(),
      reason: data.reason || 'User requested',
      changedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Refresh profile from Firestore
 */
export async function refreshProfile(
  config: ProfileServiceConfig,
  user: AuthUser | null
): Promise<UserProfile | null> {
  if (!user) return null;

  const { db } = config;

  try {
    const profileDoc = await withTimeout(
      getDoc(doc(db, 'users', user.uid)),
      10000, // 10 second timeout
      'Profile refresh timed out'
    ).catch((error) => {
      logger.warn(`Profile refresh failed or timed out: ${error.message}`);
      return null; // Return null to continue without updating
    });

    if (profileDoc && profileDoc.exists()) {
      try {
        const profileData = profileDoc.data();
        const now = new Date();
        const profile: UserProfile = {
          uid: user.uid,
          username: profileData.username || '',
          email: profileData.email || null,
          countryCode: profileData.countryCode || 'US',
          displayName: profileData.displayName || '',
          createdAt: safeToDate(profileData.createdAt, now),
          updatedAt: safeToDate(profileData.updatedAt, now),
          isActive: profileData.isActive ?? true,
          profileComplete: profileData.profileComplete ?? false,
          tournamentsEntered: profileData.tournamentsEntered || 0,
          tournamentsWon: profileData.tournamentsWon || 0,
          totalWinnings: profileData.totalWinnings || 0,
          bestFinish: profileData.bestFinish || null,
          lastLogin: safeToDate(profileData.lastLogin, now),
          preferences: {
            notifications: profileData.preferences?.notifications ?? true,
            emailUpdates: profileData.preferences?.emailUpdates ?? true,
            publicProfile: profileData.preferences?.publicProfile ?? true,
            borderColor: profileData.preferences?.borderColor || '#4285F4',
          },
        };
        return profile;
      } catch (parseError) {
        logger.error(
          'Error parsing profile data during refresh',
          parseError instanceof Error ? parseError : new Error(String(parseError))
        );
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error('Error refreshing profile', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Delete user account and profile
 */
export async function deleteAccountData(config: ProfileServiceConfig, user: AuthUser | null): Promise<AuthResult> {
  if (!user) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  const { db } = config;

  try {
    // Delete Firestore profile
    await deleteDoc(doc(db, 'users', user.uid));
    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
