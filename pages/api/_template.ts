/**
 * API Route Template
 * 
 * This is a template for creating new API routes with best practices:
 * - Standardized error handling
 * - Structured logging
 * - Request validation
 * - Rate limiting (if needed)
 * - Authentication (if needed)
 * 
 * Copy this file and customize for your endpoint.
 * 
 * @example
 * ```bash
 * cp pages/api/_template.ts pages/api/my-endpoint.ts
 * ```
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  validateQueryParams,
  validateBody,
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';
import { logger } from '../../lib/structuredLogger';

// Optional: Import rate limiting if needed
// import { createApiRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';

// Optional: Import authentication if needed
// import { withAuth } from '../../lib/apiAuth';

// Optional: Import CSRF protection if needed
// import { withCSRFProtection } from '../../lib/csrfProtection';

// ============================================================================
// TYPES
// ============================================================================

interface RequestBody {
  // Define your request body type here
  // Example: userId: string;
  // Example: amount: number;
}

interface ResponseData {
  // Define your response data type here
  // Example: success: boolean;
  // Example: data: YourDataType;
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * API Route Handler
 * 
 * GET/POST /api/your-endpoint
 * 
 * Description of what this endpoint does.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['GET', 'POST'], logger); // Adjust allowed methods as needed

    // 2. Check required environment variables (if needed)
    // const apiKey = requireEnvVar('YOUR_API_KEY', logger);

    // 3. Validate query parameters (for GET requests)
    if (req.method === 'GET') {
      // validateQueryParams(req, ['requiredParam1', 'requiredParam2'], logger);
    }

    // 4. Validate request body (for POST/PUT requests)
    if (req.method === 'POST' || req.method === 'PUT') {
      // validateBody(req, ['requiredField1', 'requiredField2'], logger);
      // const body = req.body as RequestBody;
    }

    // 5. Log the request
    logger.info('Processing request', {
      method: req.method,
      query: req.query,
      // Don't log sensitive data from body
    });

    // 6. Your business logic here
    // Example:
    // const result = await yourBusinessLogic(req.query, req.body);

    // 7. Return success response
    const response = createSuccessResponse({
      // Your response data here
      success: true,
      // data: result,
    }, 200, logger);

    return res.status(response.statusCode).json(response.body);
  });
}

// ============================================================================
// OPTIONAL: Add Rate Limiting
// ============================================================================

// If you need rate limiting, wrap the handler:
// 
// import { createApiRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';
// 
// const rateLimiter = createApiRateLimiter({
//   maxRequests: 60,
//   windowMs: 60 * 1000, // 1 minute
// });
// 
// export default withRateLimit(handler, rateLimiter);

// ============================================================================
// OPTIONAL: Add Authentication
// ============================================================================

// If you need authentication, wrap the handler:
// 
// import { withAuth } from '../../lib/apiAuth';
// 
// export default withAuth(handler, {
//   required: true, // or false for optional auth
//   allowAnonymous: false,
// });

// ============================================================================
// OPTIONAL: Add CSRF Protection
// ============================================================================

// If you need CSRF protection, wrap the handler:
// 
// import { withCSRFProtection } from '../../lib/csrfProtection';
// 
// export default withCSRFProtection(handler);

// ============================================================================
// OPTIONAL: Combine Multiple Middlewares
// ============================================================================

// You can combine multiple middlewares:
// 
// export default withCSRFProtection(
//   withAuth(
//     withRateLimit(handler, rateLimiter),
//     { required: true }
//   )
// );
