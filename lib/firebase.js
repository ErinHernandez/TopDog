import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// SECURITY: Never hardcode credentials - always use environment variables
// In production, all environment variables must be set
const firebaseConfig = {
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
];

// Helper to check for missing vars (lazy evaluation to avoid HMR noise)
const checkMissingVars = () => {
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
let app = null;
let db = null;
let auth = null;

try {
  // Check if we have at least the API key and project ID (minimum required)
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Firestore with offline persistence enabled for better performance
    // This caches data locally and reduces network requests
    db = getFirestore(app);
    
    // Enable offline persistence (only on client side)
    if (typeof window !== 'undefined') {
      // Note: enableIndexedDbPersistence is async and may fail if another tab is open
      // We'll enable it silently - if it fails, Firebase will still work without persistence
      import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
        enableIndexedDbPersistence(db).catch((err) => {
          // Persistence can only be enabled in one tab at a time
          // If it fails, that's okay - Firebase will still work
          if (err.code === 'failed-precondition') {
            console.log('Firebase persistence already enabled in another tab');
          } else if (err.code === 'unimplemented') {
            console.log('Firebase persistence not available in this browser');
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
      console.error('MISSING FIREBASE ENVIRONMENT VARIABLES');
      console.error('Missing variables:', missingVars.join(', '));
      console.error('');
      console.error('To fix this:');
      console.error('   1. Create a .env.local file in the project root');
      console.error('   2. Add your Firebase configuration (see FIREBASE_SETUP.md)');
      console.error('   3. Get your Firebase config from: https://console.firebase.google.com/');
      console.error('   4. Restart the development server');
      console.error('');
      console.error('The app will not work without Firebase configuration.');
      console.error('See FIREBASE_SETUP.md for detailed instructions.');
    }
    
    // During local production builds (npm run build), just warn
    if (process.env.NODE_ENV === 'production' && !isRealProductionRuntime && !hasLoggedConfigError && missingVars.length > 0) {
      hasLoggedConfigError = true;
      console.warn('[Firebase] Missing env vars during build - will fail at runtime if not provided');
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('⚠️  The app will continue but Firebase features will not work.');
    console.error('Please set up your Firebase environment variables (see FIREBASE_SETUP.md)');
  } else {
    throw error; // Re-throw in production
  }
}

// Track authentication status
let authInitialized = false;
let authEnabled = false;

// Initialize anonymous authentication for development
const initializeAuth = async () => {
  // Only run on client side
  if (typeof window === 'undefined') {
    console.log('🔄 Server-side rendering - skipping Firebase auth');
    return null;
  }

  // Check if Firebase is initialized
  if (!auth) {
    console.error('❌ Firebase auth not initialized - missing environment variables');
    console.error('Please set up your Firebase configuration (see FIREBASE_SETUP.md)');
    authInitialized = true;
    authEnabled = false;
    return null;
  }

  try {
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('User already authenticated:', currentUser.uid);
      authInitialized = true;
      authEnabled = true;
      return currentUser;
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous authentication successful:', userCredential.user.uid);
    authInitialized = true;
    authEnabled = true;
    return userCredential.user;
  } catch (error) {
    console.error('Anonymous authentication failed:', error);
    
    if (error.code === 'auth/invalid-api-key') {
      console.error('❌ Invalid Firebase API key');
      console.error('Please check your NEXT_PUBLIC_FIREBASE_API_KEY in .env.local');
      console.error('Get your API key from: https://console.firebase.google.com/ → Project Settings → General');
    } else if (error.code === 'auth/admin-restricted-operation') {
      console.log('⚠️  Anonymous Authentication is not enabled in Firebase Console');
      console.log('📋 To enable it:');
      console.log('   1. Go to https://console.firebase.google.com/');
      console.log('   2. Select your project');
      console.log('   3. Click "Authentication" → "Sign-in method"');
      console.log('   4. Enable "Anonymous" authentication');
      console.log('   5. Click "Save"');
      console.log('');
      console.log('🔄 The app will continue to work with mock data for now');
    } else {
      console.log('❌ Authentication error:', error.message);
      console.log('Error code:', error.code);
    }
    
    authInitialized = true;
    authEnabled = false;
    return null;
  }
};

// Safe initialization wrapper
const safeInitializeAuth = async () => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await initializeAuth();
  } catch (error) {
    console.log('🔄 Firebase authentication disabled - using mock data');
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
        console.log('Auth state changed - User signed in:', user.uid);
        authEnabled = true;
      } else {
        console.log('Auth state changed - User signed out');
        authEnabled = false;
        // Don't try to sign in again if it's disabled
        // Note: authEnabled is now false, so we don't re-initialize on sign out
      }
    });

    // Initialize auth when the module is imported
    safeInitializeAuth();
  } catch (error) {
    console.log('🔄 Firebase auth listener failed - using mock data');
    authInitialized = true;
    authEnabled = false;
  }
} else if (typeof window !== 'undefined' && !auth) {
  // Firebase not initialized - log warning
  console.error('⚠️  Firebase not initialized - auth features disabled');
  authInitialized = true;
  authEnabled = false;
}

// Helper function to handle Firebase operations with error handling
export const safeFirebaseOperation = async (operation, fallback = null) => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    if (error.code === 'permission-denied' || 
        (error.message && error.message.includes('Missing or insufficient permissions')) ||
        error.code === 'auth/admin-restricted-operation') {
      console.error('Firebase permission error:', error.message || error);
      console.log('📋 To fix this:');
      console.log('   1. Enable Anonymous Authentication in Firebase Console');
      console.log('   2. Update Firestore security rules to allow read/write');
      console.log('   3. Use the rules from firestore.rules file');
      console.log('');
      console.log('🔄 Using fallback data for now');
      return fallback;
    }
    throw error;
  }
};

// Check if authentication is available
export const isAuthEnabled = () => {
  // Always return false on server side
  if (typeof window === 'undefined') {
    return false;
  }
  return authEnabled;
};

// Export Firebase instances (may be null if not initialized)
export { db, app, auth, initializeAuth }; 