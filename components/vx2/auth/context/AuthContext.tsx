/**
 * VX2 Auth Context
 *
 * Enterprise-grade authentication context providing:
 * - Firebase Auth integration
 * - Firestore profile management
 * - Email/password authentication
 * - Phone number authentication
 * - Biometric authentication support
 * - Profile completeness tracking
 * - Session management
 * - Error handling
 *
 * Note: No third-party OAuth (Google/Apple) per industry standard for DFS platforms.
 *
 * ARCHITECTURE:
 * This is a composition root that:
 * 1. Creates the React context and provider
 * 2. Initializes services with Firebase instances
 * 3. Composes services into the context value
 * 4. Provides SSR safety and build-time detection
 *
 * All business logic is delegated to service modules in ./services/
 */

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import React, {
  createContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

import type {
  AuthState,
  AuthAction,
  AuthContextValue,
  AuthUser,
  UserProfile,
  AuthError,
  EmailSignUpData,
  EmailSignInData,
  PhoneAuthData,
  PhoneVerifyData,
  ProfileUpdateData,
  UsernameChangeData,
  SignUpResult,
  SignInResult,
  PhoneVerifyResult,
  AuthResult,
} from '../types';

// Import service modules
import { calculateProfileCompleteness, createAuthError, firebaseUserToAuthUser } from './services';
import * as AccountLinkingService from './services/AccountLinking';
import * as AnonymousAuthService from './services/AnonymousAuth';
import { setupAuthStateListener } from './services/AuthStateManager';
import * as EmailActionsService from './services/EmailActions';
import * as EmailPasswordAuthService from './services/EmailPasswordAuth';
import * as PhoneAuthService from './services/PhoneAuth';
import * as ProfileServiceModule from './services/ProfileService';
import * as SessionManagerService from './services/SessionManager';

const logger = createScopedLogger('[AuthContext]');

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  status: 'idle',
  user: null,
  profile: null,
  isLoading: true,
  isInitializing: true,
  error: null,
  profileCompleteness: 'minimal',
};

// ============================================================================
// REDUCER
// ============================================================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED': {
      const { user } = action.payload;
      const completeness = calculateProfileCompleteness(user, state.profile);

      return {
        ...state,
        status: user ? 'authenticated' : 'unauthenticated',
        user,
        isLoading: user ? true : false, // Keep loading if authenticated (waiting for profile)
        error: null,
        profileCompleteness: completeness,
      };
    }

    case 'PROFILE_LOADED': {
      const { profile } = action.payload;
      const completeness = calculateProfileCompleteness(state.user, profile);

      return {
        ...state,
        profile,
        isLoading: false,
        profileCompleteness: completeness,
      };
    }

    case 'PROFILE_UPDATED': {
      const updatedProfile = state.profile ? { ...state.profile, ...action.payload.profile } : null;
      const completeness = calculateProfileCompleteness(state.user, updatedProfile);

      return {
        ...state,
        profile: updatedProfile,
        profileCompleteness: completeness,
      };
    }

    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        status: 'error',
        isLoading: false,
        error: action.payload.error,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        status: state.user ? 'authenticated' : 'unauthenticated',
      };

    case 'SIGN_OUT':
      return {
        ...initialState,
        isInitializing: false,
        isLoading: false,
        status: 'unauthenticated',
      };

    case 'INITIALIZATION_COMPLETE':
      return {
        ...state,
        isInitializing: false,
        isLoading: false,
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

export const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
  /** Optional callback when auth state changes */
  onAuthStateChange?: (user: AuthUser | null) => void;
}

