import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User } from 'firebase/auth';
import { logger } from './structuredLogger';

// SECURITY: Never hardcode credentials - always use environment variables
// In production, all environment variables must be set
interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

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
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
] as const;

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

// Only initialize Firebase if we have the minimum required config
// In development, we'll still try to initialize but it will fail gracefully
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Check if we have at least the API key and project ID (minimum required)
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = !getApps().length ? initializeApp(firebaseConfig as { [key: string]: string }) : getApps()[0];
    
    // Initialize Firestore with offline persistence enabled for better performance
    // This caches data locally and reduces network requests
    db = getFirestore(app);
    
    // Enable offline persistence (only on client side)
    if (typeof window !== 'undefined') {
      // Note: enableIndexedDbPersistence is async and may fail if another tab is open
      // We'll enable it silently - if it fails, Firebase will still work without persistence
      import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
        enableIndexedDbPersistence(db!).catch((err: { code?: string }) => {
          // Persistence can only be enabled in one tab at a time
          // If it fails, that's okay - Firebase will still work
          if (err.code === 'failed-precondition') {
            logger.debug('Firebase persistence already enabled in another tab', {
              component: 'firebase',
            });
          } else if (err.code === 'unimplemented') {
            logger.debug('Firebase persistence not available in this browser', {
              component: 'firebase',
            });
          }
          // Silently ignore other errors - offline persistence is optional
        });
      }).catch(() => {
        // If import fails, continue without persistence
      });
    }
    
    auth = getAuth(app);
    // Firebase initialized successfully - no need to log errors
  } else {
    // Only log error if Firebase actually fails to initialize and we haven't logged it yet
    const missingVars = checkMissingVars();
    
    if (isRealProductionRuntime) {
      // In actual production deployment, fail hard
      throw new Error(
        `CRITICAL: Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
        'All Firebase configuration must be provided via environment variables in production.\n' +
        'See FIREBASE_SETUP.md for instructions on setting up environment variables.'
      );
    } else if (process.env.NODE_ENV === 'development' && !hasLoggedConfigError && missingVars.length > 0) {
      // In development, warn but provide helpful instructions (only once to avoid HMR spam)
      // Only log if we're actually missing variables (they might be available later during HMR)
      hasLoggedConfigError = true;
      logger.error('MISSING FIREBASE ENVIRONMENT VARIABLES', undefined, {
        component: 'firebase',
        missingVars: missingVars.join(', '),
        instructions: [
          '1. Create a .env.local file in the project root',
          '2. Add your Firebase configuration (see FIREBASE_SETUP.md)',
          '3. Get your Firebase config from: https://console.firebase.google.com/',
          '4. Restart the development server',
        ],
        note: 'The app will not work without Firebase configuration. See FIREBASE_SETUP.md for detailed instructions.',
      });
    }
    
    // During local production builds (npm run build), just warn
    if (process.env.NODE_ENV === 'production' && !isRealProductionRuntime && !hasLoggedConfigError && missingVars.length > 0) {
      hasLoggedConfigError = true;
      logger.warn('Missing env vars during build - will fail at runtime if not provided', {
        component: 'firebase',
      });
    }
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('Firebase initialization error', error instanceof Error ? error : undefined, {
    component: 'firebase',
    message: errorMessage,
  });
  if (process.env.NODE_ENV === 'development') {
    logger.warn('The app will continue but Firebase features will not work', {
      component: 'firebase',
      note: 'Please set up your Firebase environment variables (see FIREBASE_SETUP.md)',
    });
  } else {
    throw error; // Re-throw in production
  }
}

// Track authentication status
let authInitialized = false;
let authEnabled = false;

interface FirebaseAuthError extends Error {
  code?: string;
  message: string;
}

// Initialize anonymous authentication for development
const initializeAuth = async (): Promise<User | null> => {
  // Only run on client side
  if (typeof window === 'undefined') {
    logger.debug('Server-side rendering - skipping Firebase auth', {
      component: 'firebase',
    });
    return null;
  }

  // Check if Firebase is initialized
  if (!auth) {
    logger.error('Firebase auth not initialized - missing environment variables', undefined, {
      component: 'firebase',
      note: 'Please set up your Firebase configuration (see FIREBASE_SETUP.md)',
    });
    authInitialized = true;
    authEnabled = false;
    return null;
  }

  try {
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      logger.debug('User already authenticated', {
        component: 'firebase',
        userId: currentUser.uid,
      });
      authInitialized = true;
      authEnabled = true;
      return currentUser;
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    logger.info('Anonymous authentication successful', {
      component: 'firebase',
      userId: userCredential.user.uid,
    });
    authInitialized = true;
    authEnabled = true;
    return userCredential.user;
  } catch (error) {
    const authError = error as FirebaseAuthError;
    logger.error('Anonymous authentication failed', authError instanceof Error ? authError : undefined, {
      component: 'firebase',
      errorCode: authError.code,
    });
    
    if (authError.code === 'auth/invalid-api-key') {
      logger.error('Invalid Firebase API key', undefined, {
        component: 'firebase',
        note: 'Please check your NEXT_PUBLIC_FIREBASE_API_KEY in .env.local',
        instructions: 'Get your API key from: https://console.firebase.google.com/ → Project Settings → General',
      });
    } else if (authError.code === 'auth/admin-restricted-operation') {
      logger.warn('Anonymous Authentication is not enabled in Firebase Console', {
        component: 'firebase',
        instructions: [
          '1. Go to https://console.firebase.google.com/',
          '2. Select your project',
          '3. Click "Authentication" → "Sign-in method"',
          '4. Enable "Anonymous" authentication',
          '5. Click "Save"',
        ],
        note: 'The app will continue to work with mock data for now',
      });
    } else {
      logger.error('Authentication error', authError instanceof Error ? authError : undefined, {
        component: 'firebase',
        errorCode: authError.code,
        errorMessage: authError.message,
      });
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
    logger.warn('Firebase authentication disabled - using mock data', {
      component: 'firebase',
    });
    authInitialized = true;
    authEnabled = false;
  }
};

// Set up auth state listener only if we're in the browser
if (typeof window !== 'undefined' && auth) {
  try {
    // Only set up the listener once
    onAuthStateChanged(auth, (user) => {
      if (user) {
        logger.debug('Auth state changed - User signed in', {
          component: 'firebase',
          userId: user.uid,
        });
        authEnabled = true;
      } else {
        logger.debug('Auth state changed - User signed out', {
          component: 'firebase',
        });
        authEnabled = false;
        // Don't try to sign in again if it's disabled
        // Note: authEnabled is now false, so we don't re-initialize on sign out
      }
    });

    // Initialize auth when the module is imported
    safeInitializeAuth();
  } catch (error) {
    logger.warn('Firebase auth listener failed - using mock data', {
      component: 'firebase',
    });
    authInitialized = true;
    authEnabled = false;
  }
} else if (typeof window !== 'undefined' && !auth) {
  // Firebase not initialized - log warning
  logger.error('Firebase not initialized - auth features disabled', undefined, {
    component: 'firebase',
  });
  authInitialized = true;
  authEnabled = false;
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
    const fbError = error as FirebaseAuthError;
    if (fbError.code === 'permission-denied' || 
        (fbError.message && fbError.message.includes('Missing or insufficient permissions')) ||
        fbError.code === 'auth/admin-restricted-operation') {
      logger.error('Firebase permission error', fbError instanceof Error ? fbError : undefined, {
        component: 'firebase',
        errorCode: fbError.code,
        instructions: [
          '1. Enable Anonymous Authentication in Firebase Console',
          '2. Update Firestore security rules to allow read/write',
          '3. Use the rules from firestore.rules file',
        ],
        note: 'Using fallback data for now',
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

// Export Firebase instances (may be null if not initialized)
export { db, app, auth, initializeAuth };
