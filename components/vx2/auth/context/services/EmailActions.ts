/**
 * VX2 Email Actions Service
 *
 * Handles email verification and action link processing
 */

import type { Auth } from 'firebase/auth';
import { sendEmailVerification } from 'firebase/auth';

import type { AuthResult } from '../../types';

import { createAuthError } from './helpers';

export interface EmailActionsConfig {
  auth: Auth;
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(config: EmailActionsConfig): Promise<AuthResult> {
  const { auth } = config;

  if (!auth.currentUser) {
    return { success: false, error: createAuthError(new Error('Not authenticated')) };
  }

  try {
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
