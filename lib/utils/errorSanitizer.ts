/**
 * Error Sanitization Utilities
 *
 * Strips sensitive information from error messages before sending to clients.
 * In production, returns generic error messages. In development, returns full details.
 *
 * Sensitive patterns removed:
 * - API keys (Stripe, Firebase, etc.)
 * - Firebase project IDs
 * - Database collection names
 * - File paths
 * - Stack traces
 * - Internal service details
 */

/**
 * Sanitize error message for client response
 *
 * @param error - The error to sanitize
 * @param isDevelopment - Whether in development mode (defaults to NODE_ENV check)
 * @returns Generic error message in production, detailed message in development
 */
export function sanitizeErrorForClient(
  error: unknown,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): string {
  // In development, expose full error details for debugging
  if (isDevelopment) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, return generic message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Sanitize error details object to prevent information leakage
 * Removes sensitive fields that might expose internal implementation
 *
 * @param details - Error details to sanitize
 * @param isDevelopment - Whether in development mode
 * @returns Sanitized details object
 */
export function sanitizeErrorDetails(
  details: Record<string, unknown>,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): Record<string, unknown> {
  // In development, keep all details
  if (isDevelopment) {
    return details;
  }

  // In production, filter out sensitive information
  const sanitized: Record<string, unknown> = {};
  const sensitivePatterns = [
    /key/i,
    /secret/i,
    /api[_-]?key/i,
    /password/i,
    /token/i,
    /credential/i,
    /stripe/i,
    /firebase/i,
    /database/i,
    /collection/i,
    /path/i,
    /stack/i,
    /trace/i,
    /endpoint/i,
    /url/i,
    /host/i,
    /port/i,
  ];

  for (const [key, value] of Object.entries(details)) {
    // Skip sensitive keys
    const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
    if (isSensitive) {
      continue;
    }

    // Skip object/array values that might contain sensitive nested data
    if (typeof value === 'object' && value !== null) {
      continue;
    }

    // Skip very long strings that might be stack traces or full error messages
    if (typeof value === 'string' && value.length > 200) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Sanitize a full error object for logging/response
 * Removes patterns that might leak sensitive information
 *
 * @param error - The error object to sanitize
 * @param isDevelopment - Whether in development mode
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(
  error: Error | unknown,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): string {
  if (isDevelopment) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, remove sensitive patterns
  const message = error instanceof Error ? error.message : String(error);

  // Patterns to remove or mask
  const sensitivePatterns = [
    { pattern: /sk_live_[a-zA-Z0-9_-]+/g, replacement: '[REDACTED_API_KEY]' },
    { pattern: /sk_test_[a-zA-Z0-9_-]+/g, replacement: '[REDACTED_API_KEY]' },
    { pattern: /rk_live_[a-zA-Z0-9_-]+/g, replacement: '[REDACTED_KEY]' },
    { pattern: /firebase[_-]?[a-z_-]*[_-]?key/gi, replacement: '[REDACTED_KEY]' },
    { pattern: /apiKey[=:]\s*['"][^'"]+['"]/gi, replacement: 'apiKey=[REDACTED]' },
    { pattern: /projectId[=:]\s*['"][^'"]+['"]/gi, replacement: 'projectId=[REDACTED]' },
    { pattern: /collection[=:]\s*['"][^'"]+['"]/gi, replacement: 'collection=[REDACTED]' },
    { pattern: /\/\w+\/firebase\/[^/\s]+/g, replacement: '[REDACTED_PATH]' },
    { pattern: /\/home\/[^\s/]+/g, replacement: '[REDACTED_PATH]' },
    { pattern: /\/var\/[^\s/]+/g, replacement: '[REDACTED_PATH]' },
    { pattern: /c:\\users\\[^\s\\]+/gi, replacement: '[REDACTED_PATH]' },
    { pattern: /at\s+[\w\.]+\s+\([^)]+\)/g, replacement: '[REDACTED_STACK]' },
    { pattern: /Error:\s*at\s+/g, replacement: 'Error: ' },
  ];

  let sanitized = message;
  for (const { pattern, replacement } of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // If the message is too long, it's likely a stack trace - truncate it
  if (sanitized.length > 500) {
    sanitized = `${sanitized.substring(0, 200)  }[...truncated...]`;
  }

  // If the message is empty after sanitization, use generic message
  if (!sanitized.trim()) {
    return 'An unexpected error occurred. Please try again.';
  }

  return sanitized;
}

/**
 * Check if an error message contains sensitive information
 *
 * @param message - Error message to check
 * @returns true if sensitive information is detected
 */
export function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /sk_live_[a-zA-Z0-9_-]+/,
    /sk_test_[a-zA-Z0-9_-]+/,
    /rk_live_[a-zA-Z0-9_-]+/,
    /firebase[_-]?[a-z_-]*[_-]?key/i,
    /apiKey/i,
    /projectId/i,
    /collection/i,
    /\/\w+\/firebase\//,
    /\/home\/\w+/,
    /\/var\/\w+/,
    /c:\\users\\/i,
    /at\s+[\w\.]+\s+\(/,
  ];

  return sensitivePatterns.some(pattern => pattern.test(message));
}
