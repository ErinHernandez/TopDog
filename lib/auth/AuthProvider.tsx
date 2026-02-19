'use client';

/**
 * Idesaign — Authentication Provider
 *
 * Two modes:
 * 1. Firebase mode — when NEXT_PUBLIC_FIREBASE_API_KEY is set
 * 2. Dev mode — local accounts stored in localStorage (no Firebase needed)
 *
 * @module lib/auth/AuthProvider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

/** Minimal user shape used across the app */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

export interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

/* ----------------------------------------------------------------
   Configuration helpers
   ---------------------------------------------------------------- */

function isFirebaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

/**
 * Returns true when the Firebase Auth Emulator should be used.
 * Set NEXT_PUBLIC_USE_EMULATORS=true in .env.local for local development.
 */
function shouldUseEmulator(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
  );
}

let emulatorConnected = false;

/* ----------------------------------------------------------------
   Context
   ---------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = 'AuthContext';

/* ----------------------------------------------------------------
   Provider
   ---------------------------------------------------------------- */

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Initialize auth state ---- */
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured()) {
      // Firebase not configured — show a clear error instead of silently allowing
      // unauthenticated access. Use Firebase Auth Emulator for local dev.
      console.warn(
        '[AuthProvider] Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY ' +
        'and optionally NEXT_PUBLIC_USE_EMULATORS=true for local development.'
      );
      setLoading(false);
      return;
    }

    // Firebase mode (production or emulator)
    initFirebaseAuth();

    async function initFirebaseAuth() {
      try {
        const { getFirebaseAuth } = await import('@/lib/firebase/client');
        const { onAuthStateChanged: onAuth, connectAuthEmulator } = await import('firebase/auth');
        const auth = getFirebaseAuth();

        // Connect to Firebase Auth Emulator in dev mode (idempotent guard)
        if (shouldUseEmulator() && !emulatorConnected) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          emulatorConnected = true;
        }

        const unsubscribe = onAuth(
          auth,
          (firebaseUser) => {
            if (firebaseUser) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                getIdToken: (force) => firebaseUser.getIdToken(force),
              });
            } else {
              setUser(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error('[AuthProvider] onAuthStateChanged error:', err);
            setError(err.message);
            setLoading(false);
          },
        );
        return unsubscribe;
      } catch {
        setLoading(false);
      }
    }
  }, []);

  /* ---- Helpers ---- */

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async (email: string, password: string) => {
    clearError();

    if (!isFirebaseConfigured()) {
      const msg = 'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY or use emulators.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      const { getFirebaseAuth, signInWithEmailAndPassword } = await import('@/lib/firebase/client');
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setError(msg);
      throw err;
    }
  }, [clearError]);

  const signInWithGoogle = useCallback(async () => {
    clearError();
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY.');
      return;
    }
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase/client');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
      throw err;
    }
  }, [clearError]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    clearError();
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY.');
      return;
    }
    try {
      const { getFirebaseAuth, createUserWithEmailAndPassword } = await import('@/lib/firebase/client');
      const { updateProfile } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed';
      setError(msg);
      throw err;
    }
  }, [clearError]);

  const signOutFn = useCallback(async () => {
    clearError();
    if (!isFirebaseConfigured()) {
      setUser(null);
      return;
    }
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase/client');
      const { signOut: fbSignOut } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-out failed';
      setError(msg);
      throw err;
    }
  }, [clearError]);

  const resetPassword = useCallback(async (email: string) => {
    clearError();
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY.');
      return;
    }
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase/client');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      setError(msg);
      throw err;
    }
  }, [clearError]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken(true);
    } catch {
      return null;
    }
  }, [user]);

  /* ---- Context value ---- */

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signInWithGoogle,
      signUp,
      signOut: signOutFn,
      resetPassword,
      getIdToken,
    }),
    [user, loading, error, signIn, signInWithGoogle, signUp, signOutFn, resetPassword, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ----------------------------------------------------------------
   Hooks
   ---------------------------------------------------------------- */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
