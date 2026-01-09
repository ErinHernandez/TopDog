/**
 * Firebase Admin SDK
 * 
 * Server-side Firebase Admin SDK for API routes.
 * Provides adminDb for server-side Firestore operations.
 * 
 * NOTE: This file should ONLY be imported in server-side code (API routes, server components).
 * It uses firebase-admin which is not available in the browser.
 */

// Only import firebase-admin on the server
// @ts-ignore - firebase-admin types may not be available during build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
// Uses FIREBASE_SERVICE_ACCOUNT environment variable (standardized across all firebase-admin usage)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Don't throw during build - gracefully handle missing config
      // This allows the app to build even if service account isn't available
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
        console.error('FIREBASE_SERVICE_ACCOUNT environment variable is required for server-side Firebase operations');
      }
    }
  } catch (error) {
    // Don't throw during build - gracefully handle parse errors
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
  }
}

export const adminDb = admin.firestore();

