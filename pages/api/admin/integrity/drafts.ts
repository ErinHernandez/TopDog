import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  ErrorType,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/apiErrorHandler';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { adminReadLimiter } from '@/lib/integrity/adminRateLimiter';
import { validatePaginationParams } from '@/lib/integrity/validation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Verify admin access
    const admin = await verifyAdminAccess(req.headers.authorization);
    if (!admin.isAdmin) {
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        'Unauthorized - Admin access required',
        {},
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Rate limiting for read operations
    const rateLimitResult = await adminReadLimiter.check(req);
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests',
        {
          retryAfter: rateLimitResult.retryAfterMs ? Math.ceil(rateLimitResult.retryAfterMs / 1000) : 60,
        },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const limitParam = req.query.limit;
    const limitValue = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 
                    Array.isArray(limitParam) ? parseInt(limitParam[0], 10) : undefined;
    const { limit } = validatePaginationParams({
      limit: limitValue,
    });

    logger.info('Fetching drafts for review', {
      adminId: admin.uid,
      limit,
    });

    const drafts = await adminService.getDraftsForReview(limit);

    const response = createSuccessResponse(drafts, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
