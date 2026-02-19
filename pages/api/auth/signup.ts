/**
 * API Route: User Signup
 * 
 * POST /api/auth/signup
 * 
 * Creates a new user account with username.
 * Handles:
 * - Username validation and reservation
 * - Profile creation
 * - Country validation
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/auth/signup', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     uid: 'firebase-uid',
 *     username: 'newuser',
 *     email: 'user@example.com',
 *     countryCode: 'US',
 *     displayName: 'New User'
 *   })
 * });
 * ```
 */

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
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withErrorHandling,
  validateMethod,
  validateRequestBody,
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType
} from '../../../lib/apiErrorHandler';
import { COUNTRY_NAMES, US_STATE_NAMES } from '../../../lib/customization/flags';
import { recordLocationVisit, grantLocationConsent } from '../../../lib/customization/geolocation';
import { db } from '../../../lib/firebase';
import { isApprovedCountry } from '../../../lib/localeCharacters';
import { createSignupLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger';
import { ensureMinResponseTime, TIMING_CONSTANTS } from '../../../lib/timingAttackPrevention';
import { signupRequestSchema } from '../../../lib/validation/schemas';

// ============================================================================
// TYPES
// ============================================================================

// Types are now inferred from Zod schemas in lib/validation/schemas.ts
// import type { SignupRequest } from '../../../lib/validation/schemas';

interface UsernameValidation {
  isValid: boolean;
  errors: string[];
  normalized?: string;
}

interface SignupResponse {
  success: boolean;
  message?: string;
  profile?: {
    uid: string;
    username: string;
    displayName: string;
    countryCode: string;
  };
  error?: string;
  errors?: string[];
  retryAfter?: number;
}

interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  countryCode: string;
  displayName: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
  lastLogin: ReturnType<typeof serverTimestamp>;
  isActive: boolean;
  profileComplete: boolean;
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;
  bestFinish: null;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
    borderColor: string;
  };
}

interface UsernameDocument {
  uid: string | null;
  username: string;
  recycledAt?: Timestamp | Date | number | null;
  createdAt?: Timestamp | Date;
}

interface VIPReservation {
  usernameLower: string;
  claimed: boolean;
  expiresAt?: Timestamp | Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Create rate limiter instance
const rateLimiter = createSignupLimiter();

// Use consistent timing constant from centralized module
const MIN_RESPONSE_TIME_MS = TIMING_CONSTANTS.SIGNUP_MS;

// Username recycling cooldown (90 days)
const RECYCLING_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'bot',
  'moderator', 'mod', 'support', 'help', 'info',
  'api', 'www', 'web', 'app', 'mobile',
  'topdog', 'top_dog', 'top-dog', 'topdogfantasy',
  'bestball', 'best_ball', 'best-ball',
  'test', 'null', 'undefined', 'anonymous',
  'deleted', 'banned', 'suspended',
  'official', 'verified', 'staff', 'team',
]);

const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 18,
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

