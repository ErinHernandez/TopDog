/**
 * API Route: Check Username Availability
 * 
 * POST /api/auth/username/check
 * 
 * Checks if a username is available for registration.
 * Validates format and checks against:
 * - Existing users
 * - Reserved usernames
 * - VIP reservations
 * 
 * Features:
 * - Rate limiting (30 requests/minute per IP)
 * - Account enumeration prevention (consistent timing, generic messages)
 * - Username suggestions when taken
 * - Similarity warnings for lookalike usernames
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/auth/username/check', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username: 'johndoe', countryCode: 'US' })
 * });
 * const { isAvailable, message, suggestions, warnings } = await response.json();
 * ```
 */

import { getFirestore, collection, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withErrorHandling,
  validateMethod,
  validateRequestBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType
} from '../../../../lib/apiErrorHandler';
import { db } from '../../../../lib/firebase';
import { createUsernameCheckLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { ensureMinResponseTime, TIMING_CONSTANTS } from '../../../../lib/timingAttackPrevention';
import { isUsernameAvailable as checkUsernamesCollection } from '../../../../lib/usernamesCollection';
import { findSimilarUsernames, generateSimilarityWarnings } from '../../../../lib/usernameSimilarity';
import { generateUsernameSuggestions } from '../../../../lib/usernameSuggestions';
import { checkUsernameSchema } from '../../../../lib/validation/auth';

// ============================================================================
// TYPES
// ============================================================================

interface CheckUsernameRequest {
  username: string;
  countryCode?: string;
}

interface UsernameFormatValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface CheckUsernameResponse {
  isAvailable: boolean;
  message: string;
  suggestions?: string[];
  errors?: string[];
  warnings?: string[];
  isVIPReserved?: boolean;
  error?: string;
  retryAfter?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RESERVED_USERNAMES = new Set([
  // System
  'admin', 'administrator', 'root', 'system', 'bot',
  'moderator', 'mod', 'support', 'help', 'info',
  'api', 'www', 'web', 'app', 'mobile',
  
  // Brand
  'topdog', 'top_dog', 'top-dog', 'topdogfantasy',
  'bestball', 'best_ball', 'best-ball',
  'draftkings', 'underdog', 'sleeper', 'fanduel',
  
  // Common reserved
  'test', 'null', 'undefined', 'anonymous',
  'deleted', 'banned', 'suspended',
  
  // Reserved for future use
  'official', 'verified', 'staff', 'team',
  'news', 'blog', 'store', 'shop',
]);

const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 18,
} as const;

// Use consistent timing constant from centralized module
const MIN_RESPONSE_TIME_MS = TIMING_CONSTANTS.USERNAME_CHECK_MS;

// ============================================================================
// VALIDATION
// ============================================================================

function validateUsernameFormat(
  username: string,
  countryCode: string = 'US'
): UsernameFormatValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Length check
  if (username.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters`);
  }
  if (username.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`);
  }
  
  // No spaces
  if (/\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Basic character validation (alphanumeric + underscore)
  // Country-specific characters are handled separately
  const basePattern = /^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/;
  if (!basePattern.test(username)) {
    errors.push('Username contains invalid characters');
  }
  
  // Must start with a letter
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(username)) {
    errors.push('Username must start with a letter');
  }
  
  // No consecutive underscores
  if (/__/.test(username)) {
    errors.push('Username cannot have consecutive underscores');
  }
  
  // Cannot end with underscore
  if (username.endsWith('_')) {
    warnings.push('Usernames ending with underscore are less readable');
  }
  
  // Reserved check
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    errors.push('This username is reserved');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter instance
const rateLimiter = createUsernameCheckLimiter();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckUsernameResponse>
) {
  const startTime = Date.now(); // Track start time for timing attack prevention
  
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '30');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());
    
    if (!rateLimitResult.allowed) {
      // Ensure consistent timing even for rate-limited requests to prevent timing attacks
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000) },
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        isAvailable: false,
        message: errorResponse.body.error.message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000),
      });
    }
    
    const { username, countryCode = 'US' } = validateRequestBody(req, checkUsernameSchema, logger);
    
    logger.info('Checking username availability', {
      component: 'auth',
      operation: 'username-check',
      username,
      countryCode,
    });
    
    const normalizedUsername = username.toLowerCase().trim();
    
    // Step 1: Validate format
    const validation = validateUsernameFormat(normalizedUsername, countryCode);
    if (!validation.isValid) {
      // Generic error message to prevent enumeration
      // Ensure consistent timing
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      // Use success response (200) to prevent enumeration - username format errors are not security-sensitive
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        errors: validation.errors,
        warnings: validation.warnings,
        isVIPReserved: false,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as CheckUsernameResponse);
    }
    
    // Step 2: Check usernames collection first (O(1) lookup)
    const usernamesResult = await checkUsernamesCollection(normalizedUsername);
    const isVIPReserved = usernamesResult.isVIPReserved || false;
    let suggestions: string[] = [];
    
    if (!usernamesResult.isAvailable) {
      // Username is taken or reserved
      suggestions = await generateUsernameSuggestions(normalizedUsername, 3);
      
      // Ensure consistent timing (add delay if needed)
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        isVIPReserved,
        warnings: validation.warnings,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as CheckUsernameResponse);
    }
    
    // Step 3: Also check users collection for backward compatibility with transaction
    // This ensures we get a consistent view of the username availability at a single point in time
    if (!db) {
      const response = createErrorResponse(
        ErrorType.DATABASE,
        'Database not available',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(response.statusCode).json({
        isAvailable: false,
        message: response.body.error.message,
        error: 'DATABASE_ERROR',
      });
    }

    // Use transaction for consistent read of users collection
    // This prevents TOCTOU (time-of-check-time-of-use) vulnerabilities
    let isTaken = false;
    try {
      isTaken = await runTransaction(db!, async (transaction) => {
        const usersQuery = query(
          collection(db!, 'users'),
          where('username', '==', normalizedUsername)
        );

        const usersSnapshot = await getDocs(usersQuery);
        return !usersSnapshot.empty;
      });
    } catch (transactionError) {
      // Fail-closed: return 503 Service Unavailable on database error
      // This prevents falsely reporting usernames as available during outages
      logger.error('Transaction error during username availability check', transactionError as Error, {
        component: 'auth',
        operation: 'username-check',
        username: normalizedUsername,
      });

      // Ensure consistent timing before returning error
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);

      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Unable to verify username availability. Please try again later.',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json({
        isAvailable: false,
        message: errorResponse.body.error.message,
        error: 'DATABASE_UNAVAILABLE',
      });
    }
    
    // Step 4: Generate suggestions if username is unavailable
    if (isTaken) {
      suggestions = await generateUsernameSuggestions(normalizedUsername, 3);
      
      // Ensure consistent timing (add delay if needed)
      await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
      
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        isVIPReserved: false,
        warnings: validation.warnings,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as CheckUsernameResponse);
    }
    
    // Step 5: Check for similar usernames (warnings only, don't block)
    const similarUsernames = await findSimilarUsernames(normalizedUsername, 3);
    const similarityWarnings = generateSimilarityWarnings(similarUsernames);
    const allWarnings = [...validation.warnings, ...similarityWarnings];
    
    // Ensure consistent timing
    await ensureMinResponseTime(startTime, MIN_RESPONSE_TIME_MS);
    
    // Step 6: Username is available
    const response = createSuccessResponse({
      isAvailable: true,
      message: 'Username is available',
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    }, 200, logger);
    return res.status(response.statusCode).json(response.body.data as CheckUsernameResponse);
  });
}
