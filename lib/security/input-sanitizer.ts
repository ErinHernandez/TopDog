/**
 * Input Sanitization & Validation Utilities
 * Prevents XSS, SQL/NoSQL injection, path traversal, and prompt injection attacks
 * @module lib/security/input-sanitizer
 */

/**
 * Sanitizes HTML by removing dangerous tags and attributes
 * Prevents XSS attacks in user-generated content (gallery posts, comments, prompts)
 *
 * @param input - HTML string to sanitize
 * @returns Sanitized HTML with dangerous elements removed
 *
 * @example
 * const dirty = '<img src=x onerror="alert(1)"><script>alert("xss")</script>';
 * const clean = sanitizeHTML(dirty);
 * // Returns: '&lt;img src=x&gt;'
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // List of dangerous tags that will be completely removed
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'style',
    'meta',
    'base',
  ];

  let output = input;

  // Remove all dangerous tags and their content
  for (const tag of dangerousTags) {
    const regex = new RegExp(
      `<${tag}[^>]*>.*?</${tag}>|<${tag}[^>]*/>`,
      'gis'
    );
    output = output.replace(regex, '');
  }

  // Remove dangerous attributes from all tags
  const dangerousAttrs = [
    'onerror',
    'onload',
    'onmouseover',
    'onclick',
    'onkeydown',
    'onkeyup',
    'onchange',
    'onfocus',
    'onblur',
    'javascript:',
    'data:text/html',
  ];

  for (const attr of dangerousAttrs) {
    const regex = new RegExp(
      `\\s*${attr}\\s*=\\s*["']?[^"'\\s>]*["']?`,
      'gi'
    );
    output = output.replace(regex, '');
  }

  // HTML encode all remaining content to be extra safe
  output = output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return output;
}

/**
 * Sanitizes filenames to prevent path traversal attacks
 * Removes directory traversal sequences and null bytes
 *
 * @param name - Filename to sanitize
 * @returns Safe filename
 *
 * @example
 * sanitizeFilename('../../etc/passwd.txt') // Returns: 'etcpasswd.txt'
 * sanitizeFilename('file\0.txt') // Returns: 'file.txt'
 */
export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') return 'file';

  // Remove null bytes
  let safe = name.replace(/\0/g, '');

  // Remove path traversal sequences
  safe = safe.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Remove any non-alphanumeric characters except dots, hyphens, underscores
  safe = safe.replace(/[^a-zA-Z0-9._\-]/g, '');

  // Remove leading dots to prevent hidden files
  safe = safe.replace(/^\.+/, '');

  // Prevent empty filenames
  if (!safe || safe.length === 0) {
    safe = 'file';
  }

  // Limit length to 255 characters (filesystem limit)
  safe = safe.substring(0, 255);

  return safe;
}

/**
 * Sanitizes AI prompts to prevent prompt injection attacks
 * Removes control characters, SQL keywords, and shell commands
 *
 * @param prompt - User prompt to sanitize
 * @returns Sanitized prompt safe for AI processing
 *
 * @example
 * sanitizePrompt('Generate image; DELETE FROM users;')
 * // Returns: 'Generate image  FROM users'
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '';

  let safe = prompt;

  // Remove null bytes and control characters
  safe = safe.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  // Remove SQL keywords that might be used for injection
  const sqlKeywords = [
    'DELETE',
    'DROP',
    'INSERT',
    'UPDATE',
    'UNION',
    'SELECT',
    'EXEC',
    'EXECUTE',
  ];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    safe = safe.replace(regex, '');
  }

  // Remove shell metacharacters
  safe = safe.replace(/[|&;$()><`\\]/g, ' ');

  // Limit prompt length to 10,000 characters to prevent token exhaustion
  safe = safe.substring(0, 10000);

  // Remove excessive whitespace
  safe = safe.replace(/\s+/g, ' ').trim();

  return safe;
}

/**
 * Validates URLs to prevent SSRF attacks and malicious redirects
 * Checks for valid URL format, disallows private IP ranges
 *
 * @param url - URL string to validate
 * @param allowedDomains - Optional list of allowed domain patterns
 * @returns true if URL is valid and safe
 *
 * @example
 * validateURL('https://example.com/image.jpg') // true
 * validateURL('http://127.0.0.1:8080') // false (localhost)
 * validateURL('https://api.example.com', ['example.com']) // true
 */
