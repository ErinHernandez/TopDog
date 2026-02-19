/**
 * Composable API Handler Wrapper
 *
 * Provides a flexible, reusable wrapper for API route handlers that combines:
 * - HTTP method validation
 * - Request ID generation and tracking
 * - Authentication (optional, multiple levels)
 * - Rate limiting (optional)
 * - Input validation with Zod schemas
 * - Structured error handling
 * - Request logging
 *
 * @example
 * ```ts
 * // Basic handler with method validation
 * const handler = createApiHandler({
 *   methods: ['GET', 'POST'],
 *   handler: async (req, res, context) => {
 *     res.json({ message: 'Hello' });
 *   }
 * });
 *
 * // With authentication and validation
 * const handler = createApiHandler({
 *   methods: ['POST'],
 *   auth: 'user',
 *   schema: z.object({ email: z.string().email() }),
 *   handler: async (req, res, context) => {
 *     console.log(context.userId); // authenticated user ID
 *     const data = req.body; // validated input
 *     res.json({ success: true });
 *   }
 * });
 *
 * export default handler;
 * ```
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { verifyAuthToken } from './apiAuth';
import {
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendRateLimited,
  sendServerError,
  generateRequestId,
  type ValidationErrorItem,
} from './apiResponse';
import { serverLogger } from './logger/serverLogger';
import { RateLimiter, type RateLimitConfig } from './rateLimiter';

// ============================================================================
// TYPES
// ============================================================================

/**
 * HTTP methods supported by handlers
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Authentication levels
 */
export type AuthLevel = 'user' | 'admin' | 'system' | 'none';

/**
 * Request context passed to handlers
 */
export interface HandlerContext {
  /** Unique request ID for correlation */
  requestId: string;
  /** Authenticated user ID (if auth required) */
  userId?: string;
  /** User email (if available) */
  userEmail?: string;
  /** Authentication level used */
  authLevel: AuthLevel;
  /** Structured logger instance */
  logger: HandlerLogger;
  /** Validated request data (if schema provided) */
  validatedData?: unknown;
}

/**
 * Handler function signature
 */
export type ApiHandlerFunction = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: HandlerContext
) => Promise<void> | void;

/**
 * Rate limit configuration
 */
export interface ApiHandlerRateLimit {
  maxRequests: number;
  windowMs: number;
}

/**
 * API handler configuration
 */
export interface ApiHandlerConfig {
  /** Allowed HTTP methods */
  methods: HttpMethod[];

  /** Authentication requirement level */
  auth?: AuthLevel;

  /** Rate limiting configuration (optional) */
  rateLimit?: ApiHandlerRateLimit;

  /** Zod schema for input validation (optional) */
  schema?: z.ZodSchema;

  /** Endpoint identifier for rate limiting (auto-generated if not provided) */
  endpoint?: string;

  /** Handler function */
  handler: ApiHandlerFunction;

  /** Custom error handler (optional) */
  onError?: (error: Error, context: HandlerContext) => void;
}

/**
 * Structured logger for handlers
 */
export class HandlerLogger {
  private requestId: string;
  private startTime: number;

