/**
 * API Authentication Middleware
 * 
 * Provides reusable authentication middleware for Next.js API routes.
 * Verifies Firebase Auth tokens and provides user context.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { serverLogger } from './logger/serverLogger';

// Use require for firebase-admin to ensure Turbopack compatibility
 
const admin = require('firebase-admin') as typeof import('firebase-admin');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Service account configuration
 */
interface ServiceAccount {
  project_id?: string;
  private_key?: string;
  client_email?: string;
  [key: string]: unknown;
}

/**
 * Result of token verification
 */
export interface AuthTokenResult {
  uid: string | null;
  email?: string;
  error?: string;
}

/**
 * User information attached to request
 */
export interface RequestUser {
  uid: string;
  email?: string;
}

/**
 * Extended Next.js request with user info
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user: RequestUser | null;
}

/**
 * API route handler function
 */
export type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Options for withAuth middleware
 */
export interface WithAuthOptions {
  /** Whether authentication is required (default: true) */
  required?: boolean;
  /** Whether to allow anonymous users (default: false) */
  allowAnonymous?: boolean;
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

let firebaseAdminInitialized = false;

if (admin.apps.length === 0) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as import('firebase-admin').ServiceAccount),
      });
      firebaseAdminInitialized = true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    serverLogger.warn(`Firebase Admin initialization failed for API auth: ${errorMessage}`);
  }
} else {
  firebaseAdminInitialized = true;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Verify Firebase Auth token and get user info
 * @param {string | undefined} authHeader - Authorization header (Bearer token)
 * @returns {Promise<AuthTokenResult>} User info or error
 */
export async function verifyAuthToken(authHeader: string | undefined): Promise<AuthTokenResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { uid: null, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // SECURITY: All dev token logic has been removed.
  // For local development, use Firebase Auth Emulator instead:
  // 1. Start Firebase emulators: `firebase emulators:start`
  // 2. Set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 in .env.local
  // 3. Use real Firebase tokens from emulator for API testing

  // Check if Firebase Admin was initialized successfully
  if (!firebaseAdminInitialized) {
    return { 
      uid: null, 
      error: 'Authentication service unavailable' 
    };
  }
  
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token!);
    
    return { 
      uid: decodedToken.uid, 
      email: decodedToken.email || undefined
    };
  } catch (error) {
    serverLogger.error('Token verification error', error instanceof Error ? error : new Error(String(error)));
    return { uid: null, error: 'Invalid or expired token' };
  }
}

/**
 * Authentication middleware for Next.js API routes
 * @param {ApiHandler} handler - API route handler
 * @param {WithAuthOptions} options - Middleware options
 * @returns {ApiHandler} Wrapped handler with authentication
 */
export function withAuth(
  handler: ApiHandler,
  options: WithAuthOptions = {}
): ApiHandler {
  const { required = true, allowAnonymous = false } = options;
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuthToken(authHeader);
    
    // Cast to AuthenticatedRequest to add user property
    const authenticatedReq = req as AuthenticatedRequest;
    
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
    authenticatedReq.user = authResult.uid ? {
      uid: authResult.uid,
      email: authResult.email,
    } : null;
    
    // Call the handler with authenticated request
    return handler(authenticatedReq, res);
  };
}

/**
 * Verify that the authenticated user matches the requested user ID
 * Prevents users from accessing other users' data
 * @param {string | null | undefined} authenticatedUserId - User ID from authentication
 * @param {string | null | undefined} requestedUserId - User ID from request
 * @returns {boolean} True if user IDs match
 */
export function verifyUserAccess(
  authenticatedUserId: string | null | undefined,
  requestedUserId: string | null | undefined
): boolean {
  if (!authenticatedUserId || !requestedUserId) {
    return false;
  }
  
  return authenticatedUserId === requestedUserId;
}

/**
 * Get client IP address from request
 * @param {NextApiRequest} req - Next.js request object
 * @returns {string} Client IP address
 */
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = (req.socket as { remoteAddress?: string })?.remoteAddress;
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return typeof forwarded === 'string'
      ? forwarded.split(',')[0]!.trim()
      : Array.isArray(forwarded) ? forwarded[0]! : String(forwarded);
  }
  
  if (realIP) {
    return typeof realIP === 'string' ? realIP : String(realIP);
  }

  return remoteAddress || 'unknown';
}

const apiAuthExports = {
  verifyAuthToken,
  withAuth,
  verifyUserAccess,
  getClientIP,
};

export default apiAuthExports;
