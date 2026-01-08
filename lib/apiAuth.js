/**
 * API Authentication Middleware
 * 
 * Provides reusable authentication middleware for Next.js API routes.
 * Verifies Firebase Auth tokens and provides user context.
 */

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

let firebaseAdminInitialized = false;

if (admin.apps.length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseAdminInitialized = true;
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed for API auth:', error.message);
  }
} else {
  firebaseAdminInitialized = true;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Verify Firebase Auth token and get user info
 * @param {string} authHeader - Authorization header (Bearer token)
 * @returns {Promise<{ uid: string | null, email?: string, error?: string }>}
 */
export async function verifyAuthToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { uid: null, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Development fallback (only in development mode)
  // CRITICAL: This MUST be disabled in production - never allow in production builds
  if (process.env.NODE_ENV === 'production') {
    // Explicitly reject dev tokens in production
    if (token === 'dev-token') {
      console.error('[Security] Dev token attempted in production');
      return { uid: null, error: 'Invalid authentication token' };
    }
  }
  
  if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
    return { uid: 'dev-uid', email: 'dev@example.com' };
  }
  
  // Check if Firebase Admin was initialized successfully
  if (!firebaseAdminInitialized) {
    return { 
      uid: null, 
      error: 'Authentication service unavailable' 
    };
  }
  
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return { 
      uid: decodedToken.uid, 
      email: decodedToken.email 
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { uid: null, error: 'Invalid or expired token' };
  }
}

/**
 * Authentication middleware for Next.js API routes
 * @param {Function} handler - API route handler
 * @param {Object} options - Middleware options
 * @param {boolean} options.required - Whether authentication is required (default: true)
 * @param {boolean} options.allowAnonymous - Whether to allow anonymous users (default: false)
 * @returns {Function} Wrapped handler with authentication
 */
export function withAuth(handler, options = {}) {
  const { required = true, allowAnonymous = false } = options;
  
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuthToken(authHeader);
    
    // If authentication is required and user is not authenticated
    if (required && !authResult.uid) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: authResult.error || 'Authentication required'
      });
    }
    
    // If anonymous users are not allowed and user is not authenticated
    if (!allowAnonymous && !authResult.uid) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    
    // Add user info to request object for handler to use
    req.user = authResult.uid ? {
      uid: authResult.uid,
      email: authResult.email,
    } : null;
    
    // Call the handler with authenticated request
    return handler(req, res);
  };
}

/**
 * Verify that the authenticated user matches the requested user ID
 * Prevents users from accessing other users' data
 * @param {string} authenticatedUserId - User ID from authentication
 * @param {string} requestedUserId - User ID from request
 * @returns {boolean} True if user IDs match
 */
export function verifyUserAccess(authenticatedUserId, requestedUserId) {
  if (!authenticatedUserId || !requestedUserId) {
    return false;
  }
  
  return authenticatedUserId === requestedUserId;
}

/**
 * Get client IP address from request
 * @param {Object} req - Next.js request object
 * @returns {string} Client IP address
 */
export function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.socket?.remoteAddress;
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim()
      : forwarded[0];
  }
  
  if (realIP) {
    return realIP;
  }
  
  return remoteAddress || 'unknown';
}

export default {
  verifyAuthToken,
  withAuth,
  verifyUserAccess,
  getClientIP,
};

