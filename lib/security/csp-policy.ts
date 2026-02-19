/**
 * Content Security Policy Builder
 * Generates CSP headers for different environments
 * @module lib/security/csp-policy
 */

export type CSPEnvironment = 'development' | 'staging' | 'production';

/**
 * CSP directives structure
 */
interface CSPDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  childSrc: string[];
  formAction: string[];
  baseUri: string[];
  frameAncestors: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
  reportUri?: string;
}

/**
 * Build Content Security Policy header for the given environment
 * Different strictness levels for dev, staging, and production
 *
 * @param environment - Deployment environment
 * @param nonce - Optional nonce for inline scripts (recommended for production)
 * @returns CSP header string ready to be set in response headers
 *
 * @example
 * const csp = buildCSP('production', nonce);
 * res.setHeader('Content-Security-Policy', csp);
 */
export function buildCSP(
  environment: CSPEnvironment = 'production',
  nonce?: string
): string {
  const directives = getCSPDirectives(environment, nonce);
  return formatCSPHeader(directives);
}

/**
 * Get CSP directives for a specific environment
 */
function getCSPDirectives(
  environment: CSPEnvironment,
  nonce?: string
): CSPDirectives {
  const nonceAttr = nonce ? ` 'nonce-${nonce}'` : '';

  switch (environment) {
    case 'development':
      return {
        // More permissive in development for easier testing
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
        frameSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      };

    case 'staging':
      return {
        // Balanced approach for staging
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://cdn.stripe.com',
          'https://cdn.jsdelivr.net',
          'https://www.googletagmanager.com',
          nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
        ].filter(Boolean),
        styleSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
        ].filter(Boolean),
        imgSrc: [
          "'self'",
          'data:',
          'https:',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        fontSrc: ["'self'", 'data:', 'https://fonts.googleapis.com'],
        connectSrc: [
          "'self'",
          'wss:',
          'https://firebase.googleapis.com',
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://api.stripe.com',
          'https://*.firebaseio.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        mediaSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: true,
        blockAllMixedContent: true,
        reportUri: '/api/csp-report',
      };

    case 'production':
      return {
        // Strict production policy
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://cdn.stripe.com',
          'https://cdn.jsdelivr.net',
          'https://www.googletagmanager.com',
          `'nonce-${nonce || 'NONCE_PLACEHOLDER'}'`,
        ],
        styleSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          `'nonce-${nonce || 'NONCE_PLACEHOLDER'}'`,
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https:',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        fontSrc: ["'self'", 'data:', 'https://fonts.googleapis.com'],
        connectSrc: [
          "'self'",
          'wss:',
          'https://firebase.googleapis.com',
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://api.stripe.com',
          'https://*.firebaseio.com',
          'https://*.cloudfunctions.net',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        mediaSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: true,
        blockAllMixedContent: true,
        reportUri: '/api/csp-report',
      };

    default:
      return {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      };
  }
}

/**
 * Format CSP directives into header string
 */
function formatCSPHeader(directives: CSPDirectives): string {
  const parts: string[] = [];

  // Add all directives
  if (directives.defaultSrc?.length > 0) {
    parts.push(`default-src ${directives.defaultSrc.join(' ')}`);
  }
  if (directives.scriptSrc?.length > 0) {
    parts.push(`script-src ${directives.scriptSrc.join(' ')}`);
  }
  if (directives.styleSrc?.length > 0) {
    parts.push(`style-src ${directives.styleSrc.join(' ')}`);
  }
  if (directives.imgSrc?.length > 0) {
    parts.push(`img-src ${directives.imgSrc.join(' ')}`);
  }
  if (directives.fontSrc?.length > 0) {
    parts.push(`font-src ${directives.fontSrc.join(' ')}`);
  }
  if (directives.connectSrc?.length > 0) {
    parts.push(`connect-src ${directives.connectSrc.join(' ')}`);
  }
  if (directives.frameSrc?.length > 0) {
    parts.push(`frame-src ${directives.frameSrc.join(' ')}`);
  }
  if (directives.mediaSrc?.length > 0) {
    parts.push(`media-src ${directives.mediaSrc.join(' ')}`);
  }
  if (directives.objectSrc?.length > 0) {
    parts.push(`object-src ${directives.objectSrc.join(' ')}`);
  }
  if (directives.childSrc?.length > 0) {
    parts.push(`child-src ${directives.childSrc.join(' ')}`);
  }
  if (directives.formAction?.length > 0) {
    parts.push(`form-action ${directives.formAction.join(' ')}`);
  }
  if (directives.baseUri?.length > 0) {
    parts.push(`base-uri ${directives.baseUri.join(' ')}`);
  }
  if (directives.frameAncestors?.length > 0) {
    parts.push(`frame-ancestors ${directives.frameAncestors.join(' ')}`);
  }

  if (directives.upgradeInsecureRequests) {
    parts.push('upgrade-insecure-requests');
  }

  if (directives.blockAllMixedContent) {
    parts.push('block-all-mixed-content');
  }

  if (directives.reportUri) {
    parts.push(`report-uri ${directives.reportUri}`);
  }

  return parts.join('; ');
}

/**
 * Generate a random nonce for inline script/style CSP
 * Should be called fresh for each response
 *
 * @returns Base64-encoded random nonce
 *
 * @example
 * const nonce = generateNonce();
 * res.setHeader('Content-Security-Policy', buildCSP('production', nonce));
 */
export function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Build additional security headers beyond CSP
 * Complements CSP with other important security headers
 *
 * @returns Object with security header key-value pairs
 *
 * @example
 * const headers = getSecurityHeaders();
 * Object.entries(headers).forEach(([key, value]) => {
 *   res.setHeader(key, value);
 * });
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS filtering in older browsers
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Require HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Disable client-side caching for sensitive content
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',

    // Control feature permissions
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',

    // Enforce DNS prefetching control
    'X-DNS-Prefetch-Control': 'off',
  };
}

/**
 * Apply all security headers to a Next.js response
 * Convenience function for API routes
 *
 * @param res - Next.js API response object
 * @param environment - Deployment environment
 * @param nonce - Optional CSP nonce
 *
 * @example
 * export default function handler(req, res) {
 *   applySecurityHeaders(res, 'production');
 *   res.json({ data: 'secure' });
 * }
 */
export function applySecurityHeaders(
  res: any,
  environment: CSPEnvironment = 'production',
  nonce?: string
): void {
  // Apply CSP
  res.setHeader('Content-Security-Policy', buildCSP(environment, nonce));

  // Apply other security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}
