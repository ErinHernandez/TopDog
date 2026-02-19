/**
 * API Route: Age Verification
 *
 * POST /api/auth/verify-age
 *
 * Verifies user's date of birth and stores age verification status in Firestore.
 * Enforces compliance with jurisdiction-specific age requirements.
 *
 * Security Features:
 * - Rate limiting to prevent enumeration attacks
 * - Validates date of birth format and logic
 * - Stores encrypted/hashed dates (recommended in production)
 * - Audit logging of all verification attempts
 * - Timing attack prevention
 *
 * Request Body:
 * ```json
 * {
 *   "dateOfBirth": "1995-03-15",  // ISO 8601 format (YYYY-MM-DD)
 *   "stateCode": "NY",             // Optional: US state code for jurisdiction check
 *   "countryCode": "US"            // Optional: Country code (defaults to US)
 * }
 * ```
 *
 * Success Response (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "Age verified successfully",
 *   "result": {
 *     "verified": true,
 *     "age": 29,
 *     "minimumAge": 21,
 *     "jurisdiction": "NY"
 *   }
 * }
 * ```
 *
 * Failure Response (403):
 * ```json
 * {
 *   "success": false,
 *   "error": "AGE_VERIFICATION_FAILED",
 *   "message": "User is not old enough for this jurisdiction"
 * }
 * ```
 *
 * @example
 * ```ts
 * const response = await fetch('/api/auth/verify-age', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     dateOfBirth: '1995-03-15',
 *     stateCode: 'NY'
 *   })
 * });
 * ```
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import {
  withErrorHandling,
  validateMethod,
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { verifyAge, isJurisdictionProhibited } from '../../../lib/compliance/ageVerification';
import { checkJurisdiction } from '../../../lib/compliance/jurisdictionCompliance';
import { db } from '../../../lib/firebase';
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger';
import { ensureMinResponseTime, TIMING_CONSTANTS } from '../../../lib/timingAttackPrevention';


// ============================================================================
// TYPES
// ============================================================================

interface VerifyAgeRequest {
  dateOfBirth: string;
  stateCode?: string;
  countryCode?: string;
}

interface VerifyAgeResponse {
  success: boolean;
  message?: string;
  result?: {
    verified: boolean;
    age: number;
    minimumAge: number;
    jurisdiction: string;
  };
  error?: string;
  errors?: string[];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Zod schema for age verification request
 */
