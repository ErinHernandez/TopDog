/**
 * VX2 Session Manager Service
 *
 * Handles session management and token operations
 */

import type { Auth } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';

import { draftSession } from '@/lib/draftSession';

import type { AuthResult } from '../../types';

import { createAuthError } from './helpers';

export interface SessionManagerConfig {
  auth: Auth;
}

/**
 * Sign out and clean up session
 */
export async function signOut(config: SessionManagerConfig): Promise<AuthResult> {
  const { auth } = config;

  try {
    await firebaseSignOut(auth);

    // Clean up all draft session data on logout
    // This prevents stale session flags from leaking to other users
    draftSession.clearAll();

    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
