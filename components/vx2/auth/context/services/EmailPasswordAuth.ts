/**
 * VX2 Email/Password Auth Service
 *
 * Handles email/password sign-in, sign-up, and password reset flows
 */

import type { Auth, UserCredential } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { createScopedLogger } from '@/lib/clientLogger';
import { validateUsername, checkUsernameAvailability } from '@/lib/usernameValidation';

import { AUTH_ERROR_CODES } from '../../constants';
import type { EmailSignUpData, EmailSignInData, SignUpResult, SignInResult, AuthError } from '../../types';

import { firebaseUserToAuthUser, createAuthError } from './helpers';

const logger = createScopedLogger('[EmailPasswordAuth]');

export interface EmailPasswordAuthConfig {
  auth: Auth;
  db: Firestore;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(config: EmailPasswordAuthConfig, data: EmailSignUpData): Promise<SignUpResult> {
  const { auth, db } = config;

  try {
    // Validate username first
    const validation = validateUsername(data.username, 'US'); // Default to US for email sign up
    if (!validation.isValid) {
      const error: AuthError = {
        code: AUTH_ERROR_CODES.USERNAME_INVALID,
        message: validation.errors.join(', '),
        field: 'username',
      };
      return { success: false, error };
    }

    // Check username availability
    const availability = await checkUsernameAvailability(data.username);
    if (!availability.isAvailable) {
      const error: AuthError = {
        code: AUTH_ERROR_CODES.USERNAME_TAKEN,
        message: availability.message,
        field: 'username',
      };
      return { success: false, error };
    }

    // Create Firebase user
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = credential.user;

    // Update display name
    if (data.displayName || data.username) {
      await firebaseUpdateProfile(firebaseUser, {
        displayName: data.displayName || data.username,
      });
    }

    // Create Firestore profile
    const userProfile = {
      uid: firebaseUser.uid,
      username: data.username.toLowerCase(),
      email: data.email,
      countryCode: 'US', // Default to US for email sign up
      displayName: data.displayName || data.username,
      isActive: true,
      profileComplete: true,
      tournamentsEntered: 0,
      tournamentsWon: 0,
      totalWinnings: 0,
      bestFinish: null,
      preferences: {
        notifications: true,
        emailUpdates: true,
        publicProfile: true,
        borderColor: '#4285F4',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

    // Record location for first flag earned
    // This uses the location provided during signup or auto-detects it
    try {
      // Import location functions dynamically to avoid circular dependencies
      const { detectLocation, recordLocationVisit, grantLocationConsent } = await import(
        '@/lib/customization/geolocation'
      );

      // Grant location consent (IP-based geolocation doesn't require explicit user consent)
      await grantLocationConsent(firebaseUser.uid);

      // Detect location using IP-based geolocation
      const location = await detectLocation();
      if (location.country) {
        // Record the location visit - this gives the user their first flag
        await recordLocationVisit(firebaseUser.uid, location);
      }
    } catch (locationError) {
      // Don't fail signup if location detection fails - just log it
      logger.warn('Failed to record location during signup');
    }

    // Send verification email
    await sendEmailVerification(firebaseUser);

    const authUser = firebaseUserToAuthUser(firebaseUser);

    return {
      success: true,
      data: authUser,
      needsEmailVerification: true,
    };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(config: EmailPasswordAuthConfig, data: EmailSignInData): Promise<SignInResult> {
  const { auth, db } = config;

  // Dev login: email "t" / password "t" works in development without Firebase
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  const isDevCredentials = data.email.trim().toLowerCase() === 't' && data.password === 't';
  if (isDev && isDevCredentials) {
    const now = new Date();
    const devUser = {
      uid: 'dev-user-t',
      email: 't',
      emailVerified: true,
      phoneNumber: null,
      displayName: 'Dev User',
      photoURL: null,
      isAnonymous: false,
      providerId: 'password' as const,
      createdAt: now,
      lastLoginAt: now,
    };

    return { success: true, data: devUser };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const authUser = firebaseUserToAuthUser(credential.user);

    // Update last login
    await updateDoc(doc(db, 'users', credential.user.uid), {
      lastLogin: serverTimestamp(),
    });

    return { success: true, data: authUser };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(config: EmailPasswordAuthConfig, email: string): Promise<{ success: boolean; error?: AuthError }> {
  const { auth } = config;

  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    const authError = createAuthError(error);
    return { success: false, error: authError };
  }
}
