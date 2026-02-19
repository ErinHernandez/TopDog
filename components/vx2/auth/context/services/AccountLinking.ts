/**
 * VX2 Account Linking Service
 *
 * Handles linking and unlinking authentication providers
 */

import type { Auth } from 'firebase/auth';
import { linkWithCredential, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

import type { AuthResult, PhoneVerifyResult } from '../../types';

import { createAuthError } from './helpers';
import type { PhoneAuthServiceState } from './PhoneAuth';
import { signInWithPhone } from './PhoneAuth';

export interface AccountLinkingConfig {
  auth: Auth;
}

/**
 * Link email/password to current user
 */
export async function linkEmailPassword(
  config: AccountLinkingConfig,
  email: string,
  password: string
): Promise<AuthResult> {
  const { auth } = config;

  if (!auth.currentUser) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Link phone number to current user
 */
export function linkPhoneNumber(
  auth: Auth,
  phoneState: PhoneAuthServiceState,
  phoneNumber: string,
  countryCode: string
): Promise<PhoneVerifyResult> {
  // For phone linking, use the signInWithPhone flow first
  return signInWithPhone(auth, phoneState, { phoneNumber, countryCode });
}

/**
 * Reauthenticate user with email and password
 * Required before sensitive operations like account deletion
 */
export async function reauthenticateWithEmail(
  config: AccountLinkingConfig,
  email: string,
  password: string
): Promise<AuthResult> {
  const { auth } = config;

  if (!auth.currentUser) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
