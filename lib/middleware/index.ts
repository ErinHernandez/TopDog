/**
 * Middleware Module Exports
 *
 * Central export point for all middleware functions used in Next.js API routes.
 * Provides composable middleware for authentication, CSRF protection, logging, etc.
 *
 * @module lib/middleware
 */

// CSRF Protection Middleware
export {
  withCSRFProtection,
  validateCSRFToken,
  generateCSRFToken,
  setCSRFTokenCookie,
  getCSRFTokenFromCookie,
  verifyCsrfToken,
  getCSRFTokenHandler,
  CSRF_TOKEN_COOKIE,
  CSRF_TOKEN_HEADER,
} from '../csrfProtection';

// Compliance Check Middleware
export { withComplianceCheck, checkUserCompliance } from './complianceCheck';

// Export types
export type { ApiHandler } from '../csrfProtection';

/**
 * Common middleware configuration constants
 */
export const MIDDLEWARE_CONFIG = {
  CSRF: {
    tokenCookieName: 'csrf-token',
    tokenHeaderName: 'x-csrf-token',
    maxAge: 3600, // 1 hour
    sameSite: 'Strict' as const,
    httpOnly: true,
    secure: true,
  },
  RATE_LIMITING: {
    enabled: true,
    failClosed: true,
    circuitBreakerThreshold: 5,
  },
} as const;

/**
 * Exempt paths from CSRF protection (use signature verification instead)
 */
export const CSRF_EXEMPT_PATTERNS = [
  // Webhook handlers - use signature verification
  /\/api\/.+\/webhook(s)?$/i,
  // NextAuth routes - use session tokens
  /\/api\/auth\/\[\.\.\.nextauth\]$/i,
  // Health check endpoints
  /\/api\/health/i,
];

/**
 * Check if a route should be exempt from CSRF protection
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATTERNS.some(pattern => pattern.test(pathname));
}
