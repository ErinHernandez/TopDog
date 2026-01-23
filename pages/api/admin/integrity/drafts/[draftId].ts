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
import { isValidDraftId } from '@/lib/integrity/validation';
import { adminReadLimiter } from '@/lib/integrity/adminRateLimiter';

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

    const { draftId } = req.query;

    // Validate draftId
    if (!draftId || typeof draftId !== 'string') {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'draftId is required',
        { draftId },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    if (!isValidDraftId(draftId)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid draftId format',
        { draftId },
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

    logger.info('Fetching draft detail', {
      adminId: admin.uid,
      draftId,
    });

    const detail = await adminService.getDraftDetail(draftId);

    if (!detail.riskScores && !detail.integrityFlags) {
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'Draft not found or not analyzed',
        { draftId },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const response = createSuccessResponse(detail, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
