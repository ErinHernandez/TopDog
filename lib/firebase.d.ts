/**
 * TypeScript declarations for Firebase exports
 * 
 * This file provides type definitions for exports from lib/firebase.js
 * to fix implicit 'any' type errors when importing db, app, auth, etc.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase Firestore database instance
 * May be null if Firebase is not initialized
 */
export const db: Firestore | null;

/**
 * Firebase app instance
 * May be null if Firebase is not initialized
 */
export const app: FirebaseApp | null;

/**
 * Firebase Auth instance
 * May be null if Firebase is not initialized
 */
export const auth: Auth | null;

/**
 * Initialize Firebase Auth (if not already initialized)
 */
export function initializeAuth(): void;
