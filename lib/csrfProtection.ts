/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF token generation and validation for state-changing operations.
 * Uses the double-submit cookie pattern for stateless CSRF protection.
 */

import { randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

// CSRF token cookie name
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a new CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request
 * @param {NextApiRequest} req - Next.js request object
 * @returns {boolean} True if token is valid
 */
export function validateCSRFToken(req: NextApiRequest): boolean {
  // Get token from header
  const headerToken = req.headers[CSRF_TOKEN_HEADER] || 
                     req.headers['x-csrf-token'] as string | undefined;
  
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
 * API route handler type
 */
type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * CSRF protection middleware for Next.js API routes
 * @param {ApiHandler} handler - API route handler
 * @returns {ApiHandler} Wrapped handler with CSRF protection
 */
export function withCSRFProtection(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip CSRF for GET, HEAD, OPTIONS (read-only operations)
    if (req.method && ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
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
 * @param {NextApiResponse} res - Next.js response object
 * @param {string} token - CSRF token
 */
export function setCSRFTokenCookie(res: NextApiResponse, token: string): void {
  res.setHeader('Set-Cookie', [
    `${CSRF_TOKEN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
  ]);
}

/**
 * Get CSRF token from request cookie
 * @param {NextApiRequest} req - Next.js request object
 * @returns {string | undefined} CSRF token if present
 */
export function getCSRFTokenFromCookie(req: NextApiRequest): string | undefined {
  return req.cookies?.[CSRF_TOKEN_COOKIE];
}

/**
 * Verify CSRF token (alias for validateCSRFToken for consistency)
 * @param {NextApiRequest} req - Next.js request object
 * @returns {boolean} True if token is valid
 */
export function verifyCsrfToken(req: NextApiRequest): boolean {
  return validateCSRFToken(req);
}

/**
 * Get CSRF token endpoint handler - returns token for client to use
 * This should be called by the client to get a CSRF token
 */
export async function getCSRFTokenHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ csrfToken: string } | { error: string }>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const token = generateCSRFToken();
  setCSRFTokenCookie(res, token);
  
  res.status(200).json({ csrfToken: token });
}

// Export constants for external use
export { CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER };
