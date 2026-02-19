/**
 * withErrorCapture — API Error Wrapper Middleware
 *
 * Higher-order function that wraps Next.js API handlers with try/catch
 * and integrates with Sentry and structured logger.
 *
 * Features:
 * - Automatic error logging with structured logger
 * - Sentry integration for error tracking
 * - Request correlation via x-request-id header
 * - Consistent error response format
 * - Request ID tracking in X-Request-Id response header
 *
 * @module lib/middleware/withErrorCapture
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/structuredLogger';
import * as Sentry from '@sentry/nextjs';

/* ================================================================
   Types
   ================================================================ */

export type NextApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => void | Promise<void>;

interface ErrorResponse {
  error: string;
  requestId: string;
}

/* ================================================================
   Middleware: withErrorCapture
   ================================================================ */

/**
 * Wraps a Next.js API handler with error handling, logging, and Sentry integration.
 *
 * Usage:
 *   export default withErrorCapture(async (req, res) => {
 *     res.json({ data: 'success' });
 *   });
 *
 * @param handler - The API handler to wrap
 * @returns A wrapped handler with error handling
 */
export function withErrorCapture(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Extract or generate request ID from x-request-id header
    const incomingRequestId = Array.isArray(req.headers['x-request-id'])
      ? req.headers['x-request-id'][0]
      : req.headers['x-request-id'];

    const requestId = incomingRequestId || generateRequestId();

    // Set response header with request ID
    res.setHeader('X-Request-Id', requestId);

    // Create request-scoped logger
    const reqLogger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    // Log incoming request
    reqLogger.debug('Incoming API request', {
      query: req.query,
      // Don't log full body for security; we'll handle specific fields in handlers
    });

    try {
      // Call the actual handler
      await handler(req, res);
    } catch (error) {
      // Log error with structured logger (which triggers Sentry)
      reqLogger.error(
        'API handler error',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId,
          statusCode: res.statusCode,
        }
      );

      // Capture with Sentry for additional context
      try {
        Sentry.captureException(error, {
          tags: {
            requestId,
            method: req.method,
            route: req.url,
          },
          extra: {
            requestId,
            method: req.method,
            path: req.url,
            statusCode: res.statusCode,
          },
        });
      } catch {
        // Sentry not available — continue gracefully
      }

      // Return consistent error response if not already sent
      if (!res.headersSent) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
        res.status(statusCode);

        const errorResponse: ErrorResponse = {
          error: errorMessage,
          requestId,
        };

        res.json(errorResponse);
      }
    }
  };
}

/* ================================================================
   Helpers
   ================================================================ */

/**
 * Generate a unique request ID using crypto.randomUUID.
 * Format: UUID v4 (36 chars including hyphens)
 */
function generateRequestId(): string {
  // Check if we can use crypto module (Node.js environment)
  if (typeof require !== 'undefined') {
    try {
      const { randomUUID } = require('crypto');
      return randomUUID();
    } catch {
      // Fallback to manual generation
    }
  }

  // Fallback UUID v4-like generation
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default withErrorCapture;
