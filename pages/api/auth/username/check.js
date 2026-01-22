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
 * ```js
 * const response = await fetch('/api/auth/username/check', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username: 'johndoe', countryCode: 'US' })
 * });
 * const { isAvailable, message, suggestions, warnings } = await response.json();
 * ```
 */

import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { createUsernameCheckLimiter } from '../../../../lib/rateLimiter';
import { generateUsernameSuggestions } from '../../../../lib/usernameSuggestions';
import { findSimilarUsernames, generateSimilarityWarnings } from '../../../../lib/usernameSimilarity';
import { isUsernameAvailable as checkUsernamesCollection } from '../../../../lib/usernamesCollection';
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

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

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
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateUsernameFormat(username, countryCode = 'US') {
  const errors = [];
  const warnings = [];
  
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

// Minimum response time to prevent timing attacks (milliseconds)
const MIN_RESPONSE_TIME_MS = 100;

export default async function handler(req, res) {
  const startTime = Date.now(); // Track start time for timing attack prevention
  
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Step 0: Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '30');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      // Ensure consistent timing even for rate-limited requests to prevent timing attacks
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
        isAvailable: false,
        message: errorResponse.body.message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    // Validate required body fields
    validateBody(req, ['username'], logger);
    
    const { username, countryCode = 'US' } = req.body;
    
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
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      // Use success response (200) to prevent enumeration - username format errors are not security-sensitive
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        errors: validation.errors,
        warnings: validation.warnings,
        isVIPReserved: false,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Step 2: Check usernames collection first (O(1) lookup)
    const usernamesResult = await checkUsernamesCollection(normalizedUsername);
    let isVIPReserved = usernamesResult.isVIPReserved || false;
    let suggestions = [];
    
    if (!usernamesResult.isAvailable) {
      // Username is taken or reserved
      suggestions = await generateUsernameSuggestions(normalizedUsername, 3);
      
      // Ensure consistent timing (add delay if needed)
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        isVIPReserved,
        warnings: validation.warnings,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Step 3: Also check users collection for backward compatibility
    // (in case usernames collection is not fully migrated)
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const isTaken = !usersSnapshot.empty;
    
    // Step 4: Generate suggestions if username is unavailable
    if (isTaken) {
      suggestions = await generateUsernameSuggestions(normalizedUsername, 3);
      
      // Ensure consistent timing (add delay if needed)
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }
      
      const response = createSuccessResponse({
        isAvailable: false,
        message: 'Username unavailable',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        isVIPReserved: false,
        warnings: validation.warnings,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Step 5: Check for similar usernames (warnings only, don't block)
    const similarUsernames = await findSimilarUsernames(normalizedUsername, 3);
    const similarityWarnings = generateSimilarityWarnings(similarUsernames);
    const allWarnings = [...validation.warnings, ...similarityWarnings];
    
    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    
    // Step 6: Username is available
    const response = createSuccessResponse({
      isAvailable: true,
      message: 'Username is available',
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}

