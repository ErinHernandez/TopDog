/**
 * Firebase Utilities
 * 
 * Helper functions for safely using Firebase db with null checks
 */

import type { Firestore } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get Firebase db instance, throwing if not initialized
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase db not initialized. Check your Firebase configuration.');
  }
  return db;
}
