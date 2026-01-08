/**
 * Input Sanitization Utilities
 * 
 * Provides utilities for sanitizing user input to prevent injection attacks,
 * XSS, and other security vulnerabilities.
 */

/**
 * Sanitize a string to prevent XSS and injection attacks
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
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
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
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

/**
 * Sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
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
    const sanitized = {};
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

/**
 * Validate and sanitize email address
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }

  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Additional length check
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeURL(url, options = {}) {
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

/**
 * Sanitize username (alphanumeric + underscore, dash)
 * @param {string} username - Username to sanitize
 * @returns {string|null} Sanitized username or null if invalid
 */
export function sanitizeUsername(username) {
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

/**
 * Sanitize numeric input
 * @param {string|number} input - Input to sanitize
 * @param {Object} options - Validation options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
  } = options;

  let num;

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

/**
 * Sanitize ID (alphanumeric, dash, underscore)
 * @param {string} id - ID to sanitize
 * @returns {string|null} Sanitized ID or null if invalid
 */
export function sanitizeID(id) {
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

/**
 * Sanitize SQL-like patterns to prevent injection
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeSQLPattern(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/['";\\]/g, '') // Remove SQL special chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '');
}

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizeURL,
  sanitizeUsername,
  sanitizeNumber,
  sanitizeID,
  sanitizeSQLPattern,
};

