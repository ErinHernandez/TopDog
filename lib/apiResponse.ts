/**
 * Standardized API Response Envelope
 *
 * Provides a consistent response format for all API endpoints with:
 * - Structured success/error responses
 * - Request ID tracking for correlation
 * - Automatic timestamp and version tracking
 * - Organized error details
 *
 * @example
 * ```ts
 * // Success response
 * sendSuccess(res, { userId: '123', name: 'John' }, 200);
 *
 * // Error response
 * sendError(res, 'INVALID_INPUT', 'Email is required', 400);
 *
 * // Validation errors
 * sendValidationError(res, [
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'age', message: 'Must be at least 18' }
 * ]);
 * ```
 */

import { randomUUID } from 'crypto';

import type { NextApiRequest, NextApiResponse } from 'next';

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standard API response envelope for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Validation error details
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
  code?: string;
}

/**
 * Error response with validation errors
 */
export interface ValidationErrorResponse extends ApiResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      errors: ValidationErrorItem[];
    };
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** API version from package.json or environment */
const API_VERSION = process.env.API_VERSION || '1.0.0';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique request ID for request correlation
 * Uses UUID v4 for guaranteed uniqueness
 *
 * @returns {string} Unique request identifier
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Get current ISO timestamp
 *
 * @returns {string} ISO 8601 timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create base response metadata
 *
 * @param {string} requestId - Request identifier
 * @returns {ApiResponse['meta']} Response metadata
 */
function createMeta(requestId: string): ApiResponse['meta'] {
  return {
    timestamp: getTimestamp(),
    requestId,
    version: API_VERSION,
  };
}

// ============================================================================
// RESPONSE FUNCTIONS
// ============================================================================

/**
 * Send a success response
 *
 * Automatically sets the correct status code and response headers.
 * Does not log success responses to reduce noise.
 *
 * @template T - Data type
 * @param {NextApiResponse} res - Next.js response object
 * @param {T} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {void}
 */
export function sendSuccess<T = unknown>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
): void {
  const requestId = (res.getHeader('X-Request-ID') as string) || generateRequestId();

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Content-Type', 'application/json');

  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  };

  res.status(statusCode).json(response);
}

/**
 * Send an error response
 *
 * Automatically logs the error and sets appropriate headers.
 * Includes error code, message, and optional details.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {string} code - Error code (e.g., 'INVALID_INPUT')
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {unknown} details - Optional error details
 * @returns {void}
 */
export function sendError(
  res: NextApiResponse,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): void {
  const requestId = (res.getHeader('X-Request-ID') as string) || generateRequestId();

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Content-Type', 'application/json');

  // Log error (but not in production for sensitive info)
  serverLogger.error(message, null, {
    requestId,
    code,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: createMeta(requestId),
  };

  res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 *
 * Specifically for request validation failures (400 Bad Request).
 * Includes detailed field-level error information.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {ValidationErrorItem[]} errors - Array of validation errors
 * @returns {void}
 */
export function sendValidationError(
  res: NextApiResponse,
  errors: ValidationErrorItem[]
): void {
  const requestId = (res.getHeader('X-Request-ID') as string) || generateRequestId();

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Content-Type', 'application/json');

  serverLogger.warn('Validation error', null, {
    requestId,
    errorCount: errors.length,
    errors: errors.map(e => `${e.field}: ${e.message}`),
  });

  const response: ValidationErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: {
        errors,
      },
    },
    meta: createMeta(requestId),
  };

  res.status(400).json(response);
}

/**
 * Send a "not found" error response
 *
 * 404 response for missing resources.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {string} resource - Resource name (e.g., 'User', 'Draft')
 * @returns {void}
 */
export function sendNotFound(res: NextApiResponse, resource: string): void {
  sendError(
    res,
    'NOT_FOUND',
    `${resource} not found`,
    404
  );
}

/**
 * Send an "unauthorized" error response
 *
 * 401 response for missing or invalid authentication.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {string} message - Custom message (default: generic)
 * @returns {void}
 */
export function sendUnauthorized(
  res: NextApiResponse,
  message: string = 'Authentication required'
): void {
  sendError(
    res,
    'UNAUTHORIZED',
    message,
    401
  );
}

/**
 * Send a "forbidden" error response
 *
 * 403 response for authenticated users without required permissions.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {string} message - Custom message (default: generic)
 * @returns {void}
 */
export function sendForbidden(
  res: NextApiResponse,
  message: string = 'Access denied'
): void {
  sendError(
    res,
    'FORBIDDEN',
    message,
    403
  );
}

/**
 * Send a "rate limited" error response
 *
 * 429 response when rate limit is exceeded.
 * Includes Retry-After header for client guidance.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {number} retryAfter - Seconds to wait before retry (optional)
 * @returns {void}
 */
export function sendRateLimited(
  res: NextApiResponse,
  retryAfter?: number
): void {
  const requestId = (res.getHeader('X-Request-ID') as string) || generateRequestId();

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Content-Type', 'application/json');

  if (retryAfter) {
    res.setHeader('Retry-After', Math.ceil(retryAfter / 1000).toString());
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: retryAfter ? { retryAfterMs: retryAfter } : undefined,
    },
    meta: createMeta(requestId),
  };

  res.status(429).json(response);
}

/**
 * Send a server error response
 *
 * 500 response for unexpected server errors.
 * Logs the error for debugging purposes.
 *
 * @param {NextApiResponse} res - Next.js response object
 * @param {Error} error - Error object for logging
 * @returns {void}
 */
export function sendServerError(
  res: NextApiResponse,
  error: Error
): void {
  const requestId = (res.getHeader('X-Request-ID') as string) || generateRequestId();

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Content-Type', 'application/json');

  // Log the error with full context
  serverLogger.error('Internal server error', error, {
    requestId,
    errorName: error.name,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message || 'An unexpected error occurred',
    },
    meta: createMeta(requestId),
  };

  res.status(500).json(response);
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Middleware to inject request ID into response
 *
 * Should be called early in the request pipeline to ensure
 * all responses include the request ID.
 *
 * @param {NextApiRequest} req - Next.js request object
 * @param {NextApiResponse} res - Next.js response object
 * @param {Function} next - Next middleware
 * @returns {void}
 */
export function withRequestId(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
): void {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  res.setHeader('X-Request-ID', requestId);

  // Inject into request for use in handlers
  (req as NextApiRequest & { requestId: string }).requestId = requestId;

  next();
}

// ============================================================================
// EXPORTS
// ============================================================================

const apiResponse = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimited,
  sendServerError,
  generateRequestId,
  withRequestId,
};

export default apiResponse;
