/**
 * VX2 Auth Service Helpers
 *
 * Shared utilities for auth services
 */

import type { User as FirebaseUser } from 'firebase/auth';

import { createScopedLogger } from '@/lib/clientLogger';

import { getAuthErrorMessage } from '../../constants';
import type { AuthError, AuthUser, UserProfile } from '../../types';


const logger = createScopedLogger('[AuthServices]');

/**
 * Wraps a promise with a timeout
 * If the promise doesn't resolve within timeoutMs, rejects with error
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

/**
 * Safely convert Firestore timestamp to Date
 * Prevents crashes from corrupt or malformed timestamp data
 */
export function safeToDate(timestamp: unknown, fallback: Date): Date {
  try {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return (timestamp as { toDate: () => Date }).toDate();
    }
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Convert Firebase User to AuthUser
 */
export function firebaseUserToAuthUser(user: FirebaseUser): AuthUser {
  const providerId = user.providerData[0]?.providerId || 'anonymous';

  return {
    uid: user.uid,
    email: user.email || '',
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    isAnonymous: user.isAnonymous,
    providerId: providerId as AuthUser['providerId'],
    createdAt: new Date(user.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(user.metadata.lastSignInTime || Date.now()),
  };
}

/**
 * Calculate profile completeness
 */
export function calculateProfileCompleteness(
  user: AuthUser | null,
  profile: UserProfile | null
): 'minimal' | 'basic' | 'verified' | 'complete' {
  if (!user) return 'minimal';
  if (user.isAnonymous) return 'minimal';
  if (!profile?.username) return 'minimal';
  if (!user.emailVerified && !user.phoneNumber) return 'basic';
  if (!profile.profileComplete) return 'verified';
  return 'complete';
}

/**
 * Create auth error from Firebase error
 */
export function createAuthError(error: unknown, field?: string): AuthError {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    return {
      code: firebaseError.code,
      message: getAuthErrorMessage(firebaseError.code),
      field,
      originalError: error,
    };
  }

  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    field,
    originalError: error,
  };
}
