/**
 * TypeScript declarations for API Error Handler exports
 * 
 * This file provides type definitions for exports from lib/apiErrorHandler.js
 * to fix implicit 'any' type errors when using withErrorHandling and other utilities.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Scoped logger interface for API routes
 */
export interface ScopedLogger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
}

/**
 * Error handler callback function type
 */
export type ErrorHandlerCallback = (
  req: NextApiRequest,
  res: NextApiResponse,
  logger: ScopedLogger
) => Promise<NextApiResponse | void>;

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: ErrorHandlerCallback
): Promise<NextApiResponse | void>;

/**
 * Error types enum
 */
export const ErrorType: {
  VALIDATION: 'VALIDATION_ERROR';
  UNAUTHORIZED: 'UNAUTHORIZED';
  FORBIDDEN: 'FORBIDDEN';
  NOT_FOUND: 'NOT_FOUND';
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED';
  RATE_LIMIT: 'RATE_LIMIT';
  EXTERNAL_API: 'EXTERNAL_API_ERROR';
  DATABASE: 'DATABASE_ERROR';
  INTERNAL: 'INTERNAL_SERVER_ERROR';
  CONFIGURATION: 'CONFIGURATION_ERROR';
  STRIPE: 'STRIPE_ERROR';
};

/**
 * Create error response
 */
export function createErrorResponse(
  errorType: string,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string | null
): {
  statusCode: number;
  body: {
    ok: boolean;
    error: {
      type: string;
      message: string;
      details: Record<string, unknown>;
      requestId: string | null;
    };
    timestamp: string;
  };
};

/**
 * Validate HTTP method
 */
export function validateMethod(
  req: NextApiRequest,
  allowedMethods: string[],
  logger: ScopedLogger
): boolean;

/**
 * Validate query parameters
 */
export function validateQueryParams(
  req: NextApiRequest,
  requiredParams: string[],
  logger: ScopedLogger
): boolean;

/**
 * Validate request body fields
 */
export function validateBody(
  req: NextApiRequest,
  requiredFields: string[],
  logger: ScopedLogger
): boolean;

/**
 * Require environment variable
 */
export function requireEnvVar(
  varName: string,
  logger: ScopedLogger
): string;

/**
 * Create success response
 */
export function createSuccessResponse(
  data: unknown,
  statusCode?: number,
  logger?: ScopedLogger | null
): {
  statusCode: number;
  body: {
    ok: boolean;
    data: unknown;
    timestamp: string;
  };
};
