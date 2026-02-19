/**
 * Input Sanitization Utilities
 * 
 * Provides utilities for sanitizing user input to prevent injection attacks,
 * XSS, and other security vulnerabilities.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for string sanitization
 */
export interface SanitizeStringOptions {
  /** Maximum length of the string (default: 10000) */
  maxLength?: number;
  /** Allow HTML tags (default: false) */
  allowHTML?: boolean;
  /** Allow special characters (default: true) */
  allowSpecialChars?: boolean;
  /** Trim whitespace (default: true) */
  trim?: boolean;
}

/**
 * Options for URL sanitization
 */
export interface SanitizeURLOptions {
  /** Allowed URL protocols (default: ['http:', 'https:']) */
  allowedProtocols?: string[];
  /** Require protocol in URL (default: true) */
  requireProtocol?: boolean;
}

/**
 * Options for number sanitization
 */
export interface SanitizeNumberOptions {
  /** Minimum value (default: -Infinity) */
  min?: number;
  /** Maximum value (default: Infinity) */
  max?: number;
  /** Require integer (default: false) */
  integer?: boolean;
}

// ============================================================================
// STRING SANITIZATION
// ============================================================================

/**
 * Comprehensive XSS prevention patterns
 * Matches common XSS attack vectors
 */
const XSS_PATTERNS = [
  /on\w+\s*=/gi,                    // Event handlers: onclick=, onerror=, onload=, etc.
  /javascript:/gi,                   // JavaScript protocol
  /data:text\/html/gi,               // Data URIs with HTML
  /vbscript:/gi,                     // VBScript protocol
  /<script[^>]*>.*?<\/script>/gi,   // Script tags
  /<iframe[^>]*>.*?<\/iframe>/gi,   // IFrame tags
  /<object[^>]*>.*?<\/object>/gi,   // Object tags
  /<embed[^>]*>/gi,                  // Embed tags
  /<link[^>]*>/gi,                   // Link tags
  /<style[^>]*>.*?<\/style>/gi,     // Style tags
  /expression\s*\(/gi,               // CSS expressions
];

/**
 * Sanitize a string to prevent XSS and injection attacks
 * @param {string | unknown} input - Input string to sanitize
 * @param {SanitizeStringOptions} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(
  input: string | unknown,
  options: SanitizeStringOptions = {}
): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  const {
    maxLength = 10000,
    allowHTML = false,
    allowSpecialChars = true,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML tags if not allowed
  if (!allowHTML) {
    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')  // Must be first to avoid double-encoding
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Remove dangerous event handlers and attributes
    sanitized = sanitized
      .replace(/on\w+\s*=/gi, '')  // onclick=, onerror=, onload=, etc.
      .replace(/javascript:/gi, '')  // javascript: protocol
      .replace(/data:/gi, '')  // data: URIs
      .replace(/vbscript:/gi, '');  // vbscript: protocol
  }

  // Remove potentially dangerous characters if not allowed
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[<>\"'\/\\]/g, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

// ============================================================================
// OBJECT SANITIZATION
// ============================================================================

/**
 * Sanitize an object recursively
 * @param {unknown} obj - Object to sanitize
 * @param {SanitizeStringOptions} options - Sanitization options
 * @returns {unknown} Sanitized object
 */
export function sanitizeObject(
  obj: unknown,
  options: SanitizeStringOptions = {}
): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(String(key), { ...options, allowSpecialChars: false });
      // Sanitize value
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
}

// ============================================================================
// EMAIL SANITIZATION
// ============================================================================

