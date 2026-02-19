/**
 * Timing Attack Prevention Utilities
 *
 * Provides middleware and utilities to prevent timing attacks by ensuring
 * consistent response times regardless of whether operations succeed or fail.
 *
 * This is critical for security-sensitive operations like:
 * - Username availability checks
 * - User authentication
 * - Account enumeration prevention
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Handler type for API routes
 */
export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Ensures consistent response timing to prevent timing attacks
 *
 * @param {number} startTimeMs - Start time in milliseconds (from Date.now())
 * @param {number} minResponseTimeMs - Minimum response time in milliseconds
 * @returns {Promise<void>} Resolves after adding necessary delay
 *
 * @example
 * ```ts
 * const startTime = Date.now();
 * // ... do some work ...
 * await ensureMinResponseTime(startTime, 100);
 * res.json({ success: true });
 * ```
 */
export async function ensureMinResponseTime(
  startTimeMs: number,
  minResponseTimeMs: number
): Promise<void> {
  const elapsed = Date.now() - startTimeMs;
  if (elapsed < minResponseTimeMs) {
    const delayMs = minResponseTimeMs - elapsed;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Wrapper for API handlers that enforces consistent response timing
 *
 * @param {ApiHandler} handler - The API handler function
 * @param {number} minResponseTimeMs - Minimum response time in milliseconds (default: 100)
 * @returns {ApiHandler} Wrapped handler with timing enforcement
 *
 * @example
 * ```ts
 * export default withConsistentTiming(
 *   async (req, res) => {
 *     // ... handler logic ...
 *     res.json({ success: true });
 *   },
 *   150 // Ensure at least 150ms response time
 * );
 * ```
 */
export function withConsistentTiming(
  handler: ApiHandler,
  minResponseTimeMs: number = 100
): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const startTime = Date.now();

    // Wrap the response methods to ensure timing after response is sent
    const originalJson = res.json.bind(res);
    const originalEnd = res.end.bind(res);
    let responseSent = false;

    // Track when response is about to be sent
    const sendResponse = async (callback: () => void): Promise<void> => {
      if (!responseSent) {
        responseSent = true;
        await ensureMinResponseTime(startTime, minResponseTimeMs);
      }
      callback();
    };

    // Patch res.json()
    res.json = function(body: unknown): NextApiResponse {
      sendResponse(() => originalJson(body)).catch(err => {
        console.error('Timing enforcement error:', err);
      });
      return res;
    };

    // Patch res.end()
    res.end = function(chunk?: unknown, encoding?: unknown): NextApiResponse {
      sendResponse(() => {
        if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
          originalEnd(chunk, encoding as BufferEncoding);
        } else {
          originalEnd();
        }
      }).catch(err => {
        console.error('Timing enforcement error:', err);
      });
      return res;
    };

    // Execute the handler
    await handler(req, res);
  };
}

/**
 * Configuration for timing attack prevention
 */
export const TIMING_CONSTANTS = {
  // Minimum response times for various operations
  USERNAME_CHECK_MS: 100,        // Username availability checks
  USERNAME_CHANGE_MS: 150,       // Username change operations
  SIGNUP_MS: 150,                // Signup operations
  AUTH_MS: 100,                  // Authentication operations

  // These should be consistent across all timing-sensitive endpoints
} as const;

/**
 * Type for timing-sensitive operations
 */
export type TimingSensitiveOperation = keyof typeof TIMING_CONSTANTS;

/**
 * Get the minimum response time for a given operation type
 */
export function getMinResponseTime(operation: TimingSensitiveOperation): number {
  return TIMING_CONSTANTS[operation];
}
