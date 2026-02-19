/**
 * VX2 Anonymous Auth Service
 *
 * Handles anonymous sign-in flows
 */

import type { Auth } from 'firebase/auth';
import { signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

import type { SignInResult } from '../../types';

import { firebaseUserToAuthUser, createAuthError } from './helpers';

export interface AnonymousAuthConfig {
  auth: Auth;
}

/**
 * Sign in anonymously
 */
export async function signInAnonymously(config: AnonymousAuthConfig): Promise<SignInResult> {
  const { auth } = config;

  try {
    const credential = await firebaseSignInAnonymously(auth);
    const authUser = firebaseUserToAuthUser(credential.user);

    return { success: true, data: authUser };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
