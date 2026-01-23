/**
 * Middleware Error Handler
 * 
 * Provides consistent error handling for Next.js middleware.
 * Middleware uses NextRequest/NextResponse (not Request/Response).
 * 
 * @module lib/middlewareErrorHandler
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export type MiddlewareHandler = (request: NextRequest) => NextResponse | Promise<NextResponse>;

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Wraps a middleware handler with error handling and logging
 * 
 * @param handler - The middleware handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * ```typescript
 * async function middleware(request: NextRequest) {
 *   // Your logic here
 *   return NextResponse.next();
 * }
 * 
 * export default withMiddlewareErrorHandling(middleware);
 * ```
 */
export function withMiddlewareErrorHandling(
  handler: MiddlewareHandler
): MiddlewareHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Get edge region info (available in Edge Runtime)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geo = (request as any).geo;
    const region = geo?.region || 'unknown';
    const city = geo?.city;
    
    try {
      // Call the actual handler
      const response = await handler(request);
      
      const duration = Date.now() - startTime;
      
      // Log successful request (Edge Runtime compatible)
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
          level: 'info',
          requestId,
          route: request.nextUrl.pathname,
          method: request.method,
          status: response.status,
          duration,
          region,
          ...(city && { city }),
        }));
      }
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'Error';
      
      // Log error (Edge Runtime compatible)
      if (process.env.NODE_ENV === 'production') {
        console.error(JSON.stringify({
          level: 'error',
          requestId,
          route: request.nextUrl.pathname,
          method: request.method,
          error: errorMessage,
          errorName,
          stack: errorStack,
          duration,
          region,
          ...(city && { city }),
        }));
      }
      
      // In development, log to console for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware Error]', {
          requestId,
          route: request.nextUrl.pathname,
          method: request.method,
          error: errorMessage,
          stack: errorStack,
        });
      }
      
      // For middleware errors, we want to continue to the page
      // rather than returning an error response (which would break routing)
      // Log the error but allow the request to proceed
      const response = NextResponse.next();
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Middleware-Error', 'true');
      // Truncate error message for header (HTTP headers have size limits)
      const MAX_ERROR_MESSAGE_LENGTH = 100;
      response.headers.set('X-Error-Message', errorMessage.substring(0, MAX_ERROR_MESSAGE_LENGTH));
      
      // In production, send to Sentry
      // Note: typeof window === 'undefined' is always true in Edge Runtime, but kept for clarity
      if (process.env.NODE_ENV === 'production') {
        try {
          // Dynamic import to avoid bundling Sentry in middleware if not needed
          const Sentry = await import('@sentry/nextjs');
          Sentry.captureException(error, {
            tags: {
              component: 'middleware',
              route: request.nextUrl.pathname,
            },
            extra: {
              requestId,
              method: request.method,
              region,
              city,
            },
          });
        } catch (sentryError) {
          // Sentry import/initialization failed - continue without it
          console.error('Failed to send error to Sentry:', sentryError);
        }
      }
      
      return response;
    }
  };
}
