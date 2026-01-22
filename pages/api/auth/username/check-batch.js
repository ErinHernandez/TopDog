/**
 * API Route: Batch Check Username Availability
 * 
 * POST /api/auth/username/check-batch
 * 
 * Checks availability of multiple usernames in a single request.
 * Useful for username suggestions and bulk validation.
 * 
 * Features:
 * - Rate limiting (10 requests/minute per IP)
 * - Maximum 10 usernames per request
 * - Returns availability status for each username
 * 
 * @example
 * ```js
 * const response = await fetch('/api/auth/username/check-batch', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ 
 *     usernames: ['johndoe', 'johndoe1', 'johndoe2'],
 *     countryCode: 'US' 
 *   })
 * });
 * const { results } = await response.json();
 * // results: { johndoe: { isAvailable: false }, johndoe1: { isAvailable: true }, ... }
 * ```
 */

import { RateLimiter } from '../../../../lib/rateLimiter';
import { checkBatchAvailability } from '../../../../lib/usernamesCollection';
import { validateUsername } from '../../../../lib/usernameValidation';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_USERNAMES_PER_REQUEST = 10;
const MIN_RESPONSE_TIME_MS = 100;

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter for batch checks (more restrictive than single checks)
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'username_check_batch',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req, res) {
  const startTime = Date.now();
  
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
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
    validateBody(req, ['usernames'], logger);
    
    const { usernames, countryCode = 'US' } = req.body;
    
    // Validate usernames is an array
    if (!Array.isArray(usernames)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'usernames must be an array',
        {},
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'INVALID_INPUT',
        message: errorResponse.body.message,
      });
    }
    
    // Validate array length
    if (usernames.length === 0) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'usernames array cannot be empty',
        {},
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'INVALID_INPUT',
        message: errorResponse.body.message,
      });
    }
    
    if (usernames.length > MAX_USERNAMES_PER_REQUEST) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        `Maximum ${MAX_USERNAMES_PER_REQUEST} usernames per request`,
        { maxAllowed: MAX_USERNAMES_PER_REQUEST },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        success: false,
        error: 'TOO_MANY_USERNAMES',
        message: errorResponse.body.message,
        maxAllowed: MAX_USERNAMES_PER_REQUEST,
      });
    }
    
    logger.info('Batch checking username availability', {
      component: 'auth',
      operation: 'username-check-batch',
      count: usernames.length,
      countryCode,
    });
    
    // Validate each username format first
    const results = {};
    const validUsernames = [];
    
    for (const username of usernames) {
      if (typeof username !== 'string') {
        results[username] = {
          isAvailable: false,
          isValid: false,
          errors: ['Username must be a string'],
        };
        continue;
      }
      
      const normalized = username.toLowerCase().trim();
      const validation = validateUsername(normalized, countryCode);
      
      if (!validation.isValid) {
        results[normalized] = {
          isAvailable: false,
          isValid: false,
          errors: validation.errors,
        };
      } else {
        validUsernames.push(normalized);
      }
    }
    
    // Check availability for valid usernames
    if (validUsernames.length > 0) {
      const availabilityResults = await checkBatchAvailability(validUsernames);
      
      for (const [username, availability] of Object.entries(availabilityResults)) {
        results[username] = {
          ...availability,
          isValid: true,
        };
      }
    }
    
    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    
    const response = createSuccessResponse({
      success: true,
      results,
      checked: usernames.length,
      available: Object.values(results).filter(r => r.isAvailable).length,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}
