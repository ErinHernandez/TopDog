/**
 * VX2 Phone Auth Service
 *
 * Handles phone number authentication and OTP verification
 */

import type { Auth, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { signInWithPhoneNumber, RecaptchaVerifier as FirebaseRecaptchaVerifier } from 'firebase/auth';

import { createScopedLogger } from '@/lib/clientLogger';

import type { PhoneAuthData, PhoneVerifyData, PhoneVerifyResult, SignInResult, AuthError } from '../../types';

import { firebaseUserToAuthUser, createAuthError } from './helpers';

const logger = createScopedLogger('[PhoneAuth]');

export interface PhoneAuthServiceState {
  confirmationResult: ConfirmationResult | null;
  recaptchaVerifier: RecaptchaVerifier | null;
}

/**
 * Initialize or get recaptcha verifier
 */
export function getOrCreateRecaptchaVerifier(
  auth: Auth,
  state: PhoneAuthServiceState
): FirebaseRecaptchaVerifier {
  if (state.recaptchaVerifier) {
    return state.recaptchaVerifier;
  }

  return new FirebaseRecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
}

/**
 * Start phone authentication flow
 */
export async function signInWithPhone(
  auth: Auth,
  state: PhoneAuthServiceState,
  data: PhoneAuthData
): Promise<PhoneVerifyResult> {
  try {
    // Create recaptcha verifier if not exists
    const verifier = getOrCreateRecaptchaVerifier(auth, state);
    state.recaptchaVerifier = verifier;

    const confirmationResult = await signInWithPhoneNumber(auth, data.phoneNumber, verifier);

    state.confirmationResult = confirmationResult;

    return {
      success: true,
      verificationId: confirmationResult.verificationId,
    };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Verify phone code (OTP)
 */
export async function verifyPhoneCode(
  state: PhoneAuthServiceState,
  data: PhoneVerifyData
): Promise<SignInResult> {
  if (!state.confirmationResult) {
    return {
      success: false,
      error: createAuthError(new Error('No verification in progress')),
    };
  }

  try {
    const credential = await state.confirmationResult.confirm(data.code);
    const authUser = firebaseUserToAuthUser(credential.user);
    state.confirmationResult = null;

    return { success: true, data: authUser };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
