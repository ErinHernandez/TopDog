/**
 * Firebase Client Initialization
 * 
 * Handles Firebase app, Firestore, and Auth initialization with proper error handling
 * and environment variable validation.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[Firebase]');

// ============================================================================
// TYPES
// ============================================================================

export interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId: string | undefined;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// SECURITY: Never hardcode credentials - always use environment variables
// In production, all environment variables must be set
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required configuration
const requiredVars: string[] = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Helper to check for missing vars (lazy evaluation to avoid HMR noise)
const checkMissingVars = (): string[] => {
  return requiredVars.filter(varName => !process.env[varName]);
};

// Only throw during actual production runtime (not during builds)
// Check if we're in a build context - Next.js sets NEXT_PHASE during builds
// VERCEL_ENV === 'production' means actual production runtime (not build)
const isBuildContext = process.env.NEXT_PHASE !== undefined || 
  (process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'production');
const isRealProductionRuntime = process.env.NODE_ENV === 'production' && 
  !isBuildContext && 
  process.env.VERCEL_ENV === 'production';

// Track if we've already logged the error to avoid spam during HMR
let hasLoggedConfigError = false;

// ============================================================================
// PERSISTENCE INITIALIZATION TRACKING
// ============================================================================

// Promise to track when offline persistence is ready
// Other modules should await this before first database access
let persistenceInitialized = false;
let persistenceResolve: () => void = () => {};
export const persistenceReady = new Promise<void>((resolve) => {
  persistenceResolve = resolve;
});

// Only initialize Firebase if we have the minimum required config
// In development, we'll still try to initialize but it will fail gracefully
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Check if we have at least the API key and project ID (minimum required)
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = !getApps().length ? initializeApp(firebaseConfig) : (getApps()[0] as FirebaseApp);

    // Initialize Firestore with offline persistence enabled for better performance
    // This caches data locally and reduces network requests
    db = getFirestore(app);
    
    // Enable offline persistence (only on client side)
    // Initialize persistence asynchronously - resolve the promise when ready
    if (typeof window !== 'undefined') {
      // Note: enableIndexedDbPersistence is async and may fail if another tab is open
      // We'll enable it silently - if it fails, Firebase will still work without persistence
      import('firebase/firestore').then(async ({ enableIndexedDbPersistence }) => {
        if (db) {
          enableIndexedDbPersistence(db).then(() => {
            persistenceInitialized = true;
            logger.debug('IndexedDB persistence enabled');
            persistenceResolve();
          }).catch((err: { code?: string }) => {
            // Persistence can only be enabled in one tab at a time
            // If it fails, that's okay - Firebase will still work
            persistenceInitialized = true;
            if (err.code === 'failed-precondition') {
              logger.debug('Persistence already enabled in another tab');
            } else if (err.code === 'unimplemented') {
              logger.debug('Persistence not available in this browser');
            }
            // Silently ignore other errors - offline persistence is optional
            persistenceResolve();
          });
        }
      }).catch(() => {
        // If import fails, continue without persistence
        persistenceInitialized = true;
        persistenceResolve();
      });
    } else {
      // Server-side: no persistence needed, resolve immediately
      persistenceInitialized = true;
      persistenceResolve();
    }
    
    auth = getAuth(app) as Auth;
    // Firebase initialized successfully - no need to log errors
  } else {
    // Only log error if Firebase actually fails to initialize and we haven't logged it yet
    const missingVars = checkMissingVars();
    
    if (isRealProductionRuntime) {
      // CRITICAL: Don't throw here - it crashes hydration before React mounts
      // Log the error but allow graceful degradation
      console.error(
        `[Firebase] CRITICAL: Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Firebase features will be disabled. Set environment variables in Vercel dashboard.'
      );
    } else if (process.env.NODE_ENV === 'development' && !hasLoggedConfigError && missingVars.length > 0) {
      // In development, warn but provide helpful instructions (only once to avoid HMR spam)
      // Only log if we're actually missing variables (they might be available later during HMR)
      hasLoggedConfigError = true;
      logger.error('MISSING FIREBASE ENVIRONMENT VARIABLES', undefined, {
        missingVars: missingVars.join(', '),
        instructions: 'Create .env.local file with Firebase config. See FIREBASE_SETUP.md'
      });
    }

    // During local production builds (npm run build), just warn
    if (process.env.NODE_ENV === 'production' && !isRealProductionRuntime && !hasLoggedConfigError && missingVars.length > 0) {
      hasLoggedConfigError = true;
      logger.warn('Missing env vars during build - will fail at runtime if not provided');
    }
  }
} catch (error) {
  logger.error('Firebase initialization error', error instanceof Error ? error : new Error(String(error)));
  logger.warn('App will continue but Firebase features will not work.');
  // Don't re-throw in production - allow graceful degradation instead of crashing hydration
  if (process.env.NODE_ENV === 'development') {
    logger.warn('See FIREBASE_SETUP.md for setup instructions');
  }
}

// Track authentication status
let authInitialized = false;
let authEnabled = false;
let authDegraded = false; // Flag for when auth falls back to mock data

// Initialize anonymous authentication for development
const initializeAuth = async (): Promise<User | null> => {
  // Only run on client side
  if (typeof window === 'undefined') {
    logger.debug('Server-side rendering - skipping Firebase auth');
    return null;
  }

  // Check if Firebase is initialized
  if (!auth) {
    logger.error('Firebase auth not initialized - missing environment variables. See FIREBASE_SETUP.md');
    authInitialized = true;
    authEnabled = false;
    return null;
  }

  try {
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      logger.debug('User already authenticated', { uid: currentUser.uid });
      authInitialized = true;
      authEnabled = true;
      return currentUser;
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    logger.debug('Anonymous authentication successful', { uid: userCredential.user.uid });
    authInitialized = true;
    authEnabled = true;
    return userCredential.user;
  } catch (error) {
    const authError = error as { code?: string; message?: string };
    logger.error('Anonymous authentication failed', undefined, { code: authError.code || 'unknown', message: authError.message || 'Unknown error' });

    if (authError.code === 'auth/invalid-api-key') {
      logger.error('Invalid Firebase API key - check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local');
    } else if (authError.code === 'auth/admin-restricted-operation') {
      logger.warn('Anonymous Authentication not enabled in Firebase Console. Enable it at: Firebase Console → Authentication → Sign-in method → Anonymous. App will use mock data for now.');
    } else {
      logger.error('Authentication error', undefined, { message: authError.message || 'Unknown error', code: authError.code || 'unknown' });
    }

    authInitialized = true;
    authEnabled = false;
    return null;
  }
};

// Safe initialization wrapper
const safeInitializeAuth = async (): Promise<void> => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await initializeAuth();
  } catch (error) {
    logger.warn('Firebase authentication failed - falling back to mock data (degraded mode)', { error });
    authInitialized = true;
    authEnabled = false;
    authDegraded = true; // Mark auth as degraded
  }
};

// Set up auth state listener only if we're in the browser
if (typeof window !== 'undefined' && auth) {
  try {
    // Only set up the listener once
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        logger.debug('Auth state changed - User signed in', { uid: user.uid });
        authEnabled = true;
        authDegraded = false; // Clear degraded flag if auth recovers
      } else {
        logger.debug('Auth state changed - User signed out');
        authEnabled = false;
        // Don't try to sign in again if it's disabled
        // Note: authEnabled is now false, so we don't re-initialize on sign out
      }
    });

    // Initialize auth when the module is imported
    safeInitializeAuth();
  } catch (error) {
    logger.warn('Firebase auth listener failed - falling back to mock data (degraded mode)', { error });
    authInitialized = true;
    authEnabled = false;
    authDegraded = true; // Mark auth as degraded
  }
} else if (typeof window !== 'undefined' && !auth) {
  // Firebase not initialized - log warning
  logger.warn('Firebase not initialized - auth features disabled');
  authInitialized = true;
  authEnabled = false;
  authDegraded = true; // Mark auth as degraded (no Firebase available)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for Firebase to be fully initialized with persistence ready
 *
 * Call this before the first database access to ensure persistence is properly configured.
 * Example: await initFirebaseWithPersistence()
 */
export async function initFirebaseWithPersistence(): Promise<void> {
  if (!db) {
    throw new Error('Firebase not initialized - check environment variables');
  }

  // Wait for persistence to be ready
  await persistenceReady;
}

// Helper function to handle Firebase operations with error handling
export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T | null = null
): Promise<T | null> => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' ||
        (firebaseError.message && firebaseError.message.includes('Missing or insufficient permissions')) ||
        firebaseError.code === 'auth/admin-restricted-operation') {
      logger.error('Firebase permission error - enable Anonymous Auth and update Firestore security rules. Using fallback data.', undefined, {
        errorMessage: firebaseError.message || String(firebaseError)
      });
      return fallback;
    }
    throw error;
  }
};

// Check if authentication is available
export const isAuthEnabled = (): boolean => {
  // Always return false on server side
  if (typeof window === 'undefined') {
    return false;
  }
  return authEnabled;
};

// Check if authentication is in degraded mode (using mock data fallback)
// Components should check this to determine if auth is using real Firebase or fallback
export const isAuthDegraded = (): boolean => {
  // Always return false on server side
  if (typeof window === 'undefined') {
    return false;
  }
  return authDegraded;
};

// Export Firebase instances (may be null if not initialized)
export { db, app, auth, initializeAuth };