const ageVerificationSchema = z.object({
  dateOfBirth: z
    .string()
    .refine(
      (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
      'Date must be in ISO 8601 format (YYYY-MM-DD)'
    )
    .refine(
      (date) => {
        try {
          const parsed = new Date(date);
          return !isNaN(parsed.getTime());
        } catch {
          return false;
        }
      },
      'Date of birth must be a valid date'
    )
    .refine(
      (date) => {
        const parsed = new Date(date);
        return parsed <= new Date();
      },
      'Date of birth cannot be in the future'
    ),
  stateCode: z
    .string()
    .length(2, 'State code must be 2 characters')
    .toUpperCase()
    .optional(),
  countryCode: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .toUpperCase()
    .default('US'),
});

type VerifyAgeRequestSchema = z.infer<typeof ageVerificationSchema>;

// ============================================================================
// RATE LIMITER
// ============================================================================

/**
 * Rate limiter for age verification endpoint
 * Prevents brute force attacks on age verification
 * Allows 10 attempts per 5 minutes per user
 */
const ageVerificationLimiter = new RateLimiter({
  endpoint: 'age_verification',
  maxRequests: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60 * 1000,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate the date of birth format and logic
 *
 * @param dateOfBirth - ISO date string
 * @returns Validation result
 */
function validateDateOfBirth(dateOfBirth: string): { valid: boolean; error?: string } {
  try {
    // Check format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return { valid: false, error: 'Date must be in ISO 8601 format (YYYY-MM-DD)' };
    }

    // Parse and validate
    const parsed = new Date(dateOfBirth);
    if (isNaN(parsed.getTime())) {
      return { valid: false, error: 'Invalid date value' };
    }

    // Check not in future
    if (parsed > new Date()) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }

    // Check reasonable range (not more than 150 years old)
    const age = new Date().getFullYear() - parsed.getFullYear();
    if (age > 150) {
      return { valid: false, error: 'Date of birth is invalid' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid date format' };
  }
}

/**
 * Hash or encrypt date of birth for storage
 * In production, use proper encryption library
 *
 * @param dateOfBirth - Raw date of birth
 * @returns Hashed/encrypted date
 */
function encryptDateOfBirth(dateOfBirth: string): string {
  // In production, use proper encryption (e.g., crypto-js, TweetNaCl.js)
  // For now, return a placeholder indicating encryption is needed
  // SECURITY: Real implementation should encrypt with server-side key
  const timestamp = Date.now();
  return `encrypted_${Buffer.from(dateOfBirth).toString('base64')}_${timestamp}`;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyAgeResponse>
) {
  const startTime = Date.now();
  const MIN_RESPONSE_TIME_MS = TIMING_CONSTANTS.AUTH_MS || 1000;

  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);

    // Get user ID from auth context
    // In production, this would come from Firebase auth JWT
    const uid = (req as NextApiRequest & { uid?: string }).uid || (req.headers['x-user-id'] as string | undefined);

    // Rate limiting check
    const rateLimitResult = await ageVerificationLimiter.check(req);

    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());

    if (!rateLimitResult.allowed) {
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many age verification attempts. Please try again later.',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000) },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: errorResponse.body.error.message,
      });
    }

    // Validate required body fields
    validateBody(req, ['dateOfBirth'], logger);

    // Parse and validate request body
    let validatedData: VerifyAgeRequestSchema;
    try {
      validatedData = ageVerificationSchema.parse(req.body);
    } catch (error) {
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      const validationError = error instanceof z.ZodError
        ? (error as z.ZodError).issues[0]?.message || 'Validation failed'
        : 'Invalid request body';

      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        validationError,
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: errorResponse.body.error.message,
      });
    }

    const { dateOfBirth, stateCode, countryCode = 'US' } = validatedData;

    logger.info('Processing age verification', {
      component: 'auth',
      operation: 'age_verification',
      uid,
      hasStateCode: !!stateCode,
      country: countryCode,
    });

    // Validate date of birth
    const dateValidation = validateDateOfBirth(dateOfBirth);
    if (!dateValidation.valid) {
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        dateValidation.error || 'Invalid date of birth',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'INVALID_DATE',
        message: errorResponse.body.error.message,
      });
    }

    // Check jurisdiction restrictions
    if (stateCode && isJurisdictionProhibited(stateCode)) {
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      logger.warn('Age verification failed - jurisdiction prohibited', {
        component: 'auth',
        operation: 'age_verification',
        uid,
        state: stateCode,
      });

      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Paid fantasy sports are not available in your jurisdiction',
        { jurisdiction: stateCode },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'JURISDICTION_PROHIBITED',
        message: errorResponse.body.error.message,
      });
    }

    // Verify age against jurisdiction requirements
    const jurisdiction = stateCode || countryCode;
    const ageVerification = verifyAge(dateOfBirth, jurisdiction);

    logger.info('Age verification result', {
      component: 'auth',
      operation: 'age_verification',
      uid,
      verified: ageVerification.verified,
      age: ageVerification.age,
      minimumAge: ageVerification.minimumAge,
    });

    // If age verification fails, return error
    if (!ageVerification.verified) {
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        `User must be at least ${ageVerification.minimumAge} years old`,
        {
          minimumAge: ageVerification.minimumAge,
          daysUntilEligible: ageVerification.daysUntilEligible,
        },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'AGE_VERIFICATION_FAILED',
        message: errorResponse.body.error.message,
      });
    }

    // Additional jurisdiction check
    if (stateCode) {
      const jurisdictionCheck = checkJurisdiction(stateCode, countryCode);
      if (!jurisdictionCheck.allowed) {
        await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

        const errorResponse = createErrorResponse(
          ErrorType.FORBIDDEN,
          jurisdictionCheck.message,
          { jurisdiction: stateCode },
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(errorResponse.statusCode).json({
          success: false,
          error: 'JURISDICTION_NOT_ALLOWED',
          message: errorResponse.body.error.message,
        });
      }
    }

    // Store verification in Firestore
    if (uid && db) {
      try {
        const userRef = doc(db, 'users', uid);
        const encryptedDob = encryptDateOfBirth(dateOfBirth);

        await updateDoc(userRef, {
          ageVerified: true,
          ageVerifiedAt: serverTimestamp(),
          dateOfBirth: encryptedDob, // SECURITY: Should be encrypted at rest
          stateCode: stateCode || null,
          countryCode: countryCode || 'US',
        });

        logger.info('Age verification stored', {
          component: 'auth',
          operation: 'age_verification',
          uid,
          verified: true,
        });
      } catch (error) {
        logger.error('Failed to store age verification', error instanceof Error ? error : new Error(String(error)));

        // Don't fail the request - verification was successful, just storage failed
        // In production, might want to retry or queue for async processing
      }
    }

    // Ensure consistent timing before success response
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }

    const response = createSuccessResponse({
      success: true,
      message: 'Age verified successfully',
      result: {
        verified: ageVerification.verified,
        age: ageVerification.age,
        minimumAge: ageVerification.minimumAge,
        jurisdiction: ageVerification.jurisdiction,
      },
    }, 200, logger);

    return res.status(response.statusCode).json(response.body.data as VerifyAgeResponse);
  });
}
