/**
 * Admin Authentication Utility
 * 
 * Provides secure admin verification using Firebase Admin SDK
 * and custom claims.
 */

import { logger } from './structuredLogger';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');

// ============================================================================
// Types
// ============================================================================

export interface AdminVerificationResult {
  isAdmin: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

interface ServiceAccount {
  project_id?: string;
  private_key?: string;
  client_email?: string;
  [key: string]: unknown;
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
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
    
    if (serviceAccount.project_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
      firebaseAdminInitialized = true;
    } else {
      firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }
  } catch (error) {
    firebaseAdminInitError = error instanceof Error ? error : new Error(String(error));
    logger.warn('Firebase Admin initialization failed', {
      error: firebaseAdminInitError.message,
    });
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
 * 
 * @param authHeader - Authorization header (Bearer token)
 * @returns Promise with admin verification result
 */
export async function verifyAdminAccess(authHeader: string | undefined): Promise<AdminVerificationResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Development fallback (only in development mode)
  // CRITICAL: This MUST be disabled in production - never allow in production builds
  if (process.env.NODE_ENV === 'production') {
    // Explicitly reject dev admin tokens in production
    if (token === 'dev-admin-token') {
      logger.error('[Security] Dev admin token attempted in production', undefined, {
        component: 'adminAuth',
      });
      return { isAdmin: false, error: 'Invalid authentication token' };
    }
  }
  
  if (process.env.NODE_ENV === 'development' && token === 'dev-admin-token') {
    logger.warn('[AdminAuth] Using development admin token - NOT FOR PRODUCTION', {
      component: 'adminAuth',
    });
    return { isAdmin: true, uid: 'dev-admin', email: 'admin@dev.local' };
  }
  
  // Check if Firebase Admin is initialized
  if (!firebaseAdminInitialized) {
    logger.error('Firebase Admin not initialized', undefined, {
      component: 'adminAuth',
      error: firebaseAdminInitError?.message,
    });
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
    // NOTE: This fallback should be removed after migration is complete and verified
    // Migration script: scripts/migrate-admin-claims.js
    // Verification endpoint: /api/admin/verify-claims
    const adminUidsEnv = process.env.ADMIN_UIDS || '';
    const adminUids = adminUidsEnv
      .split(',')
      .map(uid => uid.trim())
      .filter(Boolean);
    
    if (adminUids.length > 0 && adminUids.includes(decodedToken.uid)) {
      // Log warning with migration instructions
      logger.warn('DEPRECATED: Using UID-based admin check', {
        component: 'adminAuth',
        uid: decodedToken.uid,
        migrationNote: 'Migrate to custom claims using scripts/migrate-admin-claims.js',
      });
      return { 
        isAdmin: true, 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      };
    }
    
    return { isAdmin: false, error: 'User is not an admin' };
    
  } catch (error) {
    logger.error('Token verification error', error instanceof Error ? error : undefined, {
      component: 'adminAuth',
    });
    return { isAdmin: false, error: 'Invalid or expired token' };
  }
}

/**
 * Verify admin access from client-side (for React components)
 * This should call a server-side API endpoint that uses verifyAdminAccess
 * 
 * @param authToken - Firebase auth token (from getIdToken())
 * @returns Promise resolving to boolean indicating admin status
 */
export async function verifyAdminAccessClient(authToken: string | null | undefined): Promise<boolean> {
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
    logger.error('Client verification error', error instanceof Error ? error : undefined, {
      component: 'adminAuth',
      context: 'client',
    });
    return false;
  }
}

/**
 * Helper to get auth token (should be implemented by auth context)
 * This is a placeholder - actual implementation depends on your auth system
 * 
 * @returns Promise resolving to auth token or null
 */
async function getAuthToken(): Promise<string | null> {
  // This should get the current user's auth token
  // Implementation depends on your auth context
  if (typeof window !== 'undefined') {
    // Client-side: get from auth context
    // return authContext.getToken();
    throw new Error('getAuthToken must be implemented with your auth system');
  }
  return null;
}

/**
 * Check if Firebase Admin is properly initialized
 * 
 * @returns boolean indicating if admin auth is available
 */
export function isAdminAuthAvailable(): boolean {
  return firebaseAdminInitialized;
}
