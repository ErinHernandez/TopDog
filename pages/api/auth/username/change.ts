/**
 * API Route: Change Username
 * 
 * POST /api/auth/username/change
 * 
 * Changes a user's username with cooldown enforcement.
 * Requires authentication and respects cooldown periods.
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/auth/username/change', {
 *   method: 'POST',
 *   headers: { 
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <token>'
 *   },
 *   body: JSON.stringify({
 *     newUsername: 'newusername',
 *     countryCode: 'US'
 *   })
 * });
 * ```
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  collection, 
  doc, 
  getDoc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { withCSRFProtection } from '../../../../lib/csrfProtection';
import { logAuthSuccess, logAuthFailure, getClientIP } from '../../../../lib/securityLogger';
import { validateUsername, checkUsernameAvailability } from '../../../../lib/usernameValidation';
import { usernameChangePolicy } from '../../../../lib/usernameChangePolicy';
import { createSignupLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  type ApiHandler,
} from '../../../../lib/apiErrorHandler';
import { verifyAuthToken } from '../../../../lib/apiAuth';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');

// ============================================================================
// TYPES
// ============================================================================

interface ChangeUsernameRequest {
  newUsername: string;
  countryCode?: string;
}

interface ChangeUsernameResponse {
  success: boolean;
  message: string;
  username?: string;
  previousUsername?: string;
  cooldownInfo?: {
    cooldownDays: number;
    retryAfterDate?: string;
  };
  error?: string;
  retryAfter?: number;
  retryAfterDays?: number;
  retryAfterDate?: string;
  errors?: string[];
  suggestions?: string[];
}

interface AuthResult {
  uid: string | null;
  error?: string;
}

interface CooldownCheck {
  allowed: boolean;
  reason?: string;
  retryAfterDays?: number;
  retryAfterDate?: Date;
}

interface CooldownInfo {
  cooldownDays: number;
  retryAfterDate?: Date;
}

interface UsernameDocument {
  uid: string | null;
  username: string;
  previousOwner?: string;
  recycledAt?: { toMillis?: () => number } | number | null;
  createdAt?: { toMillis?: () => number } | Date;
}

interface UserDocument {
  username: string;
  usernameChangeCount?: number;
  previousUsername?: string;
  lastUsernameChange?: { toMillis?: () => number } | Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Minimum response time to prevent timing attacks (milliseconds)
const MIN_RESPONSE_TIME_MS = 150;

// Username recycling cooldown (90 days)
const RECYCLING_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Track Firebase Admin initialization status
let firebaseAdminInitialized = false;
let firebaseAdminInitError: Error | null = null;

// Initialize Firebase Admin (for verifying tokens)
if (admin.apps.length === 0) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
      logger.error('Firebase Admin initialization failed', firebaseAdminInitError, {
        component: 'auth',
        operation: 'firebase-admin-init',
      });
    } else {
      const serviceAccountRaw = JSON.parse(serviceAccountEnv) as { project_id?: string; projectId?: string };
      const serviceAccount: import('firebase-admin').ServiceAccount = {
        ...serviceAccountRaw,
        projectId: serviceAccountRaw.projectId || serviceAccountRaw.project_id
      };
      if (!serviceAccount.projectId) {
        firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id');
        logger.error('Firebase Admin initialization failed', firebaseAdminInitError, {
          component: 'auth',
          operation: 'firebase-admin-init',
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
      }
    }
  } catch (error) {
    firebaseAdminInitError = error instanceof Error ? error : new Error(String(error));
    logger.error('Firebase Admin initialization failed', firebaseAdminInitError, {
      component: 'auth',
      operation: 'firebase-admin-init',
    });
  }
} else {
  // Admin app already exists
  firebaseAdminInitialized = true;
}

// Create rate limiter
const rateLimiter = createSignupLimiter();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verify authentication token and get user UID
 */
async function verifyAuth(authHeader: string | undefined): Promise<AuthResult> {
  return verifyAuthToken(authHeader);
}

// ============================================================================
// HANDLER
// ============================================================================

