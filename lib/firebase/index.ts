/**
 * Firebase SDK loader with environment detection.
 * Exports appropriate SDK based on execution environment.
 *
 * Server-side (Node.js): Uses firebase-admin SDK
 * Client-side (Browser): Uses firebase SDK
 */

// Environment detection
const isServer = typeof window === 'undefined';

// Dynamic imports with proper async handling
let sdkPromise: Promise<any>;

if (isServer) {
  // Server-side exports (dynamic import)
  sdkPromise = import('./server');
} else {
  // Client-side exports (dynamic import)
  sdkPromise = import('./client');
}

// Export the SDK promise for async usage
export const getFirebaseSDK = () => sdkPromise;

// For TypeScript support, export both types
export type { Auth } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';
export type { FirebaseStorage } from 'firebase/storage';

// For client-side: lazy initialize and export storage reference
let storageInstance: any = null;

// Proxy-based lazy loading for storage to work on client-side
export const storage = new Proxy({} as any, {
  get: (target, prop) => {
    if (isServer) {
      throw new Error('Firebase storage cannot be accessed on the server side. Use getAdminStorage() from server.ts instead.');
    }
    if (!storageInstance) {
      // Dynamic require to avoid circular dependencies
      const clientModule = require('./client');
      storageInstance = clientModule.getFirebaseStorage();
    }
    return (storageInstance as any)[prop];
  },
});
