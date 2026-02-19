/**
 * VX2 Auth State Manager Service
 *
 * Handles Firebase auth state listener setup and profile loading
 */

import type { Auth } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

import { createScopedLogger } from '@/lib/clientLogger';

import type { AuthUser, UserProfile, AuthAction } from '../../types';

import { withTimeout, safeToDate, firebaseUserToAuthUser } from './helpers';

const logger = createScopedLogger('[AuthStateManager]');

export interface AuthStateManagerConfig {
  auth: Auth;
  db: Firestore;
  dispatch: (action: AuthAction) => void;
  onAuthStateChange?: (user: AuthUser | null) => void;
}

/**
 * Sets up auth state listener and profile loading
 * Returns unsubscribe function
 */
export function setupAuthStateListener(config: AuthStateManagerConfig): () => void {
  const { auth, db, dispatch, onAuthStateChange } = config;

  let ignore = false;

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // Check ignore flag before any state updates
    if (ignore) {
      logger.debug('[AuthStateManager] Ignoring stale auth state change');
      return;
    }

    if (firebaseUser) {
      const authUser = firebaseUserToAuthUser(firebaseUser);
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: authUser } });
      onAuthStateChange?.(authUser);

      // Load profile with timeout to prevent indefinite hanging
      try {
        const profileDoc = await withTimeout(
          getDoc(doc(db, 'users', firebaseUser.uid)),
          10000, // 10 second timeout
          'Profile load timed out'
        ).catch((error) => {
          logger.warn(`Profile load failed or timed out: ${error.message}`);
          return null; // Return null to continue with defaults
        });

        // Check ignore flag after async operation
        if (ignore) {
          logger.debug('[AuthStateManager] Ignoring stale profile load result');
          return;
        }

        if (profileDoc && profileDoc.exists()) {
          // Wrap profile extraction in try-catch to prevent loading state getting stuck
          // if profile data is corrupt or malformed
          try {
            const profileData = profileDoc.data();
            const now = new Date();
            const profile: UserProfile = {
              uid: firebaseUser.uid,
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
              isVIP: profileData.isVIP || false,
              vipTier: profileData.vipTier,
              reservedUsername: profileData.reservedUsername,
            };
            dispatch({ type: 'PROFILE_LOADED', payload: { profile } });
          } catch (parseError) {
            // Profile data parsing failed - log and continue with defaults
            logger.error(
              'Error parsing profile data',
              parseError instanceof Error ? parseError : new Error(String(parseError))
            );
            dispatch({ type: 'INITIALIZATION_COMPLETE' });
          }
        } else {
          // Profile doesn't exist or load failed - use defaults
          logger.debug('[AuthStateManager] Using default profile');
          dispatch({ type: 'INITIALIZATION_COMPLETE' });
        }
      } catch (error) {
        if (ignore) return;
        logger.error('Error loading profile', error instanceof Error ? error : new Error(String(error)));
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
      }
    } else {
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: null } });
      dispatch({ type: 'INITIALIZATION_COMPLETE' });
      onAuthStateChange?.(null);
    }
  });

  return () => {
    ignore = true; // Mark as stale on cleanup
    unsubscribe();
  };
}
