import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withAdminAuth,
  type AdminApiHandler,
} from '@/lib/adminMiddleware';
import {
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '@/lib/apiErrorHandler';
import { adminReadLimiter } from '@/lib/integrity/adminRateLimiter';
import { adminService } from '@/lib/integrity/AdminService';
import { validatePaginationParams } from '@/lib/integrity/validation';

const handler: AdminApiHandler = async (req, res, admin) => {
  // Validate HTTP method - logger is attached to res by withErrorHandling
  const logger = (res as NextApiResponse & { logger: any }).logger;
  validateMethod(req, ['GET'], logger);

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
                    Array.isArray(limitParam) ? parseInt(limitParam[0]!, 10) : undefined;
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
};

export default withAdminAuth(handler);
