/**
 * URL Validation Utilities
 *
 * Security utilities to prevent SSRF (Server-Side Request Forgery) attacks.
 * Use these functions whenever accepting URLs from user input that will be
 * fetched server-side.
 *
 * @module lib/urlValidation
 */

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export interface URLValidationOptions {
  /** Allow only HTTPS (default: true) */
  requireHttps?: boolean;
  /** List of allowed domains (if empty, all non-internal domains allowed) */
  allowedDomains?: string[];
  /** Block private/internal IP ranges (default: true) */
  blockPrivateIPs?: boolean;
  /** Allow localhost for development (default: false) */
  allowLocalhost?: boolean;
  /** Maximum URL length (default: 2048) */
  maxLength?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Private IP ranges that should never be accessed from server
 * These ranges indicate internal/private network addresses
 */
const PRIVATE_IP_PATTERNS = [
  // IPv4 private ranges
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  // IPv4 loopback
  /^127\./,                   // 127.0.0.0/8
  // IPv4 link-local
  /^169\.254\./,              // 169.254.0.0/16
  // IPv6 private/loopback (simplified patterns)
  /^::1$/,                    // IPv6 loopback
  /^fe80:/i,                  // IPv6 link-local
  /^fc00:/i,                  // IPv6 unique local
  /^fd[0-9a-f]{2}:/i,         // IPv6 unique local
];

/**
 * Reserved/internal hostnames that should be blocked
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '*.local',
  '*.internal',
  'metadata.google.internal',      // GCP metadata
  'metadata.google.com',           // GCP metadata alias
  '169.254.169.254',               // AWS/GCP/Azure metadata
  'metadata',                      // Generic metadata
  'kubernetes.default',            // Kubernetes
  '*.kubernetes.default',
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a hostname matches any blocked pattern
 */
function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  for (const blocked of BLOCKED_HOSTNAMES) {
    if (blocked.startsWith('*.')) {
      // Wildcard pattern
      const suffix = blocked.slice(1);
      if (lowerHostname.endsWith(suffix) || lowerHostname === suffix.slice(1)) {
        return true;
      }
    } else if (lowerHostname === blocked) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a hostname looks like a private IP address
 */
function isPrivateIP(hostname: string): boolean {
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if hostname is numeric (IP address)
 */
function isNumericHost(hostname: string): boolean {
  // Simple check for IPv4 or IPv6
  return /^[\d.:[\]]+$/.test(hostname) || hostname.includes(':');
}

/**
 * Validate and sanitize a URL for safe server-side fetching
 *
 * @param url - The URL to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateExternalUrl(
  url: string,
  options: URLValidationOptions = {}
): URLValidationResult {
  const {
    requireHttps = true,
    allowedDomains = [],
    blockPrivateIPs = true,
    allowLocalhost = false,
    maxLength = 2048,
  } = options;

  // Check for empty/null URL
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  // Check length
  if (url.length > maxLength) {
    return { isValid: false, error: `URL exceeds maximum length of ${maxLength} characters` };
  }

  // Try to parse the URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  const allowedProtocols = requireHttps ? ['https:'] : ['http:', 'https:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    return {
      isValid: false,
      error: requireHttps
        ? 'Only HTTPS URLs are allowed'
        : 'Only HTTP and HTTPS URLs are allowed',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check localhost
  if (!allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
    return { isValid: false, error: 'Localhost URLs are not allowed' };
  }

  // Check blocked hostnames
  if (isBlockedHostname(hostname)) {
    serverLogger.warn('Blocked hostname in URL validation', null, {
      component: 'urlValidation',
      hostname: hostname,
    });
    return { isValid: false, error: 'This hostname is not allowed' };
  }

  // Check private IPs (if the hostname looks like an IP)
  if (blockPrivateIPs && isNumericHost(hostname) && isPrivateIP(hostname)) {
    serverLogger.warn('Private IP in URL validation', null, {
      component: 'urlValidation',
      hostname: hostname,
    });
    return { isValid: false, error: 'Private IP addresses are not allowed' };
  }

  // Check allowed domains (if specified)
  if (allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some(domain => {
      const lowerDomain = domain.toLowerCase();
      if (lowerDomain.startsWith('*.')) {
        // Wildcard domain
        const suffix = lowerDomain.slice(1);
        return hostname.endsWith(suffix) || hostname === suffix.slice(1);
      }
      return hostname === lowerDomain;
    });

    if (!isAllowed) {
      return {
        isValid: false,
        error: `URL domain not in allowed list. Allowed domains: ${allowedDomains.join(', ')}`,
      };
    }
  }

  // Check for unusual ports (potential bypass attempt)
  // Standard ports: 80 (http), 443 (https)
  if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
    // Log but don't necessarily block - depends on use case
    serverLogger.info('Non-standard port in URL', {
      component: 'urlValidation',
      port: parsed.port,
      hostname: hostname,
    });
  }

  // Check for userinfo (user:password@host) - potential bypass attempt
  if (parsed.username || parsed.password) {
    return { isValid: false, error: 'URLs with credentials are not allowed' };
  }

  // Return normalized URL (without fragments, normalized case, etc.)
  parsed.hash = ''; // Remove fragment

  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
  };
}

/**
 * Quick check if URL is safe for external fetching
 *
 * @param url - The URL to check
 * @returns true if safe, false otherwise
 */
export function isSafeExternalUrl(url: string): boolean {
  return validateExternalUrl(url).isValid;
}

/**
 * Validate URL specifically for image services (Azure Vision, etc.)
 * More restrictive - only allows common image hosting domains
 */
export function validateImageUrl(url: string): URLValidationResult {
  // First do standard validation
  const basicResult = validateExternalUrl(url, {
    requireHttps: true,
    blockPrivateIPs: true,
    allowLocalhost: false,
  });

  if (!basicResult.isValid) {
    return basicResult;
  }

  // Additional check: URL should end with image extension or be from known image hosts
  const parsed = new URL(url);
  const pathname = parsed.pathname.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  // Known image hosting services (allow any path)
  const imageHosts = [
    'imgur.com',
    'i.imgur.com',
    'cloudinary.com',
    'res.cloudinary.com',
    'images.unsplash.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'blob.core.windows.net',
    's3.amazonaws.com',
  ];

  const isKnownImageHost = imageHosts.some(host =>
    hostname === host || hostname.endsWith(`.${  host}`)
  );

  // Common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));

  // Allow if known host OR has image extension
  if (!isKnownImageHost && !hasImageExtension) {
    // Check if URL has image-like query params (some services use these)
    const hasImageParams = url.includes('format=') ||
                          url.includes('type=image') ||
                          url.includes('/image/') ||
                          url.includes('/images/');

    if (!hasImageParams) {
      serverLogger.info('URL may not be an image', {
        component: 'urlValidation',
        url: url.substring(0, 100), // Log truncated for safety
      });
      // Don't block, just warn - the image service will validate content type
    }
  }

  return basicResult;
}
