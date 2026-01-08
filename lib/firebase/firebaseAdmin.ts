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
if (!admin.apps.length) {
  if (!process.env.FIREBASE_ADMIN_SDK_KEY) {
    throw new Error('FIREBASE_ADMIN_SDK_KEY environment variable is required for server-side Firebase operations');
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

export const adminDb = admin.firestore();

