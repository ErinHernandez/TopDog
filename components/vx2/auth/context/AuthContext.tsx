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
 */

import React, {
  createContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  linkWithCredential,
  reauthenticateWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import type {
  AuthState,
  AuthAction,
  AuthContextValue,
  AuthUser,
  UserProfile,
  AuthError,
  ProfileCompleteness,
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
import {
  AUTH_ERROR_CODES,
  getAuthErrorMessage,
  USERNAME_CONSTRAINTS,
} from '../constants';
import { validateUsername, checkUsernameAvailability } from '../../../../lib/usernameValidation';
import { createScopedLogger } from '@/lib/clientLogger';

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
// HELPERS
// ============================================================================

/**
 * Wraps a promise with a timeout
 * If the promise doesn't resolve within timeoutMs, rejects with error
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

/**
 * Convert Firebase User to AuthUser
 */
function firebaseUserToAuthUser(user: FirebaseUser): AuthUser {
  const providerId = user.providerData[0]?.providerId || 'anonymous';
  
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    providerId: providerId as AuthUser['providerId'],
    createdAt: new Date(user.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(user.metadata.lastSignInTime || Date.now()),
  };
}

/**
 * Calculate profile completeness
 */
function calculateProfileCompleteness(
  user: AuthUser | null,
  profile: UserProfile | null
): ProfileCompleteness {
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
function createAuthError(error: unknown, field?: string): AuthError {
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
      const updatedProfile = state.profile
        ? { ...state.profile, ...action.payload.profile }
        : null;
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
  
  // Store phone verification result
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
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
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-export';
  const isSSR = typeof window === 'undefined';
  const isVercelBuild = process.env.VERCEL === '1';
  const useSafeDefaults = isBuildPhase || isSSR || isVercelBuild || !isMounted;
  
  // ========== Auth State Listener ==========
  // CRITICAL: All hooks must run unconditionally before any return (Rules of Hooks)
  
  useEffect(() => {
    if (useSafeDefaults) return;
    if (!auth) {
      dispatch({ type: 'INITIALIZATION_COMPLETE' });
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = firebaseUserToAuthUser(firebaseUser);
        dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: authUser } });
        onAuthStateChange?.(authUser);
        
        // Load profile with timeout to prevent indefinite hanging
        if (db) {
          try {
            const profileDoc = await withTimeout(
              getDoc(doc(db, 'users', firebaseUser.uid)),
              10000, // 10 second timeout
              'Profile load timed out'
            ).catch((error) => {
              logger.warn(`Profile load failed or timed out: ${error.message}`);
              return null; // Return null to continue with defaults
            });
            
            if (profileDoc && profileDoc.exists()) {
              const profileData = profileDoc.data();
              const profile: UserProfile = {
                uid: firebaseUser.uid,
                username: profileData.username || '',
                email: profileData.email || null,
                countryCode: profileData.countryCode || 'US',
                displayName: profileData.displayName || '',
                createdAt: profileData.createdAt?.toDate() || new Date(),
                updatedAt: profileData.updatedAt?.toDate() || new Date(),
                isActive: profileData.isActive ?? true,
                profileComplete: profileData.profileComplete ?? false,
                tournamentsEntered: profileData.tournamentsEntered || 0,
                tournamentsWon: profileData.tournamentsWon || 0,
                totalWinnings: profileData.totalWinnings || 0,
                bestFinish: profileData.bestFinish || null,
                lastLogin: profileData.lastLogin?.toDate() || new Date(),
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
            } else {
              // Profile doesn't exist or load failed - use defaults
              logger.debug('[AuthContext] Using default profile');
              dispatch({ type: 'INITIALIZATION_COMPLETE' });
            }
          } catch (error) {
            logger.error('Error loading profile', error instanceof Error ? error : new Error(String(error)));
            dispatch({ type: 'INITIALIZATION_COMPLETE' });
          }
        } else {
          dispatch({ type: 'INITIALIZATION_COMPLETE' });
        }
      } else {
        dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: null } });
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
        onAuthStateChange?.(null);
      }
    });
    
    return () => unsubscribe();
  }, [auth, db, onAuthStateChange, useSafeDefaults]);
  
  // ========== Email/Password Auth ==========
  
  const signUpWithEmail = useCallback(async (data: EmailSignUpData): Promise<SignUpResult> => {
    if (!auth || !db) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      // Validate username first
      const validation = validateUsername(data.username, 'US'); // Default to US for email sign up
      if (!validation.isValid) {
        const error: AuthError = {
          code: AUTH_ERROR_CODES.USERNAME_INVALID,
          message: validation.errors.join(', '),
          field: 'username',
        };
        dispatch({ type: 'AUTH_ERROR', payload: { error } });
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
        dispatch({ type: 'AUTH_ERROR', payload: { error } });
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
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastLogin'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        updatedAt: ReturnType<typeof serverTimestamp>;
        lastLogin: ReturnType<typeof serverTimestamp>;
      } = {
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
        const { detectLocation, recordLocationVisit, grantLocationConsent } = await import('@/lib/customization/geolocation');
        
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
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, [auth, db]);
  
  const signInWithEmail = useCallback(async (data: EmailSignInData): Promise<SignInResult> => {
    dispatch({ type: 'AUTH_LOADING' });

    // Dev login: email "t" / password "t" works in development without Firebase
    const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    const isDevCredentials = data.email.trim().toLowerCase() === 't' && data.password === 't';
    if (isDev && isDevCredentials) {
      const now = new Date();
      const devUser: AuthUser = {
        uid: 'dev-user-t',
        email: 't',
        emailVerified: true,
        phoneNumber: null,
        displayName: 'Dev User',
        photoURL: null,
        isAnonymous: false,
        providerId: 'password',
        createdAt: now,
        lastLoginAt: now,
      };
      const devProfile: UserProfile = {
        uid: devUser.uid,
        username: 'devuser',
        email: devUser.email,
        displayName: devUser.displayName || 'Dev User',
        countryCode: 'US',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        profileComplete: true,
        tournamentsEntered: 0,
        tournamentsWon: 0,
        totalWinnings: 0,
        bestFinish: null,
        lastLogin: now,
        preferences: {
          notifications: true,
          emailUpdates: true,
          publicProfile: true,
          borderColor: '#4285F4',
        },
      };
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: devUser } });
      dispatch({ type: 'PROFILE_LOADED', payload: { profile: devProfile } });
      onAuthStateChange?.(devUser);
      return { success: true, data: devUser };
    }

    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const authUser = firebaseUserToAuthUser(credential.user);
      
      // Update last login
      if (db) {
        await updateDoc(doc(db, 'users', credential.user.uid), {
          lastLogin: serverTimestamp(),
        });
      }
      
      return { success: true, data: authUser };
      
    } catch (error) {
      const authError = createAuthError(error);
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, [auth, db, onAuthStateChange]);
  
  // ========== Phone Auth ==========
  
  const signInWithPhone = useCallback(async (data: PhoneAuthData): Promise<PhoneVerifyResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      // Create recaptcha verifier if not exists
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        data.phoneNumber,
        recaptchaVerifierRef.current
      );
      
      confirmationResultRef.current = confirmationResult;
      
      return {
        success: true,
        verificationId: confirmationResult.verificationId,
      };
      
    } catch (error) {
      const authError = createAuthError(error);
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, [auth]);
  
  const verifyPhoneCode = useCallback(async (data: PhoneVerifyData): Promise<SignInResult> => {
    if (!confirmationResultRef.current) {
      return { success: false, error: createAuthError(new Error('No verification in progress')) };
    }
    
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      const credential = await confirmationResultRef.current.confirm(data.code);
      const authUser = firebaseUserToAuthUser(credential.user);
      confirmationResultRef.current = null;
      
      return { success: true, data: authUser };
      
    } catch (error) {
      const authError = createAuthError(error);
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, []);
  
  // ========== Anonymous Auth ==========
  
  const signInAnonymously = useCallback(async (): Promise<SignInResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      const credential = await firebaseSignInAnonymously(auth);
      const authUser = firebaseUserToAuthUser(credential.user);
      
      return { success: true, data: authUser };
      
    } catch (error) {
      const authError = createAuthError(error);
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, [auth]);
  
  // ========== Sign Out ==========
  
  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    try {
      await firebaseSignOut(auth);
      dispatch({ type: 'SIGN_OUT' });
      return { success: true };
      
    } catch (error) {
      const authError = createAuthError(error);
      dispatch({ type: 'AUTH_ERROR', payload: { error: authError } });
      return { success: false, error: authError };
    }
  }, [auth]);
  
  // ========== Profile Management ==========
  
  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<AuthResult> => {
    if (!db || !state.user) {
      return { success: false, error: createAuthError(new Error('Not authenticated')) };
    }
    
    try {
      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      
      if (data.displayName !== undefined) updates.displayName = data.displayName;
      if (data.countryCode !== undefined) updates.countryCode = data.countryCode;
      if (data.preferences) {
        updates['preferences'] = { ...state.profile?.preferences, ...data.preferences };
      }
      
      await updateDoc(doc(db, 'users', state.user.uid), updates);
      
      dispatch({
        type: 'PROFILE_UPDATED',
        payload: {
          profile: {
            ...data,
            updatedAt: new Date(),
          } as Partial<UserProfile>,
        },
      });
      
      return { success: true };
      
    } catch (error) {
      const authError = createAuthError(error);
      return { success: false, error: authError };
    }
  }, [db, state.user, state.profile?.preferences]);
  
  const changeUsername = useCallback(async (data: UsernameChangeData): Promise<AuthResult> => {
    if (!db || !state.user) {
      return { success: false, error: createAuthError(new Error('Not authenticated')) };
    }
    
    try {
      // Validate new username
      const validation = validateUsername(data.newUsername, state.profile?.countryCode || 'US');
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.USERNAME_INVALID,
            message: validation.errors.join(', '),
            field: 'username',
          },
        };
      }
      
      // Check availability
      const availability = await checkUsernameAvailability(data.newUsername);
      if (!availability.isAvailable) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.USERNAME_TAKEN,
            message: availability.message,
            field: 'username',
          },
        };
      }
      
      // Update username
      await updateDoc(doc(db, 'users', state.user.uid), {
        username: data.newUsername.toLowerCase(),
        updatedAt: serverTimestamp(),
      });
      
      // Record username change in audit log
      await setDoc(doc(db, 'username_change_audit', `${state.user.uid}_${Date.now()}`), {
        userId: state.user.uid,
        previousUsername: state.profile?.username,
        newUsername: data.newUsername.toLowerCase(),
        reason: data.reason || 'User requested',
        changedAt: serverTimestamp(),
      });
      
      dispatch({
        type: 'PROFILE_UPDATED',
        payload: {
          profile: {
            username: data.newUsername.toLowerCase(),
            updatedAt: new Date(),
          },
        },
      });
      
      return { success: true };
      
    } catch (error) {
      const authError = createAuthError(error);
      return { success: false, error: authError };
    }
  }, [db, state.user, state.profile?.countryCode, state.profile?.username]);
  
  const deleteAccount = useCallback(async (password?: string): Promise<AuthResult> => {
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
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (currentUser.email && !currentUser.isAnonymous) {
        return { success: false, error: createAuthError(new Error('Password required to delete account')) };
      }

      // Delete Firestore profile
      await deleteDoc(doc(db, 'users', state.user.uid));

      // Delete Firebase user
      await currentUser.delete();

      dispatch({ type: 'SIGN_OUT' });
      return { success: true };
    } catch (error) {
      const authError = createAuthError(error);
      return { success: false, error: authError };
    }
  }, [auth, db, state.user]);
  
  // ========== Email Actions ==========
  
  const sendVerificationEmail = useCallback(async (): Promise<AuthResult> => {
    if (!auth?.currentUser) {
      return { success: false, error: createAuthError(new Error('Not authenticated')) };
    }
    
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
      
    } catch (error) {
      const authError = createAuthError(error);
      return { success: false, error: authError };
    }
  }, [auth]);
  
  const sendPasswordResetEmail = useCallback(async (email: string): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: createAuthError(new Error('Auth not initialized')) };
    }
    
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      return { success: true };
      
    } catch (error) {
      const authError = createAuthError(error);
      return { success: false, error: authError };
    }
  }, [auth]);
  
  // ========== Account Linking ==========
  
  const linkEmailPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!auth?.currentUser) {
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
  }, [auth]);
  
  const linkPhoneNumber = useCallback(async (phoneNumber: string): Promise<PhoneVerifyResult> => {
    // For phone linking, use the signInWithPhone flow first
    return signInWithPhone({ phoneNumber, countryCode: state.profile?.countryCode || 'US' });
  }, [signInWithPhone, state.profile?.countryCode]);
  
  // ========== Utilities ==========
  
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!db || !state.user) return;

    try {
      const profileDoc = await withTimeout(
        getDoc(doc(db, 'users', state.user.uid)),
        10000, // 10 second timeout
        'Profile refresh timed out'
      ).catch((error) => {
        logger.warn(`Profile refresh failed or timed out: ${error.message}`);
        return null; // Return null to continue without updating
      });

      if (profileDoc && profileDoc.exists()) {
        const profileData = profileDoc.data();
        const profile: UserProfile = {
          uid: state.user.uid,
          username: profileData.username || '',
          email: profileData.email || null,
          countryCode: profileData.countryCode || 'US',
          displayName: profileData.displayName || '',
          createdAt: profileData.createdAt?.toDate() || new Date(),
          updatedAt: profileData.updatedAt?.toDate() || new Date(),
          isActive: profileData.isActive ?? true,
          profileComplete: profileData.profileComplete ?? false,
          tournamentsEntered: profileData.tournamentsEntered || 0,
          tournamentsWon: profileData.tournamentsWon || 0,
          totalWinnings: profileData.totalWinnings || 0,
          bestFinish: profileData.bestFinish || null,
          lastLogin: profileData.lastLogin?.toDate() || new Date(),
          preferences: {
            notifications: profileData.preferences?.notifications ?? true,
            emailUpdates: profileData.preferences?.emailUpdates ?? true,
            publicProfile: profileData.preferences?.publicProfile ?? true,
            borderColor: profileData.preferences?.borderColor || '#4285F4',
          },
        };
        dispatch({ type: 'PROFILE_LOADED', payload: { profile } });
      }
    } catch (error) {
      logger.error('Error refreshing profile', error instanceof Error ? error : new Error(String(error)));
    }
  }, [db, state.user]);
  
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  // ========== Context Value ==========
  
  const value = useMemo<AuthContextValue>(() => ({
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
  }), [
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
  ]);
  
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
    error: buildError 
  });
  const noOpSignIn = async (): Promise<SignInResult> => ({ 
    success: false, 
    error: buildError 
  });
  const noOpPhoneVerify = async (): Promise<PhoneVerifyResult> => ({ 
    success: false,
    verificationId: '',
    error: buildError 
  });
  const noOpAuth = async (): Promise<AuthResult> => ({ 
    success: false, 
    error: buildError 
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
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
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

