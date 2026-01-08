/**
 * Admin Authentication Utility
 * 
 * Provides secure admin verification using Firebase Admin SDK
 * and custom claims.
 */

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

let firebaseAdminInitialized = false;
let firebaseAdminInitError = null;

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseAdminInitialized = true;
    } else {
      firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }
  } catch (error) {
    firebaseAdminInitError = error;
    console.warn('Firebase Admin initialization failed:', error.message);
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
 * @param {string} authHeader - Authorization header (Bearer token)
 * @returns {Promise<{ isAdmin: boolean, uid?: string, email?: string, error?: string }>}
 */
export async function verifyAdminAccess(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Development fallback (only in development mode)
  // CRITICAL: This MUST be disabled in production - never allow in production builds
  if (process.env.NODE_ENV === 'production') {
    // Explicitly reject dev admin tokens in production
    if (token === 'dev-admin-token') {
      console.error('[Security] Dev admin token attempted in production');
      return { isAdmin: false, error: 'Invalid authentication token' };
    }
  }
  
  if (process.env.NODE_ENV === 'development' && token === 'dev-admin-token') {
    console.warn('[AdminAuth] Using development admin token - NOT FOR PRODUCTION');
    return { isAdmin: true, uid: 'dev-admin', email: 'admin@dev.local' };
  }
  
  // Check if Firebase Admin is initialized
  if (!firebaseAdminInitialized) {
    console.error('[AdminAuth] Firebase Admin not initialized');
    return { 
      isAdmin: false, 
      error: firebaseAdminInitError?.message || 'Admin authentication service unavailable' 
    };
  }
  
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
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
    // TODO: Remove this fallback once all admins have custom claims set
    const adminUids = (process.env.ADMIN_UIDS?.split(',') || [])
      .map(uid => uid.trim())
      .filter(Boolean);
    
    if (adminUids.length > 0 && adminUids.includes(decodedToken.uid)) {
      console.warn(`[AdminAuth] Using UID-based admin check for ${decodedToken.uid} - consider setting custom claim`);
      return { 
        isAdmin: true, 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      };
    }
    
    return { isAdmin: false, error: 'User is not an admin' };
    
  } catch (error) {
    console.error('[AdminAuth] Token verification error:', error);
    return { isAdmin: false, error: 'Invalid or expired token' };
  }
}

/**
 * Verify admin access from client-side (for React components)
 * This should call a server-side API endpoint that uses verifyAdminAccess
 * @param {string} authToken - Firebase auth token (from getIdToken())
 * @returns {Promise<boolean>}
 */
export async function verifyAdminAccessClient(authToken) {
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
    
    const data = await response.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error('[AdminAuth] Client verification error:', error);
    return false;
  }
}

/**
 * Helper to get auth token (should be implemented by auth context)
 * This is a placeholder - actual implementation depends on your auth system
 */
async function getAuthToken() {
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
 */
export function isAdminAuthAvailable() {
  return firebaseAdminInitialized;
}