function validateUsername(username: unknown): UsernameValidation {
  const errors: string[] = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  const trimmed = username.trim().toLowerCase();
  
  if (trimmed.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters`);
  }
  
  if (trimmed.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`);
  }
  
  if (/\s/.test(trimmed)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Allow letters (including extended Latin), numbers, underscores
  if (!/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/.test(trimmed)) {
    errors.push('Username contains invalid characters');
  }
  
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(trimmed)) {
    errors.push('Username must start with a letter');
  }
  
  if (/__/.test(trimmed)) {
    errors.push('Username cannot have consecutive underscores');
  }
  
  if (RESERVED_USERNAMES.has(trimmed)) {
    errors.push('This username is reserved');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    normalized: trimmed,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  const startTime = Date.now(); // Track start time for timing attack prevention
  
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '3');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());
    
    if (!rateLimitResult.allowed) {
      // Ensure consistent timing even for rate-limited requests to prevent timing attacks
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many signup attempts. Please try again later.',
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
    validateBody(req, ['uid', 'username'], logger);
    
    const { 
      uid, 
      username, 
      email, 
      countryCode = 'US',
      stateCode,
      displayName 
    } = validateRequestBody(req, signupRequestSchema, logger);
    
    logger.info('Processing user signup', {
      component: 'auth',
      operation: 'signup',
      uid,
      username,
      countryCode,
    });
    
    // Validate country
    if (!isApprovedCountry(countryCode)) {
      // Ensure consistent timing
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'This service is not available in your country',
        { countryCode },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'COUNTRY_NOT_ALLOWED',
        message: errorResponse.body.error.message,
      });
    }
    
    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid || !validation.normalized) {
      // Generic error message to prevent enumeration
      // Ensure consistent timing
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
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
    
    const normalizedUsername = validation.normalized;
    
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
    
    // Use transaction for atomic operations
    let result: UserProfile;
    const dbNonNull = db; // Type narrowing helper
    try {
      result = await runTransaction(dbNonNull, async (transaction) => {
        // Check usernames collection first (O(1) lookup)
        const usernameRef = doc(dbNonNull, 'usernames', normalizedUsername);
        const usernameDoc = await transaction.get(usernameRef);
        
        if (usernameDoc.exists()) {
          const data = usernameDoc.data() as UsernameDocument;
          // Check if it's a recycled username that's still in cooldown
          if (data.recycledAt) {
            const recycledTime = data.recycledAt instanceof Timestamp
              ? data.recycledAt.toMillis()
              : data.recycledAt instanceof Date
              ? data.recycledAt.getTime()
              : typeof data.recycledAt === 'number'
              ? data.recycledAt
              : Date.now();
            if (Date.now() - recycledTime < RECYCLING_COOLDOWN_MS) {
              throw new Error('USERNAME_IN_COOLDOWN');
            }
            // Cooldown expired, can reuse
          } else {
            throw new Error('USERNAME_TAKEN');
          }
        }
        
        // Also check users collection for backward compatibility
        const usersQuery = query(
          collection(dbNonNull, 'users'),
          where('username', '==', normalizedUsername)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          throw new Error('USERNAME_TAKEN');
        }
        
        // Check VIP reservation
        const vipQuery = query(
          collection(dbNonNull, 'vip_reservations'),
          where('usernameLower', '==', normalizedUsername),
          where('claimed', '==', false)
        );
        const vipSnapshot = await getDocs(vipQuery);
        
        if (!vipSnapshot.empty) {
          const reservation = vipSnapshot.docs[0]!.data() as VIPReservation;
          const expiresAt = reservation.expiresAt instanceof Timestamp
            ? reservation.expiresAt.toDate()
            : reservation.expiresAt instanceof Date
            ? reservation.expiresAt
            : null;
          
          // Check if not expired
          if (!expiresAt || new Date(expiresAt) > new Date()) {
            throw new Error('USERNAME_VIP_RESERVED');
          }
        }
      
        // Create user profile
        const userProfile: UserProfile = {
          uid,
          username: normalizedUsername,
          email: email || null,
          countryCode,
          displayName: displayName || normalizedUsername,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
          profileComplete: true,
          tournamentsEntered: 0,
          tournamentsWon: 0,
          totalWinnings: 0,
          bestFinish: null,
          preferences: {
            notifications: true,
            emailUpdates: true,
            publicProfile: true,
            borderColor: '#4285F4',
          },
        };
        
        const userRef = doc(dbNonNull, 'users', uid);
        transaction.set(userRef, userProfile);
        
        // Also reserve in usernames collection for O(1) lookups
        transaction.set(usernameRef, {
          uid,
          username: normalizedUsername,
          createdAt: serverTimestamp(),
          previousOwner: null,
          recycledAt: null,
        });
      
        return userProfile;
      });
    } catch (transactionError) {
      // Handle specific transaction errors with consistent timing
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      const error = transactionError as Error;
      // Handle specific errors with generic messages to prevent enumeration
      if (error.message === 'USERNAME_TAKEN') {
        return res.status(409).json({
          success: false,
          error: 'USERNAME_TAKEN',
          message: 'Username unavailable',
        });
      }
      
      if (error.message === 'USERNAME_IN_COOLDOWN') {
        return res.status(409).json({
          success: false,
          error: 'USERNAME_IN_COOLDOWN',
          message: 'Username unavailable',
        });
      }
      
      if (error.message === 'USERNAME_VIP_RESERVED') {
        return res.status(403).json({
          success: false,
          error: 'USERNAME_VIP_RESERVED',
          message: 'Username unavailable',
        });
      }
      
      // Re-throw other errors to let withErrorHandling handle them
      throw transactionError;
    }
    
    // Record location for first flag earned
    // This uses the location provided during signup (countryCode and optionally stateCode)
    try {
      // Grant location consent (IP-based geolocation doesn't require explicit user consent)
      await grantLocationConsent(uid);
      
      // Create location from countryCode and stateCode
      const countryName = COUNTRY_NAMES[countryCode] || countryCode;
      const location = {
        country: { code: countryCode, name: countryName },
        state: (countryCode === 'US' && stateCode && US_STATE_NAMES[stateCode])
          ? { code: stateCode, name: US_STATE_NAMES[stateCode] }
          : null,
      };
      
      // Record the location visit - this gives the user their first flag
      await recordLocationVisit(uid, location);
    } catch (locationError) {
      // Don't fail signup if location recording fails - just log it
      const errorMessage = locationError instanceof Error ? locationError.message : String(locationError);
      logger.warn('Failed to record location during signup', {
        component: 'auth',
        operation: 'signup',
        uid,
        error: errorMessage,
      });
    }
    
    // Ensure consistent timing before success response
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    
    const response = createSuccessResponse({
      success: true,
      message: 'User profile created successfully',
      profile: {
        uid: result.uid,
        username: result.username,
        displayName: result.displayName,
        countryCode: result.countryCode,
      },
    }, 201, logger);
    
    return res.status(response.statusCode).json(response.body.data as SignupResponse);
  });
}