export function validateURL(
  url: string,
  allowedDomains?: string[]
): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const rawHostname = parsed.hostname;
    if (!rawHostname) return false;

    // Strip brackets from IPv6 addresses (URL parser preserves them)
    const hostname = rawHostname.replace(/^\[|\]$/g, '');

    // Block private IP ranges to prevent SSRF
    const privateRanges = [
      /^127\./,           // 127.0.0.0/8 (localhost)
      /^10\./,            // 10.0.0.0/8 (private)
      /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 (private)
      /^192\.168\./,      // 192.168.0.0/16 (private)
      /^localhost$/i,     // localhost
      /^0\.0\.0\.0$/,     // 0.0.0.0
      /^::1$/,            // IPv6 localhost
      /^::$/,             // IPv6 unspecified
      /^169\.254\./,      // 169.254.0.0/16 (link-local)
      /^fc00:/,           // IPv6 private
      /^fe80:/,           // IPv6 link-local
    ];

    for (const range of privateRanges) {
      if (range.test(hostname)) {
        return false;
      }
    }

    // Check against allowed domains if provided
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) => {
        const domainRegex = new RegExp(
          `(^|\\.)${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        );
        return domainRegex.test(hostname);
      });

      if (!isAllowed) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Image buffer validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  format: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Validates image buffer to ensure it's a legitimate image file
 * Checks file signature (magic bytes) and prevents malicious uploads
 *
 * @param buffer - Image file buffer
 * @returns Validation result with format information
 *
 * @example
 * const result = validateImageBuffer(buffer);
 * if (result.valid && result.format === 'jpeg') {
 *   // Safe to process image
 * }
 */
export function validateImageBuffer(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      format: 'unknown',
      error: 'Empty buffer',
    };
  }

  // File signature (magic bytes) checking
  const signatures: Record<string, Buffer> = {
    jpeg: Buffer.from([0xff, 0xd8, 0xff]),
    png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    gif: Buffer.from([0x47, 0x49, 0x46]),
    webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
    bmp: Buffer.from([0x42, 0x4d]),
    tiff: Buffer.from([0x49, 0x49, 0x2a, 0x00]),
  };

  let format = 'unknown';

  for (const [fmt, sig] of Object.entries(signatures)) {
    if (buffer.slice(0, sig.length).equals(sig)) {
      format = fmt;
      break;
    }
  }

  // Only allow specific image formats
  const allowedFormats = ['jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
  if (!allowedFormats.includes(format)) {
    return {
      valid: false,
      format: 'unknown',
      error: `Unsupported image format: ${format}`,
    };
  }

  // Check file size (limit to 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      format,
      error: `Image file too large: ${buffer.length} bytes (max ${maxSize})`,
    };
  }

  return {
    valid: true,
    format,
  };
}

/**
 * Escapes strings for safe Firestore storage
 * Prevents NoSQL injection by sanitizing special characters
 *
 * @param value - String value to escape
 * @returns Escaped string safe for Firestore
 *
 * @example
 * escapeForFirestore('user@example.com') // Returns: 'user@example.com'
 */
export function escapeForFirestore(value: string): string {
  if (!value || typeof value !== 'string') return '';

  // Firestore doesn't require escaping like traditional databases,
  // but we should prevent document traversal characters
  return value
    .replace(/\./g, '\\.')
    .replace(/\//g, '\\/')
    .substring(0, 1500); // Firestore has string size limits
}

/**
 * Validates email addresses with basic format checking
 * Uses regex for common email validation
 *
 * @param email - Email address to validate
 * @returns true if email appears valid
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid.email') // false
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitizes JSON strings to prevent injection
 * Validates JSON structure before parsing
 *
 * @param jsonString - JSON string to sanitize
 * @returns Parsed object or null if invalid
 *
 * @example
 * const obj = sanitizeJSON('{"key":"value"}');
 * const malicious = sanitizeJSON('{"key":"value"}<script>');
 */
export function sanitizeJSON(jsonString: string): Record<string, any> | null {
  if (!jsonString || typeof jsonString !== 'string') return null;

  try {
    // Strict JSON parsing
    const parsed = JSON.parse(jsonString);

    // Ensure it's an object or array
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates numeric inputs to prevent integer overflow and type confusion
 *
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns true if value is a valid number within bounds
 *
 * @example
 * validateNumber('100', 0, 1000) // true
 * validateNumber('abc', 0, 1000) // false
 */
export function validateNumber(
  value: unknown,
  min?: number,
  max?: number
): boolean {
  if (value === null || value === undefined) return false;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (!Number.isFinite(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  return true;
}