  constructor(requestId: string) {
    this.requestId = requestId;
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time since handler started
   */
  private getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Log info level message
   */
  info(message: string, context?: Record<string, unknown>): void {
    serverLogger.info(message, {
      requestId: this.requestId,
      duration: this.getDuration(),
      ...context,
    });
  }

  /**
   * Log warning level message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    serverLogger.warn(message, null, {
      requestId: this.requestId,
      duration: this.getDuration(),
      ...context,
    });
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error | null, context?: Record<string, unknown>): void {
    serverLogger.error(message, error || null, {
      requestId: this.requestId,
      duration: this.getDuration(),
      ...context,
    });
  }

  /**
   * Log debug level message (development only)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      serverLogger.debug(message, {
        requestId: this.requestId,
        duration: this.getDuration(),
        ...context,
      });
    }
  }
}

// ============================================================================
// RATE LIMITER MANAGEMENT
// ============================================================================

const rateLimiters = new Map<string, RateLimiter>();

/**
 * Get or create a rate limiter for an endpoint
 */
function getRateLimiter(
  endpoint: string,
  config: ApiHandlerRateLimit
): RateLimiter {
  if (!rateLimiters.has(endpoint)) {
    rateLimiters.set(
      endpoint,
      new RateLimiter({
        endpoint,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        failClosed: true,
      })
    );
  }
  return rateLimiters.get(endpoint)!;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate HTTP method
 */
function validateMethod(
  method: string | undefined,
  allowedMethods: HttpMethod[],
  logger: HandlerLogger
): boolean {
  if (!method || !allowedMethods.includes(method as HttpMethod)) {
    logger.warn('Method not allowed', {
      method,
      allowed: allowedMethods,
    });
    return false;
  }
  return true;
}

/**
 * Validate request body against schema
 */
function validateSchema(
  req: NextApiRequest,
  schema: z.ZodSchema,
  logger: HandlerLogger
): { success: boolean; data?: unknown; errors?: ValidationErrorItem[] } {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: ValidationErrorItem[] = (result.error.issues || []).map(
        (issue: z.ZodIssue) => ({
          field: String(issue.path.join('.')),
          message: issue.message,
          code: issue.code,
        })
      );

      logger.warn('Input validation failed', {
        errorCount: errors.length,
        errors: errors.map(e => `${e.field}: ${e.message}`),
      });

      return { success: false, errors };
    }

    logger.debug('Input validation passed');
    return { success: true, data: result.data };
  } catch (error) {
    logger.error('Unexpected validation error', error instanceof Error ? error : null);
    return {
      success: false,
      errors: [{ field: 'root', message: 'Validation failed unexpectedly' }],
    };
  }
}

// ============================================================================
// MAIN HANDLER CREATION
// ============================================================================

/**
 * Create a composable API handler with integrated middleware
 *
 * Handles:
 * 1. Method validation
 * 2. Rate limiting (if configured)
 * 3. Authentication (if configured)
 * 4. Input validation (if schema provided)
 * 5. Handler execution
 * 6. Error handling and logging
 *
 * @param {ApiHandlerConfig} config - Handler configuration
 * @returns {Function} Next.js API handler
 *
 * @example
 * ```ts
 * const handler = createApiHandler({
 *   methods: ['POST'],
 *   auth: 'user',
 *   rateLimit: { maxRequests: 10, windowMs: 60000 },
 *   schema: z.object({ email: z.string().email() }),
 *   handler: async (req, res, context) => {
 *     res.json({ success: true, userId: context.userId });
 *   }
 * });
 *
 * export default handler;
 * ```
 */
export function createApiHandler(config: ApiHandlerConfig) {
  // Validate config
  if (!config.methods || config.methods.length === 0) {
    throw new Error('At least one HTTP method must be specified');
  }

  if (!config.handler) {
    throw new Error('Handler function is required');
  }

  // Setup rate limiter if configured
  let rateLimiter: RateLimiter | null = null;
  if (config.rateLimit) {
    const endpoint = config.endpoint || `handler_${Math.random().toString(36).slice(2, 9)}`;
    rateLimiter = getRateLimiter(endpoint, config.rateLimit);
  }

  // Return Next.js API handler
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId();
    const logger = new HandlerLogger(requestId);
    let context: HandlerContext | null = null;

    try {
      // Set request ID in response header
      res.setHeader('X-Request-ID', requestId);

      // Step 1: Validate HTTP method
      if (!validateMethod(req.method, config.methods, logger)) {
        return sendError(
          res,
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} not allowed. Allowed: ${config.methods.join(', ')}`,
          405
        );
      }

      logger.debug('Request started', {
        method: req.method,
        path: req.url,
      });

      // Step 2: Rate limiting (if configured)
      if (rateLimiter) {
        const rateLimitResult = await rateLimiter.check(req);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', rateLimiter.config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());

        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded', { clientIp: req.socket.remoteAddress });
          return sendRateLimited(res, rateLimitResult.retryAfterMs || undefined);
        }
      }

      // Step 3: Authentication (if configured)
      let userId: string | undefined;
      let userEmail: string | undefined;
      const authLevel = config.auth || 'none';

      if (authLevel !== 'none') {
        const authHeader = req.headers.authorization;
        const authResult = await verifyAuthToken(authHeader);

        if (!authResult.uid) {
          logger.warn('Authentication failed', { error: authResult.error });
          return sendUnauthorized(res, authResult.error || 'Invalid or missing authentication');
        }

        userId = authResult.uid;
        userEmail = authResult.email;

        logger.debug('Authentication successful', { userId });
      }

      // Step 4: Input validation (if schema provided)
      let validatedData: unknown;
      if (config.schema) {
        const validationResult = validateSchema(req, config.schema, logger);

        if (!validationResult.success) {
          return sendValidationError(res, validationResult.errors || []);
        }

        validatedData = validationResult.data;
      }

      // Create context for handler
      context = {
        requestId,
        userId,
        userEmail,
        authLevel,
        logger,
        validatedData,
      };

      // Step 5: Execute handler
      logger.debug('Executing handler', { authLevel });
      await config.handler(req, res, context);

      // Log successful completion (if response wasn't sent)
      if (!res.headersSent) {
        logger.debug('Handler completed without explicit response');
      }
    } catch (error) {
      // Log error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Handler error', err, {
        authLevel: context?.authLevel || 'none',
      });

      // Call custom error handler if provided
      if (config.onError && context) {
        try {
          config.onError(err, context);
        } catch (customErrorHandlerError) {
          logger.error('Custom error handler failed', customErrorHandlerError instanceof Error ? customErrorHandlerError : null);
        }
      }

      // Send error response (if not already sent)
      if (!res.headersSent) {
        return sendServerError(res, err);
      }
    }
  };
}

// ============================================================================
// QUICK CREATE HELPERS
// ============================================================================

/**
 * Create a simple GET handler
 *
 * @example
 * ```ts
 * export default createGetHandler(async (req, res, context) => {
 *   res.json({ message: 'Hello' });
 * });
 * ```
 */
export function createGetHandler(
  handler: ApiHandlerFunction,
  config?: Partial<ApiHandlerConfig>
) {
  return createApiHandler({
    ...config,
    methods: ['GET'],
    handler,
  });
}

/**
 * Create a simple POST handler
 */
export function createPostHandler(
  handler: ApiHandlerFunction,
  config?: Partial<ApiHandlerConfig>
) {
  return createApiHandler({
    ...config,
    methods: ['POST'],
    handler,
  });
}

/**
 * Create a simple authenticated POST handler
 */
export function createAuthenticatedPostHandler(
  handler: ApiHandlerFunction,
  config?: Partial<ApiHandlerConfig>
) {
  return createApiHandler({
    ...config,
    methods: ['POST'],
    auth: 'user',
    handler,
  });
}

/**
 * Create a simple rate-limited handler
 */
export function createRateLimitedHandler(
  handler: ApiHandlerFunction,
  maxRequests: number = 10,
  windowMs: number = 60000,
  config?: Partial<ApiHandlerConfig>
) {
  return createApiHandler({
    ...config,
    methods: config?.methods || ['GET', 'POST'],
    rateLimit: { maxRequests, windowMs },
    handler,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default createApiHandler;