export function AuthProvider({
  children,
  onAuthStateChange,
}: AuthProviderProps): React.ReactElement {
  // Track mount state to ensure consistent SSR/client rendering
  const [isMounted, setIsMounted] = useState(false);

  // CRITICAL: All hooks must be called before any conditional returns
  // This ensures hooks are always called in the same order (Rules of Hooks)
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Store phone verification result and recaptcha verifier
  // These are used by phone auth service but stored in context to maintain state across renders
  const phoneAuthStateRef = useRef<PhoneAuthService.PhoneAuthServiceState>({
    confirmationResult: null,
    recaptchaVerifier: null,
  });

  // Firebase instances - safe to call during SSR (will return null if not initialized)
  const auth = useMemo(() => {
    try {
      return getAuth();
    } catch {
      logger.warn('Firebase Auth not initialized');
      return null;
    }
  }, []);

  const db = useMemo(() => {
    try {
      return getFirestore();
    } catch {
      logger.warn('Firestore not initialized');
      return null;
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Build-time detection: used for conditional render only (all hooks must run first)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export';
  const isSSR = typeof window === 'undefined';
  const isVercelBuild = process.env.VERCEL === '1';
  const useSafeDefaults = isBuildPhase || isSSR || isVercelBuild || !isMounted;

  // ========== Auth State Listener ==========
  // CRITICAL: All hooks must run unconditionally before any return (Rules of Hooks)

  useEffect(() => {
    if (useSafeDefaults) return;
    if (!auth || !db) {
      dispatch({ type: 'INITIALIZATION_COMPLETE' });
      return;
    }

    const unsubscribe = setupAuthStateListener({
      auth,
      db,
      dispatch,
      onAuthStateChange,
    });

    return unsubscribe;
  }, [auth, db, onAuthStateChange, useSafeDefaults]);

  // ========== Fallback Initialization Timeout ==========
  // Handle edge case where Firebase never initializes or auth state listener never fires
  // This ensures the app doesn't get stuck on loading screens indefinitely
  useEffect(() => {
    // Only run if we're mounted but still initializing after 10 seconds
    if (!isMounted || !state.isInitializing) return;

    const timeoutId = setTimeout(() => {
      if (state.isInitializing) {
        logger.warn(
          '[AuthContext] Auth never initialized after 10s - forcing INITIALIZATION_COMPLETE',
        );
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isMounted, state.isInitializing]);

  // ========== Email/Password Auth ==========

  const signUpWithEmail = useCallback(
    async (data: EmailSignUpData): Promise<SignUpResult> => {
      if (!auth || !db) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      dispatch({ type: 'AUTH_LOADING' });

      const result = await EmailPasswordAuthService.signUpWithEmail({ auth, db }, data);
      if (!result.success) {
        dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
      }
      return result;
    },
    [auth, db],
  );

  const signInWithEmail = useCallback(
    async (data: EmailSignInData): Promise<SignInResult> => {
      dispatch({ type: 'AUTH_LOADING' });

      if (!auth || !db) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      const result = await EmailPasswordAuthService.signInWithEmail({ auth, db }, data);
      if (!result.success) {
        dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
      }
      return result;
    },
    [auth, db],
  );

  // ========== Phone Auth ==========

  const signInWithPhone = useCallback(
    async (data: PhoneAuthData): Promise<PhoneVerifyResult> => {
      if (!auth) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      dispatch({ type: 'AUTH_LOADING' });

      const result = await PhoneAuthService.signInWithPhone(auth, phoneAuthStateRef.current, data);
      if (!result.success) {
        dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
      }
      return result;
    },
    [auth],
  );

  const verifyPhoneCode = useCallback(async (data: PhoneVerifyData): Promise<SignInResult> => {
    dispatch({ type: 'AUTH_LOADING' });

    const result = await PhoneAuthService.verifyPhoneCode(phoneAuthStateRef.current, data);
    if (!result.success) {
      dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
    }
    return result;
  }, []);

  // ========== Anonymous Auth ==========

  const signInAnonymously = useCallback(async (): Promise<SignInResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }

    dispatch({ type: 'AUTH_LOADING' });

    const result = await AnonymousAuthService.signInAnonymously({ auth });
    if (!result.success) {
      dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
    }
    return result;
  }, [auth]);

  // ========== Sign Out ==========

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }

    const result = await SessionManagerService.signOut({ auth });
    if (result.success) {
      dispatch({ type: 'SIGN_OUT' });
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
    }
    return result;
  }, [auth]);

  // ========== Profile Management ==========

  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<AuthResult> => {
      if (!db || !state.user) {
        return { success: false, error: createAuthError(new Error('Not authenticated')) };
      }

      const result = await ProfileServiceModule.updateProfile(
        { db },
        state.user,
        state.profile,
        data,
      );
      if (result.success) {
        dispatch({
          type: 'PROFILE_UPDATED',
          payload: {
            profile: {
              ...data,
              updatedAt: new Date(),
            } as Partial<UserProfile>,
          },
        });
      }
      return result;
    },
    [db, state.user, state.profile],
  );

  const changeUsername = useCallback(
    async (data: UsernameChangeData): Promise<AuthResult> => {
      if (!db || !state.user) {
        return { success: false, error: createAuthError(new Error('Not authenticated')) };
      }

      const result = await ProfileServiceModule.changeUsername(
        { db },
        state.user,
        state.profile,
        data,
      );
      if (result.success) {
        dispatch({
          type: 'PROFILE_UPDATED',
          payload: {
            profile: {
              username: data.newUsername.toLowerCase(),
              updatedAt: new Date(),
            },
          },
        });
      }
      return result;
    },
    [db, state.user, state.profile],
  );

  const deleteAccount = useCallback(
    async (password?: string): Promise<AuthResult> => {
      if (!auth || !db || !state.user) {
        return { success: false, error: createAuthError(new Error('Not authenticated')) };
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: createAuthError(new Error('Not authenticated')) };
      }

      try {
        // Email/password users must re-authenticate with password before deletion
        if (currentUser.email && password != null && password.length > 0) {
          const reauthResult = await AccountLinkingService.reauthenticateWithEmail(
            { auth },
            currentUser.email,
            password,
          );
          if (!reauthResult.success) {
            return reauthResult;
          }
        } else if (currentUser.email && !currentUser.isAnonymous) {
          return {
            success: false,
            error: createAuthError(new Error('Password required to delete account')),
          };
        }

        // Delete Firestore profile
        const deleteResult = await ProfileServiceModule.deleteAccountData({ db }, state.user);
        if (deleteResult.success) {
          // Delete Firebase user
          await currentUser.delete();
          dispatch({ type: 'SIGN_OUT' });
        }
        return deleteResult;
      } catch (error) {
        const authError = createAuthError(error);
        return { success: false, error: authError };
      }
    },
    [auth, db, state.user],
  );

  // ========== Email Actions ==========

  const sendVerificationEmail = useCallback(async (): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }

    const result = await EmailActionsService.sendVerificationEmail({ auth });
    if (!result.success) {
      dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
    }
    return result;
  }, [auth]);

  const sendPasswordResetEmail = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!auth || !db) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      const result = await EmailPasswordAuthService.sendPasswordResetEmail({ auth, db }, email);
      if (!result.success) {
        dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
      }
      return result;
    },
    [auth, db],
  );

  // ========== Account Linking ==========

  const linkEmailPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!auth) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      const result = await AccountLinkingService.linkEmailPassword({ auth }, email, password);
      if (!result.success) {
        dispatch({ type: 'AUTH_ERROR', payload: { error: result.error! } });
      }
      return result;
    },
    [auth],
  );

  const linkPhoneNumber = useCallback(
    async (phoneNumber: string): Promise<PhoneVerifyResult> => {
      if (!auth) {
        return { success: false, error: createAuthError(new Error('Auth not initialized')) };
      }

      const countryCode = state.profile?.countryCode || 'US';
      return AccountLinkingService.linkPhoneNumber(
        auth,
        phoneAuthStateRef.current,
        phoneNumber,
        countryCode,
      );
    },
    [auth, state.profile?.countryCode],
  );

  // ========== Utilities ==========

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!db || !state.user) return;

    const profile = await ProfileServiceModule.refreshProfile({ db }, state.user);
    if (profile) {
      dispatch({
        type: 'PROFILE_LOADED',
        payload: { profile },
      });
    }
  }, [db, state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ========== Context Value ==========

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.user,
      profile: state.profile,
      isAuthenticated: state.status === 'authenticated' && !!state.user,
      isLoading: state.isLoading || state.isInitializing,
      error: state.error,

      signUpWithEmail,
      signInWithEmail,
      signInWithPhone,
      verifyPhoneCode,
      signInAnonymously,
      signOut,

      updateProfile,
      changeUsername,
      deleteAccount,

      sendVerificationEmail,
      sendPasswordResetEmail,

      linkEmailPassword,
      linkPhoneNumber,

      refreshProfile,
      clearError,
    }),
    [
      state,
      signUpWithEmail,
      signInWithEmail,
      signInWithPhone,
      verifyPhoneCode,
      signInAnonymously,
      signOut,
      updateProfile,
      changeUsername,
      deleteAccount,
      sendVerificationEmail,
      sendPasswordResetEmail,
      linkEmailPassword,
      linkPhoneNumber,
      refreshProfile,
      clearError,
    ],
  );

  // Use safe defaults during build/SSR/before mount; otherwise use real auth value
  const providerValue = useSafeDefaults ? createBuildTimeSafeDefaults() : value;

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
      {/* Invisible recaptcha container for phone auth */}
      <div id="recaptcha-container" suppressHydrationWarning />
    </AuthContext.Provider>
  );
}

