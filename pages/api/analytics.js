/**
 * Analytics API Endpoint
 * 
 * POST /api/analytics
 * 
 * Receives analytics events from the client and logs them.
 * Requires Firebase Auth token for authentication.
 */

import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';
import { createAnalyticsRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';
import { logRateLimitExceeded, getClientIP } from '../../lib/securityLogger';
import { logger } from '../../lib/structuredLogger.js';

// Use require for firebase-admin to ensure Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
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
    logger.warn('Firebase Admin initialization failed for analytics', {
      component: 'analytics',
      operation: 'firebase-admin-init',
      error: error.message || String(error),
    });
  }
} else {
  firebaseAdminInitialized = true;
}

/**
 * Verify authentication token and get user UID
 * @param {string} authHeader - Authorization header
 * @returns {Promise<{ uid: string | null, error?: string }>}
 */
async function verifyAuth(authHeader) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle missing authorization header
  if (!authHeader) {
    if (isDevelopment) {
      // In development, allow requests without auth header
      return { uid: 'dev-uid' };
    }
    return { uid: null, error: 'Missing authorization header' };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { uid: null, error: 'Invalid authorization header format' };
  }
  
  // Extract token (handle multiple spaces or edge cases)
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  // For development: accept dev-token as valid authentication
  if (isDevelopment && token === 'dev-token') {
    return { uid: 'dev-uid' };
  }
  
  // If Firebase Admin is not initialized, allow in development
  if (!firebaseAdminInitialized) {
    if (isDevelopment) {
      // In development, if Firebase Admin isn't configured, allow any token
      // This handles the case where FIREBASE_SERVICE_ACCOUNT is not set
      return { uid: 'dev-uid' };
    }
    return { 
      uid: null, 
      error: 'Authentication service unavailable' 
    };
  }
  
  // Verify with Firebase Admin for production tokens
  try {
    const adminAuth = admin.auth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid };
  } catch (error) {
    // In development, if token verification fails for any reason,
    // fall back to dev-uid for easier development
    if (isDevelopment) {
      logger.warn('Token verification failed in development, allowing as dev-uid', {
        component: 'analytics',
        operation: 'token-verification',
        error: error.message || String(error),
      });
      return { uid: 'dev-uid' };
    }
    logger.error('Token verification error', error, {
      component: 'analytics',
      operation: 'token-verification',
    });
    return { uid: null, error: 'Invalid token' };
  }
}

// Create rate limiter for analytics
const analyticsLimiter = createAnalyticsRateLimiter();

const handler = async function(req, res) {
  // Handle CORS preflight requests (before withErrorHandling)
  if (req.method === 'OPTIONS') {
    // CORS Configuration - Secure by default
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
      .map(o => o.trim())
      .filter(Boolean) || [];
    
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        return res.status(500).json({ error: 'CORS configuration error' });
      }
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        return res.status(403).json({ error: 'CORS policy violation' });
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  return withErrorHandling(req, res, async (req, res, logger) => {
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
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuth(authHeader);
    
    if (!authResult.uid) {
      // In development, log more details for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Analytics auth failed', {
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader?.substring(0, 20),
          error: authResult.error,
          firebaseAdminInitialized
        });
      }
      
      const error = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        authResult.error || 'Authentication required',
        401,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }

    const { event, userId, sessionId, timestamp } = req.body;

    // Validate that userId in body matches authenticated user (if provided)
    // In development, be more lenient with dev-uid
    if (userId && userId !== authResult.uid) {
      // In development, if we're using dev-uid, allow any userId or no userId
      if (process.env.NODE_ENV === 'development' && authResult.uid === 'dev-uid') {
        // Allow any userId in development mode
        logger.debug('Development mode: allowing userId mismatch', { 
          providedUserId: userId, 
          authUid: authResult.uid 
        });
      } else {
        const error = createErrorResponse(
          ErrorType.FORBIDDEN,
          'User ID mismatch',
          403,
          logger
        );
        return res.status(error.statusCode).json(error.body);
      }
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
    
    return res.status(response.statusCode).json(response.body);
  });
};

// Export with rate limiting
export default withRateLimit(handler, analyticsLimiter);

