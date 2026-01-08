/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF token generation and validation for state-changing operations.
 * Uses the double-submit cookie pattern for stateless CSRF protection.
 */

import { randomBytes } from 'crypto';

// CSRF token cookie name
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a new CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request
 * @param {Object} req - Next.js request object
 * @returns {boolean} True if token is valid
 */
export function validateCSRFToken(req) {
  // Get token from header
  const headerToken = req.headers[CSRF_TOKEN_HEADER] || req.headers['x-csrf-token'];
  
  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  
  // Both must be present and match
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return headerToken === cookieToken && headerToken.length > 0;
}

/**
 * CSRF protection middleware for Next.js API routes
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler with CSRF protection
 */
export function withCSRFProtection(handler) {
  return async (req, res) => {
    // Skip CSRF for GET, HEAD, OPTIONS (read-only operations)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req, res);
    }
    
    // Validate CSRF token for state-changing operations
    if (!validateCSRFToken(req)) {
      return res.status(403).json({
        success: false,
        error: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token'
      });
    }
    
    // Token is valid, proceed with handler
    return handler(req, res);
  };
}

/**
 * Set CSRF token cookie in response
 * @param {Object} res - Next.js response object
 * @param {string} token - CSRF token
 */
export function setCSRFTokenCookie(res, token) {
  res.setHeader('Set-Cookie', [
    `${CSRF_TOKEN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
  ]);
}

/**
 * Get CSRF token endpoint - returns token for client to use
 * This should be called by the client to get a CSRF token
 */
export async function getCSRFTokenHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const token = generateCSRFToken();
  setCSRFTokenCookie(res, token);
  
  return res.status(200).json({ csrfToken: token });
}

export default {
  generateCSRFToken,
  validateCSRFToken,
  withCSRFProtection,
  setCSRFTokenCookie,
  getCSRFTokenHandler,
  CSRF_TOKEN_COOKIE,
  CSRF_TOKEN_HEADER,
};

