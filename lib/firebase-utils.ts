/**
 * Firebase Utilities
 *
 * Helper functions for safely using Firebase db with null checks.
 *
 * Firestore policy: All collection reads (getDocs) must be bounded—use limit()
 * or query a known-bounded subcollection (e.g. draftRooms/{id}/picks). Run
 * lint:firestore (or equivalent) in CI to enforce.
 */

import type { Firestore } from 'firebase/firestore';

import { db } from './firebase';

/**
 * Get the initialized Firebase Firestore database instance.
 * Throws an error if Firebase is not properly initialized.
 *
 * @returns {Firestore} The Firebase Firestore database instance
 * @throws {Error} If Firebase db is not initialized
 * @example
 * const database = getDb();
 * const usersRef = collection(database, 'users');
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase db not initialized. Check your Firebase configuration.');
  }
  return db;
}