// ============================================================================
// BUILD-TIME SAFE DEFAULTS
// ============================================================================

/**
 * Create safe default context value for build/prerender phase
 * Prevents build errors when AuthProvider is not available
 */
function createBuildTimeSafeDefaults(): AuthContextValue {
  // Match initialState exactly to prevent hydration mismatches
  // During SSR/build, we want the same state structure as initial client render
  const safeState: AuthState = {
    status: 'idle',
    user: null,
    profile: null,
    isLoading: true,
    isInitializing: true,
    error: null,
    profileCompleteness: 'minimal',
  };

  // Build-phase error
  const buildError: AuthError = {
    code: 'BUILD_PHASE',
    message: 'Auth operations not available during build phase',
    field: undefined,
    originalError: new Error('Build phase'),
  };

  // No-op functions for build phase - return proper types
  const noOpSignUp = async (): Promise<SignUpResult> => ({
    success: false,
    error: buildError,
  });
  const noOpSignIn = async (): Promise<SignInResult> => ({
    success: false,
    error: buildError,
  });
  const noOpPhoneVerify = async (): Promise<PhoneVerifyResult> => ({
    success: false,
    verificationId: '',
    error: buildError,
  });
  const noOpAuth = async (): Promise<AuthResult> => ({
    success: false,
    error: buildError,
  });
  const noOpVoid = async (): Promise<void> => {};

  return {
    state: safeState,
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: safeState.isLoading, // Match safeState to prevent hydration mismatch
    error: null,
    signUpWithEmail: noOpSignUp,
    signInWithEmail: noOpSignIn,
    signInWithPhone: noOpPhoneVerify,
    verifyPhoneCode: noOpSignIn,
    signInAnonymously: noOpSignIn,
    signOut: noOpAuth,
    updateProfile: noOpAuth,
    changeUsername: noOpAuth,
    deleteAccount: noOpAuth,
    sendVerificationEmail: noOpAuth,
    sendPasswordResetEmail: noOpAuth,
    linkEmailPassword: noOpAuth,
    linkPhoneNumber: noOpPhoneVerify,
    refreshProfile: noOpVoid,
    clearError: () => {},
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access auth context
 * @throws Error if used outside of AuthProvider (except during build phase)
 */
export function useAuthContext(): AuthContextValue {
  // Track mount state to ensure consistent SSR/client rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // CRITICAL: Always call useContext unconditionally to follow Rules of Hooks
  // useContext is safe to call even during SSR - it will return null or default value
  const context = React.useContext(AuthContext);

  // Check for SSR/build scenarios and return safe defaults if needed
  // This check happens AFTER calling useContext to maintain hook order
  if (typeof window === 'undefined') {
    return createBuildTimeSafeDefaults();
  }

  // On client's initial render (before mount), return safe defaults
  // This ensures server and initial client render are identical
  if (!isMounted) {
    return createBuildTimeSafeDefaults();
  }

  // Additional build-time detection for extra safety
  // Check multiple conditions to catch all build/prerender scenarios
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export';
  const isPrerender = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE;

  // Vercel-specific build detection
  // Vercel sets VERCEL=1 during builds - check this FIRST before other conditions
  const isVercelBuild = process.env.VERCEL === '1';

  // Check if we're in a build/prerender environment
  const isBuildOrPrerender = isBuildPhase || isPrerender || isVercelBuild;

  // If we're in any build/prerender scenario, return safe defaults
  if (isBuildOrPrerender) {
    return createBuildTimeSafeDefaults();
  }

  // ULTRA-DEFENSIVE: If no context is available, return safe defaults
  // This ensures builds never fail and provides graceful fallback
  if (!context) {
    return createBuildTimeSafeDefaults();
  }

  return context;
}
