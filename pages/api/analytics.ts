/**
 * Analytics API Endpoint
 * 
 * POST /api/analytics
 * 
 * Receives analytics events from the client and logs them.
 * Requires Firebase Auth token for authentication.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';
import { analyticsRequestSchema } from '../../lib/validation/schemas';
import { createAnalyticsRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';
import { logRateLimitExceeded, getClientIP } from '../../lib/securityLogger';
import { logger } from '../../lib/structuredLogger';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsRequest {
  event?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

export interface AnalyticsResponse {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export interface AuthResult {
  uid: string | null;
  error?: string;
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Initialize Firebase Admin if not already initialized
let firebaseAdminInitialized = false;
if (admin.apps.length === 0) {
  try {
    const serviceAccountRaw = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}') as { project_id?: string; projectId?: string };
    const serviceAccount: import('firebase-admin').ServiceAccount = {
      ...serviceAccountRaw,
      projectId: serviceAccountRaw.projectId || serviceAccountRaw.project_id
    };
    if (serviceAccount.projectId) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseAdminInitialized = true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Firebase Admin initialization failed for analytics', {
      component: 'analytics',
      operation: 'firebase-admin-init',
      error: errorMessage,
    });
  }
} else {
  firebaseAdminInitialized = true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify authentication token and get user UID
 *
 * SECURITY: All development bypasses have been removed to prevent
 * security vulnerabilities from leaking into production.
 * For local development, use the Firebase Auth Emulator instead.
 */
async function verifyAuth(authHeader: string | undefined): Promise<AuthResult> {
  // Handle missing authorization header
  if (!authHeader) {
    return { uid: null, error: 'Missing authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { uid: null, error: 'Invalid authorization header format' };
  }

  // Extract token (handle multiple spaces or edge cases)
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { uid: null, error: 'Empty token' };
  }

  // If Firebase Admin is not initialized, reject the request
  if (!firebaseAdminInitialized) {
    logger.error('Firebase Admin not initialized - cannot verify tokens', new Error('Firebase Admin not initialized'), {
      component: 'analytics',
      operation: 'token-verification',
    });
    return {
      uid: null,
      error: 'Authentication service unavailable'
    };
  }

  // Verify with Firebase Admin
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Token verification error', error, {
      component: 'analytics',
      operation: 'token-verification',
    });
    return { uid: null, error: 'Invalid token' };
  }
}

// Create rate limiter for analytics
const analyticsLimiter = createAnalyticsRateLimiter();

// ============================================================================
// HANDLER
// ============================================================================

const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
): Promise<unknown> {
  // Handle CORS preflight requests (before withErrorHandling)
  if (req.method === 'OPTIONS') {
    // CORS Configuration - Secure by default
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
      .map(o => o.trim())
      .filter(Boolean) || [];
    
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        return res.status(500).json({ error: 'CORS configuration error', success: false, message: 'CORS configuration error' });
      }
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        return res.status(403).json({ error: 'CORS policy violation', success: false, message: 'CORS policy violation' });
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['POST'], logger);

    // Check rate limit
    const rateLimitResult = await analyticsLimiter.check(req);
    const clientIP = getClientIP(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', analyticsLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      // Log rate limit exceeded
      await logRateLimitExceeded(null, '/api/analytics', clientIP);
      
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000),
      });
    }
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuth(authHeader);
    
    if (!authResult.uid) {
      // Log auth failure for debugging (no sensitive data)
      logger.debug('Analytics auth failed', {
        hasAuthHeader: !!authHeader,
        error: authResult.error,
      });

      const error = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        authResult.error || 'Authentication required'
      );
      return res.status(error.statusCode).json(error.body as unknown as AnalyticsResponse);
    }

    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, analyticsRequestSchema, logger);
    const { event, userId, sessionId, timestamp, properties } = body;

    // Validate that userId in body matches authenticated user (if provided)
    // SECURITY: Strict validation - no environment-based bypasses
    if (userId && userId !== authResult.uid) {
      const error = createErrorResponse(
        ErrorType.FORBIDDEN,
        'User ID mismatch'
      );
      return res.status(error.statusCode).json(error.body as unknown as AnalyticsResponse);
    }

    // Log analytics event with authenticated user ID
    logger.debug('Analytics event received', { 
      event, 
      userId: authResult.uid, 
      sessionId, 
      timestamp 
    });

    // Return success response
    const response = createSuccessResponse({ 
      message: 'Analytics event received' 
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as AnalyticsResponse);
  });
};

// Export with rate limiting
export default withRateLimit(handler, analyticsLimiter);
