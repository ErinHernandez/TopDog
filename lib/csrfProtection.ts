/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF token generation and validation for state-changing operations.
 * Uses the double-submit cookie pattern for stateless CSRF protection.
 */

import { randomBytes, timingSafeEqual } from 'crypto';

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
 * Validate CSRF token from request using constant-time comparison
 * @param {NextApiRequest} req - Next.js request object
 * @returns {boolean} True if token is valid
 */
export function validateCSRFToken(req: NextApiRequest): boolean {
  // Get token from header (normalize header name to lowercase)
  const headerToken = req.headers[CSRF_TOKEN_HEADER] as string | undefined;

  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];

  // Both must be present
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Both must have content
  if (headerToken.length === 0 || cookieToken.length === 0) {
    return false;
  }

  // Convert to buffers for constant-time comparison
  const headerBuffer = Buffer.from(headerToken, 'utf8');
  const cookieBuffer = Buffer.from(cookieToken, 'utf8');

  // Length check - perform dummy comparison to maintain constant timing
  if (headerBuffer.length !== cookieBuffer.length) {
    // Dummy comparison to prevent length oracle attacks
    timingSafeEqual(cookieBuffer, cookieBuffer);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerBuffer, cookieBuffer);
}

/**
 * API route handler type
 */
export type ApiHandler = (
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
  const domain = process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname
    : undefined;

  const cookieAttributes = [
    `${CSRF_TOKEN_COOKIE}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=3600',
  ];

  // Add Domain attribute if available (prevents subdomain access to parent domain cookies)
  if (domain && domain !== 'localhost') {
    cookieAttributes.push(`Domain=${domain}`);
  }

  res.setHeader('Set-Cookie', [cookieAttributes.join('; ')]);
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
