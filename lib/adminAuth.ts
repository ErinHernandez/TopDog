/**
 * Admin Authentication Utility
 * 
 * Provides secure admin verification using Firebase Admin SDK
 * and custom claims.
 */

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminVerificationResult {
  isAdmin: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

interface DecodedToken {
  uid: string;
  email?: string;
  admin?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

let firebaseAdminInitialized = false;
let firebaseAdminInitError: Error | null = null;

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    } else {
      const serviceAccount = JSON.parse(serviceAccountEnv) as import('firebase-admin').ServiceAccount;
      if (serviceAccount.projectId) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
      } else {
        firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT not configured');
      }
    }
  } catch (error) {
    firebaseAdminInitError = error instanceof Error ? error : new Error(String(error));
    serverLogger.warn('Firebase Admin initialization failed');
  }
} else {
  firebaseAdminInitialized = true;
}

// ============================================================================
// ADMIN VERIFICATION
// ============================================================================

/**
 * Verify if a user is an admin using Firebase Auth token
 * Uses custom claims as the primary method (recommended)
 * Falls back to environment variable UID list only if custom claims not available
 */
export async function verifyAdminAccess(
  authHeader: string | undefined
): Promise<AdminVerificationResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // SECURITY: All dev admin token logic has been removed.
  // For local development admin testing:
  // 1. Start Firebase emulators: `firebase emulators:start`
  // 2. Set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 in .env.local
  // 3. Use: npx ts-node scripts/set-admin-claim.ts <your-test-uid>
  // 4. Use real Firebase tokens from emulator for API testing

  // Check if Firebase Admin is initialized
  if (!firebaseAdminInitialized) {
    serverLogger.error('Firebase Admin not initialized', firebaseAdminInitError || new Error('Unknown initialization error'));
    return {
      isAdmin: false,
      error: firebaseAdminInitError?.message || 'Admin authentication service unavailable'
    };
  }
  
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token) as DecodedToken;
    
    // PRIMARY METHOD: Check admin status via custom claim (recommended)
    // Custom claims are set via Firebase Admin SDK and are the secure way to manage admins
    if (decodedToken.admin === true) {
      return { 
        isAdmin: true, 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      };
    }
    
    // FALLBACK: Check against admin UIDs list from environment variable
    // This is a fallback for migration period - custom claims should be preferred
    // NOTE: This fallback will be DISABLED after the deprecation date
    // Migration script: scripts/migrate-admin-claims.js
    // Verification endpoint: /api/admin/verify-claims
    const ADMIN_UIDS_DEPRECATION_DATE = new Date('2026-02-15T00:00:00Z');
    const now = new Date();

    const adminUidsEnv = process.env.ADMIN_UIDS;
    const adminUids = (adminUidsEnv?.split(',') || [])
      .map(uid => uid.trim())
      .filter(Boolean);

    if (adminUids.length > 0 && adminUids.includes(decodedToken.uid)) {
      // After deprecation date, completely disable ADMIN_UIDS
      if (now >= ADMIN_UIDS_DEPRECATION_DATE) {
        serverLogger.error('ADMIN_UIDS is deprecated and disabled', null, {
          uid: decodedToken.uid,
          deprecationDate: ADMIN_UIDS_DEPRECATION_DATE.toISOString(),
          action: 'User must be migrated to Firebase custom claims'
        });
        return {
          isAdmin: false,
          uid: decodedToken.uid,
          error: 'ADMIN_UIDS authentication is deprecated. Contact support to migrate to Firebase custom claims.'
        };
      }

      // Before deprecation date, allow with strong warning
      const daysUntilDeprecation = Math.ceil(
        (ADMIN_UIDS_DEPRECATION_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      serverLogger.warn('DEPRECATED: Using UID-based admin check', null, {
        uid: decodedToken.uid,
        daysUntilDeprecation,
        deprecationDate: ADMIN_UIDS_DEPRECATION_DATE.toISOString(),
        action: 'Migrate to custom claims using: npx ts-node scripts/set-admin-claim.ts ' + decodedToken.uid
      });

      return {
        isAdmin: true,
        uid: decodedToken.uid,
        email: decodedToken.email
      };
    }
    
    return { isAdmin: false, error: 'User is not an admin' };
    
  } catch (error) {
    serverLogger.error('Token verification error', error instanceof Error ? error : new Error(String(error)));
    return { isAdmin: false, error: 'Invalid or expired token' };
  }
}

/**
 * Verify admin access from client-side (for React components)
 * This should call a server-side API endpoint that uses verifyAdminAccess
 */
export async function verifyAdminAccessClient(authToken: string): Promise<boolean> {
  if (!authToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/auth/verify-admin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json() as { isAdmin?: boolean };
    return data.isAdmin === true;
  } catch (error) {
    serverLogger.error('Client verification error', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Check if Firebase Admin is properly initialized
 */
export function isAdminAuthAvailable(): boolean {
  return firebaseAdminInitialized;
}
