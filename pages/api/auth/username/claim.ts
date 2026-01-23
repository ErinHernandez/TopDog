/**
 * API Route: Claim VIP Username
 * 
 * POST /api/auth/username/claim
 * 
 * Allows a VIP to claim their reserved username during signup.
 * Requires a claim token provided by admin.
 * 
 * @example
 * ```ts
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

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
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
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface ClaimUsernameRequest {
  username: string;
  claimToken: string;
  userId: string;
}

interface ClaimUsernameResponse {
  success: boolean;
  message?: string;
  username?: string;
  error?: string;
  retryAfter?: number;
}

interface VIPReservation {
  usernameLower: string;
  claimed: boolean;
  claimToken?: string;
  expiresAt?: Timestamp | Date;
  reservedFor?: string;
  claimedAt?: Timestamp | Date;
  claimedBy?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Rate limiter for VIP claim attempts (5 per hour - strict to prevent abuse)
const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  endpoint: 'vip_claim',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClaimUsernameResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());
    
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many claim attempts. Please try again later.',
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
    
    // Validate required body fields
    validateBody(req, ['username', 'claimToken', 'userId'], logger);
    
    const { username, claimToken, userId } = req.body as ClaimUsernameRequest;
    
    logger.info('Processing VIP username claim', {
      component: 'auth',
      operation: 'username-claim',
      username,
      userId,
    });
    
    const normalizedUsername = username.toLowerCase().trim();
    
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
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'NOT_FOUND',
        message: errorResponse.body.error.message,
      });
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const reservation = reservationDoc.data() as VIPReservation;
    
    // Verify claim token using constant-time comparison to prevent timing attacks
    if (reservation.claimToken) {
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
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: errorResponse.body.error.message,
        });
      }
    }
    
    // Check if expired
    const expiresAt = reservation.expiresAt instanceof Timestamp
      ? reservation.expiresAt.toDate()
      : reservation.expiresAt instanceof Date
      ? reservation.expiresAt
      : null;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'This reservation has expired',
        { username, expiresAt: expiresAt.toISOString() },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(410).json({
        success: false,
        error: 'EXPIRED',
        message: errorResponse.body.error.message,
      });
    }
    
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    
    // Use transaction to claim username atomically
    const dbNonNull = db; // Type narrowing helper
    await runTransaction(dbNonNull, async (transaction) => {
      // Update reservation
      const reservationRef = doc(dbNonNull, 'vip_reservations', reservationDoc.id);
      transaction.update(reservationRef, {
        claimed: true,
        claimedAt: serverTimestamp() as unknown as Timestamp,
        claimedBy: userId,
      });
      
      // Log the claim
      const auditRef = doc(dbNonNull, 'admin_audit_log', `${reservationDoc.id}_claimed`);
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
    
    return res.status(response.statusCode).json(response.body.data as ClaimUsernameResponse);
  });
}