const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse<ChangeUsernameResponse>
) {
  const startTime = Date.now(); // Track start time for timing attack prevention
  const clientIP = getClientIP(req);
  
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    res.setHeader('X-RateLimit-Limit', '3');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());
    
    if (!rateLimitResult.allowed) {
      // Ensure consistent timing even for rate-limited requests to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000) },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: errorResponse.body.error.message,
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000),
      });
    }
    
    // Step 1: Verify authentication
    const authResult = await verifyAuth(req.headers.authorization);
    if (!authResult.uid) {
      // Log authentication failure
      await logAuthFailure(null, clientIP, authResult.error || 'Missing or invalid token', {
        endpoint: '/api/auth/username/change',
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        authResult.error || 'Authentication required',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: errorResponse.body.error.message,
      });
    }
    
    // Validate required body fields
    validateBody(req, ['newUsername'], logger);
    
    const { newUsername, countryCode = 'US' } = req.body as ChangeUsernameRequest;
    
    logger.info('Processing username change', {
      component: 'auth',
      operation: 'username-change',
      userId: authResult.uid,
      newUsername,
    });
    
    // Step 3: Check cooldown policy
    const canChange = await usernameChangePolicy.canChangeUsername(authResult.uid) as CooldownCheck;
    if (!canChange.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        canChange.reason || 'Username change cooldown is active',
        {
          retryAfterDays: canChange.retryAfterDays,
          retryAfterDate: canChange.retryAfterDate?.toISOString(),
        },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'COOLDOWN_ACTIVE',
        message: errorResponse.body.error.message,
        retryAfterDays: canChange.retryAfterDays,
        retryAfterDate: canChange.retryAfterDate?.toISOString(),
      });
    }
    
    // Step 4: Validate new username format
    const validation = validateUsername(newUsername, countryCode);
    if (!validation.isValid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Username unavailable',
        { errors: validation.errors },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: errorResponse.body.error.message,
        errors: validation.errors,
      });
    }
    
    const normalizedNewUsername = newUsername.toLowerCase().trim();
    
    // Step 5: Check if new username is available
    const availability = await checkUsernameAvailability(normalizedNewUsername);
    if (!availability.isAvailable) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Username unavailable',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(409).json({
        success: false,
        error: 'USERNAME_TAKEN',
        message: errorResponse.body.error.message,
      });
    }
    
    if (!db) {
      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Database not available',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: errorResponse.body.error.message,
      });
    }
    
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    
    // Step 6: Get current user data
    const userRef = doc(db, 'users', authResult.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'User not found',
        { userId: authResult.uid },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: errorResponse.body.error.message,
      });
    }
    
    const userData = userDoc.data() as UserDocument;
    const oldUsername = userData.username;
    
    // Step 7: Check if username is actually changing
    if (oldUsername === normalizedNewUsername) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'New username is the same as current username',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'NO_CHANGE',
        message: errorResponse.body.error.message,
      });
    }
    
    // Step 8: Atomic username change transaction
    try {
      await runTransaction(db, async (transaction) => {
        // Re-read user document to get latest data
        const currentUserDoc = await transaction.get(userRef);
        if (!currentUserDoc.exists()) {
          throw new Error('USER_NOT_FOUND');
        }
        
        const currentUserData = currentUserDoc.data() as UserDocument;
        
        // Double-check username hasn't changed (defense against race conditions)
        if (currentUserData.username !== oldUsername) {
          throw new Error('USERNAME_CHANGED');
        }
        
        if (!db) {
          throw new Error('Firebase db not initialized');
        }
        
        // Check new username in usernames collection (O(1) lookup)
        const newUsernameRef = doc(db, 'usernames', normalizedNewUsername);
        const newUsernameDoc = await transaction.get(newUsernameRef);
        
        if (newUsernameDoc.exists()) {
          const data = newUsernameDoc.data() as UsernameDocument;
          // Check if it's a recycled username that's still in cooldown
          if (data.recycledAt) {
            const recycledTime = typeof data.recycledAt === 'object' && data.recycledAt && 'toMillis' in data.recycledAt && typeof data.recycledAt.toMillis === 'function'
              ? data.recycledAt.toMillis()
              : typeof data.recycledAt === 'number'
              ? data.recycledAt
              : Date.now();
            if (Date.now() - recycledTime < RECYCLING_COOLDOWN_MS) {
              throw new Error('NEW_USERNAME_IN_COOLDOWN');
            }
            // Cooldown expired, can reuse
          } else {
            throw new Error('NEW_USERNAME_TAKEN');
          }
        }
        
        // Update user profile
        const currentChangeCount = currentUserData.usernameChangeCount || 0;
        transaction.update(userRef, {
          username: normalizedNewUsername,
          previousUsername: oldUsername,
          lastUsernameChange: serverTimestamp(),
          usernameChangeCount: currentChangeCount + 1,
          updatedAt: serverTimestamp(),
        });
        
        // Update usernames collection: release old, reserve new
        const oldUsernameRef = doc(db, 'usernames', oldUsername);
        
        // Mark old username as recycled (90-day cooldown before reuse)
        transaction.set(oldUsernameRef, {
          uid: null,
          username: oldUsername,
          previousOwner: authResult.uid,
          recycledAt: serverTimestamp(),
        }, { merge: true });
        
        // Reserve new username
        transaction.set(newUsernameRef, {
          uid: authResult.uid,
          username: normalizedNewUsername,
          createdAt: serverTimestamp() as unknown as Timestamp,
          previousOwner: null,
          recycledAt: null,
        });
        
        // Create audit record
        const auditRef = doc(collection(db, 'username_change_audit'), `${authResult.uid}_${Date.now()}`);
        transaction.set(auditRef, {
          uid: authResult.uid,
          oldUsername,
          newUsername: normalizedNewUsername,
          changeType: 'user_request',
          changedBy: authResult.uid,
          changedAt: serverTimestamp(),
          reason: 'User requested username change',
          metadata: {
            changeCount: currentChangeCount + 1,
            countryCode,
          },
        });
      });
    } catch (transactionError) {
      const error = transactionError as Error;
      // Handle specific transaction errors
      if (error.message === 'USERNAME_CHANGED') {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Username was changed by another process. Please refresh and try again.',
          {},
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(409).json({
          success: false,
          error: 'USERNAME_CHANGED',
          message: errorResponse.body.error.message,
        });
      }
      
      if (error.message === 'NEW_USERNAME_TAKEN') {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Username unavailable',
          {},
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(409).json({
          success: false,
          error: 'USERNAME_TAKEN',
          message: errorResponse.body.error.message,
        });
      }
      
      if (error.message === 'NEW_USERNAME_IN_COOLDOWN') {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Username unavailable',
          {},
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(409).json({
          success: false,
          error: 'USERNAME_IN_COOLDOWN',
          message: errorResponse.body.error.message,
        });
      }
      
      if (error.message === 'USER_NOT_FOUND') {
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          'User not found',
          { userId: authResult.uid },
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: errorResponse.body.error.message,
        });
      }
      
      // Re-throw other errors to let withErrorHandling handle them
      throw transactionError;
    }
    
    // Step 9: Get updated cooldown info
    const cooldownInfo = await usernameChangePolicy.getCooldownInfo(authResult.uid) as CooldownInfo;
    
    // Log successful username change
    await logAuthSuccess(authResult.uid, clientIP, {
      endpoint: '/api/auth/username/change',
      oldUsername,
      newUsername: normalizedNewUsername,
    });
    
    const response = createSuccessResponse({
      success: true,
      message: 'Username changed successfully',
      username: normalizedNewUsername,
      previousUsername: oldUsername,
      cooldownInfo: {
        cooldownDays: cooldownInfo.cooldownDays,
        retryAfterDate: cooldownInfo.retryAfterDate?.toISOString(),
      },
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as ChangeUsernameResponse);
  });
};

// Export with CSRF protection
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(handler as unknown as CSRFHandler);
