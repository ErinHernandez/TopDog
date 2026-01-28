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
      // Generic error - don't leak that this is an admin endpoint
      const requestId = res.getHeader('X-Request-ID') as string;
      if (!requestId) {
        logger.warn('Missing request ID in admin route');
      }
      
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        'Unauthorized', // Generic message
        {}, // Empty details - don't leak endpoint info
        requestId || 'unknown'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Add explicit type check for admin object
    if (typeof admin.uid !== 'string' || !admin.uid) {
      logger.warn('Invalid admin object', { admin });
      const requestId = res.getHeader('X-Request-ID') as string || 'unknown';
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        'Unauthorized',
        {},
        requestId
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
      // Generic error - don't leak draftId or analysis status
      const requestId = res.getHeader('X-Request-ID') as string || 'unknown';
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'Resource not found', // Generic message
        {}, // Don't include draftId
        requestId
      );
      // Log details server-side only
      logger.warn('Draft not found or not analyzed', {
        draftId,
        adminId: admin.uid,
      });
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const response = createSuccessResponse(detail, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
