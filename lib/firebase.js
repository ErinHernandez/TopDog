import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD3FtIzbb1HwEa1juMYk1XSWB4tvbd6oBg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "topdog-e9d48.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "topdog-e9d48",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "topdog-e9d48.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "410904939799",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:410904939799:web:352b9748425c9274f3fb52",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-86BL4QJX5K"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

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
    
    if (error.code === 'auth/admin-restricted-operation') {
      console.log('⚠️  Anonymous Authentication is not enabled in Firebase Console');
      console.log('📋 To enable it:');
      console.log('   1. Go to https://console.firebase.google.com/');
      console.log('   2. Select your project: topdog-e9d48');
      console.log('   3. Click "Authentication" → "Sign-in method"');
      console.log('   4. Enable "Anonymous" authentication');
      console.log('   5. Click "Save"');
      console.log('');
      console.log('🔄 The app will continue to work with mock data for now');
    } else {
      console.log('❌ Authentication error:', error.message);
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
if (typeof window !== 'undefined') {
  try {
    // Only set up the listener once
    const authStateUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Auth state changed - User signed in:', user.uid);
        authEnabled = true;
      } else {
        console.log('Auth state changed - User signed out');
        authEnabled = false;
        // Don't try to sign in again if it's disabled
        if (authInitialized && authEnabled) {
          safeInitializeAuth();
        }
      }
    });

    // Initialize auth when the module is imported
    safeInitializeAuth();
  } catch (error) {
    console.log('🔄 Firebase auth listener failed - using mock data');
    authInitialized = true;
    authEnabled = false;
  }
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
        error.message.includes('Missing or insufficient permissions') ||
        error.code === 'auth/admin-restricted-operation') {
      console.error('Firebase permission error:', error.message);
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

export { db, app, auth, initializeAuth }; 