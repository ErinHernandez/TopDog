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
  type ErrorType as ErrorTypeValue,
} from '@/lib/apiErrorHandler';
import { toMillis } from '@/lib/firebaseTimestamp';
import { adminWriteLimiter } from '@/lib/integrity/adminRateLimiter';
import { adminService } from '@/lib/integrity/AdminService';
import { validateAdminActionRequest } from '@/lib/integrity/validation';

const handler: AdminApiHandler = async (req, res, admin) => {
  // Validate HTTP method - logger is attached to res by withErrorHandling
  const logger = (res as NextApiResponse & { logger: any }).logger;
  validateMethod(req, ['POST'], logger);

    // Rate limiting for write operations
    const rateLimitResult = await adminWriteLimiter.check(req);
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

    // Validate request body with comprehensive validation
    const validation = validateAdminActionRequest(req.body);

    if (!validation.valid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Validation failed',
        { details: validation.errors },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const { targetType, targetId, action, reason, notes } = validation.data!;

    logger.info('Processing admin action', {
      adminId: admin.uid,
      targetType,
      targetId,
      action,
    });

    // Get limited evidence snapshot to prevent document size issues
    const evidenceSnapshot = await getLimitedEvidenceSnapshot(targetType, targetId);

  const result = await adminService.recordAction({
    targetType,
    targetId,
    adminId: admin.uid,
    adminEmail: admin.email || 'unknown',
    action,
    reason,
    notes,
    evidenceSnapshot,
  });

  const response = createSuccessResponse(result, 200, logger);
  return res.status(response.statusCode).json(response.body);
};

export default withAdminAuth(handler);

/**
 * Get limited evidence snapshot to prevent Firestore document size limits
 * Only includes summary data, not full arrays
 */
async function getLimitedEvidenceSnapshot(
  targetType: string,
  targetId: string
): Promise<object> {
  try {
    if (targetType === 'draft') {
      const detail = await adminService.getDraftDetail(targetId);
      return {
        maxRiskScore: detail.riskScores?.maxRiskScore || 0,
        avgRiskScore: detail.riskScores?.avgRiskScore || 0,
        pairCount: detail.riskScores?.pairScores.length || 0,
        flaggedPairsCount: detail.integrityFlags?.flaggedPairs.length || 0,
        analyzedAt: toMillis(detail.riskScores?.analyzedAt) || null,
        status: detail.riskScores?.status || 'unknown',
        // Intentionally omitting full pickLocations and pairScores arrays
      };
    }

    if (targetType === 'userPair') {
      // Could fetch pair details here if needed
      return {
        targetType,
        targetId,
        capturedAt: Date.now(),
      };
    }

    // Default minimal snapshot
    return {
      targetType,
      targetId,
      capturedAt: Date.now(),
    };
  } catch (error) {
    // If we can't get evidence, return minimal snapshot
    return {
      targetType,
      targetId,
      capturedAt: Date.now(),
      error: 'Failed to capture evidence snapshot',
    };
  }
}
