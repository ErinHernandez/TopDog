/**
 * Edge Runtime Error Handler
 * 
 * Provides consistent error handling for Edge Runtime API routes.
 * Edge Runtime uses Request/Response instead of NextApiRequest/NextApiResponse.
 * 
 * @module lib/edgeErrorHandler
 */

import type { NextRequest } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export type EdgeHandler = (request: NextRequest) => Promise<Response>;

interface ErrorResponse {
  error: {
    message: string;
    requestId: string;
    timestamp: string;
    type?: string;
  };
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Wraps an Edge Runtime handler with error handling and logging
 * 
 * @param handler - The Edge Runtime handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * ```typescript
 * export const config = { runtime: 'edge' };
 * 
 * async function handler(request: NextRequest) {
 *   // Your logic here
 *   return new Response(JSON.stringify({ success: true }));
 * }
 * 
 * export default withEdgeErrorHandling(handler);
 * ```
 */
export function withEdgeErrorHandling(
  handler: EdgeHandler
): EdgeHandler {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Get edge region info (available in Edge Runtime)
     
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
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Response-Time', `${duration}ms`);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
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
      
      // Determine status code based on error type
      let statusCode = 500;
      if (errorName === 'ValidationError') {
        statusCode = 400;
      } else if (errorName === 'UnauthorizedError' || errorName === 'AuthenticationError') {
        statusCode = 401;
      } else if (errorName === 'ForbiddenError') {
        statusCode = 403;
      } else if (errorName === 'NotFoundError') {
        statusCode = 404;
      } else if (errorName === 'RateLimitError') {
        statusCode = 429;
      }
      
      // Build error response
      const errorResponse: ErrorResponse = {
        error: {
          message: errorMessage,
          requestId,
          timestamp: new Date().toISOString(),
          type: errorName,
        },
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    }
  };
}