/**
 * Validate and sanitize email address
 *
 * Uses RFC 5321/5322-aligned validation:
 *  - Local part: alphanumeric + allowed specials (._%+-), no leading/trailing/consecutive dots
 *  - Domain: valid hostname labels (alphanumeric + hyphens), TLD 2-63 chars
 *  - Overall length: max 254 (RFC 5321), local max 64 (RFC 5321)
 *
 * @param {string | unknown} email - Email to validate
 * @returns {string | null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string | unknown): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const sanitized = email.trim().toLowerCase();

  // Overall length check (RFC 5321: max 254 octets for a mailbox)
  if (sanitized.length > 254 || sanitized.length === 0) {
    return null;
  }

  // Must have exactly one @ sign
  const atIndex = sanitized.indexOf('@');
  if (atIndex === -1 || sanitized.lastIndexOf('@') !== atIndex) {
    return null;
  }

  const local = sanitized.slice(0, atIndex);
  const domain = sanitized.slice(atIndex + 1);

  // Local part validation (RFC 5321: max 64 octets)
  if (local.length === 0 || local.length > 64) {
    return null;
  }

  // Local part: alphanumeric + allowed specials, no leading/trailing/consecutive dots
  const localRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?$/;
  if (!localRegex.test(local)) {
    return null;
  }
  if (local.includes('..')) {
    return null;
  }

  // Domain validation: valid hostname with TLD
  // Each label: 1-63 chars, alphanumeric + hyphens, no leading/trailing hyphens
  // TLD: 2-63 chars, letters only
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
  if (!domainRegex.test(domain)) {
    return null;
  }

  return sanitized;
}

// ============================================================================
// URL SANITIZATION
// ============================================================================

/**
 * Validate and sanitize URL
 * @param {string | unknown} url - URL to validate
 * @param {SanitizeURLOptions} options - Validation options
 * @returns {string | null} Sanitized URL or null if invalid
 */
export function sanitizeURL(
  url: string | unknown,
  options: SanitizeURLOptions = {}
): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const {
    allowedProtocols = ['http:', 'https:'],
    requireProtocol = true,
  } = options;

  let sanitized = url.trim();

  // Add protocol if required and missing
  if (requireProtocol && !sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
    sanitized = `https://${sanitized}`;
  }

  try {
    const urlObj = new URL(sanitized);
    
    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }

    return sanitized;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// USERNAME SANITIZATION
// ============================================================================

/**
 * Sanitize username (alphanumeric + underscore, dash)
 * @param {string | unknown} username - Username to sanitize
 * @returns {string | null} Sanitized username or null if invalid
 */
export function sanitizeUsername(username: string | unknown): string | null {
  if (typeof username !== 'string') {
    return null;
  }

  const sanitized = username.trim();
  
  // Username validation: 3-30 chars, alphanumeric, underscore, dash
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  
  if (!usernameRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

// ============================================================================
// NUMBER SANITIZATION
// ============================================================================

/**
 * Sanitize numeric input
 * @param {string | number | unknown} input - Input to sanitize
 * @param {SanitizeNumberOptions} options - Validation options
 * @returns {number | null} Sanitized number or null if invalid
 */
export function sanitizeNumber(
  input: string | number | unknown,
  options: SanitizeNumberOptions = {}
): number | null {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
  } = options;

  let num: number;

  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    num = parseFloat(input);
  } else {
    return null;
  }

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (integer && !Number.isInteger(num)) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

// ============================================================================
// ID SANITIZATION
// ============================================================================

/**
 * Sanitize ID (alphanumeric, dash, underscore)
 * @param {string | unknown} id - ID to sanitize
 * @returns {string | null} Sanitized ID or null if invalid
 */
export function sanitizeID(id: string | unknown): string | null {
  if (typeof id !== 'string') {
    return null;
  }

  const sanitized = id.trim();
  
  // ID validation: 1-100 chars, alphanumeric, dash, underscore
  const idRegex = /^[a-zA-Z0-9_-]{1,100}$/;
  
  if (!idRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

// ============================================================================
// SQL PATTERN SANITIZATION
// ============================================================================

/**
 * Sanitize SQL-like patterns to prevent injection
 * @param {string | unknown} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeSQLPattern(input: string | unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/['";\\]/g, '') // Remove SQL special chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '');
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const inputSanitizationExports = {
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizeURL,
  sanitizeUsername,
  sanitizeNumber,
  sanitizeID,
  sanitizeSQLPattern,
};

export default inputSanitizationExports;
