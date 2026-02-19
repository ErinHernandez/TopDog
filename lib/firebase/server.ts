import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let app: App | null = null;

/**
 * Initialize and return the Firebase Admin app instance.
 * Uses singleton pattern to avoid multiple initializations.
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
 * environment variables to be set.
 */
function getAdminApp(): App {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
      }

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }
  return app;
}

/**
 * Get Firebase Admin Auth instance.
 * Used for server-side authentication operations like token verification.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Get Firebase Admin Firestore instance.
 * Used for server-side database operations with admin privileges.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Get Firebase Admin Storage instance.
 * Used for server-side file storage operations with admin privileges.
 */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

/**
 * Export convenience re-exports for commonly used Admin SDK functions.
 */
export {
  getApps,
  type App,
} from 'firebase-admin/app';
export {
  type Auth,
} from 'firebase-admin/auth';
export {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endAt,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  type Query,
  type DocumentReference,
  type DocumentSnapshot,
  type QuerySnapshot,
  type WriteBatch,
  type Transaction,
} from 'firebase-admin/firestore';
export {
  type Storage,
} from 'firebase-admin/storage';
