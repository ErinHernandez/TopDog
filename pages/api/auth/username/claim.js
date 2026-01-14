/**
 * API Route: Claim VIP Username
 * 
 * POST /api/auth/username/claim
 * 
 * Allows a VIP to claim their reserved username during signup.
 * Requires a claim token provided by admin.
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/username/claim', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     username: 'celebrity',
 *     claimToken: 'abc123...',
 *     userId: 'firebase-uid'
 *   })
 * });
 * ```
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Rate limiter for VIP claim attempts (5 per hour - strict to prevent abuse)
const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  endpoint: 'vip_claim',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many claim attempts. Please try again later.',
        { retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000) },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: errorResponse.body.message,
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    // Validate required body fields
    validateBody(req, ['username', 'claimToken', 'userId'], logger);
    
    const { username, claimToken, userId } = req.body;
    
    logger.info('Processing VIP username claim', {
      component: 'auth',
      operation: 'username-claim',
      username,
      userId,
    });
    
    const normalizedUsername = username.toLowerCase().trim();
    
    // Find the reservation
    const vipQuery = query(
      collection(db, 'vip_reservations'),
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No reservation found for this username',
        { username },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'NOT_FOUND',
        message: errorResponse.body.message,
      });
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const reservation = reservationDoc.data();
    
    // Verify claim token using constant-time comparison to prevent timing attacks
    if (reservation.claimToken) {
      const crypto = require('crypto');
      
      // Convert tokens to buffers for constant-time comparison
      const expectedBuffer = Buffer.from(reservation.claimToken, 'utf8');
      const providedBuffer = Buffer.from(claimToken || '', 'utf8');
      
      // Ensure buffers are same length (pad with zeros if needed)
      // This prevents length-based timing attacks
      const maxLength = Math.max(expectedBuffer.length, providedBuffer.length);
      const expectedPadded = Buffer.alloc(maxLength);
      const providedPadded = Buffer.alloc(maxLength);
      expectedBuffer.copy(expectedPadded);
      providedBuffer.copy(providedPadded);
      
      // Constant-time comparison
      if (!crypto.timingSafeEqual(expectedPadded, providedPadded)) {
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'Invalid claim token',
          {},
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: errorResponse.body.message,
        });
      }
    }
    
    // Check if expired
    const expiresAt = reservation.expiresAt?.toDate?.() || reservation.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'This reservation has expired',
        { username, expiresAt },
        res.getHeader('X-Request-ID')
      );
      return res.status(410).json({
        success: false,
        error: 'EXPIRED',
        message: errorResponse.body.message,
      });
    }
    
    // Use transaction to claim username atomically
    await runTransaction(db, async (transaction) => {
      // Update reservation
      const reservationRef = doc(db, 'vip_reservations', reservationDoc.id);
      transaction.update(reservationRef, {
        claimed: true,
        claimedAt: serverTimestamp(),
        claimedBy: userId,
      });
      
      // Log the claim
      const auditRef = doc(db, 'admin_audit_log', `${reservationDoc.id}_claimed`);
      transaction.set(auditRef, {
        action: 'VIP_USERNAME_CLAIMED',
        reservationId: reservationDoc.id,
        username: normalizedUsername,
        claimedBy: userId,
        reservedFor: reservation.reservedFor,
        timestamp: serverTimestamp(),
      });
    });
    
    const response = createSuccessResponse({
      success: true,
      message: `Username "${normalizedUsername}" claimed successfully`,
      username: normalizedUsername,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

