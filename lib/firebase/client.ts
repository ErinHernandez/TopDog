'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Returns true when Firebase credentials are configured via env vars.
 * Used by pages to skip Firestore calls in dev mode.
 */
export function isFirebaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initialize and return the Firebase app instance.
 * Uses singleton pattern to avoid multiple initializations.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in your environment. ' +
        'In dev mode, pages should call isFirebaseConfigured() and skip Firestore operations.'
      );
    }
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

/**
 * Initialize and return Firebase Authentication instance.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/**
 * Initialize and return Firebase Firestore instance.
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

/**
 * Initialize and return Firebase Storage instance.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

/**
 * Export convenience re-exports for commonly used Firestore functions.
 * These are intentionally re-exported to simplify client-side imports.
 */
export { initializeApp, getApps } from 'firebase/app';
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
  serverTimestamp,
  Timestamp,
  type Query,
  type DocumentReference,
  type DocumentSnapshot,
  type QuerySnapshot,
  type WriteBatch,
  type Transaction,
} from 'firebase/firestore';
export {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
  type UploadResult,
} from 'firebase/storage';
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
