/**
 * Admin Balance Reconciliation Endpoint
 *
 * Provides admin-only access to balance reconciliation functionality.
 * Allows checking individual user balances or running bulk reconciliation.
 *
 * POST /api/admin/reconciliation
 *
 * Request Body:
 * {
 *   "userId": "optional-user-id",  // If provided, reconcile single user
 *   "bulkOptions": {                // If userId not provided, use bulk options
 *     "maxUsers": 100,
 *     "onlyDiscrepancies": false,
 *     "summaryOnly": false
 *   }
 * }
 *
 * Response on success:
 * Single user:
 * {
 *   "userId": "user123",
 *   "status": "balanced",
 *   "storedBalance": 1000,
 *   "calculatedBalance": 1000,
 *   "discrepancy": 0,
 *   "transactionCount": 5,
 *   "timestamp": "2024-02-07T...",
 *   "details": { ... }
 * }
 *
 * Bulk:
 * {
 *   "totalUsers": 500,
 *   "balancedUsers": 498,
 *   "discrepantUsers": 2,
 *   "errorUsers": 0,
 *   "totalDiscrepancy": 150.50,
 *   "results": [ ... ],
 *   "timestamp": "2024-02-07T...",
 *   "processingTimeMs": 5000
 * }
 *
 * Authentication: Requires admin access
 * Rate Limited: 10 requests per hour per admin
 *
 * @module pages/api/admin/reconciliation
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withAdminAuth,
  type AdminApiHandler,
} from '../../../lib/adminMiddleware';
import {
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import {
  reconcileUserBalance,
  reconcileAllBalances,
  type ReconciliationResult,
  type BulkReconciliationResult,
} from '../../../lib/monitoring/balanceReconciliation';
import { RateLimiter } from '../../../lib/rateLimiter';

// ============================================================================
// TYPES
// ============================================================================

interface ReconciliationRequest {
  userId?: string;
  bulkOptions?: {
    maxUsers?: number;
    onlyDiscrepancies?: boolean;
    summaryOnly?: boolean;
  };
}

type ReconciliationResponse = ReconciliationResult | BulkReconciliationResult;

// ============================================================================
// RATE LIMITER
// ============================================================================

const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  endpoint: 'admin_reconciliation',
  failClosed: true,
});

// ============================================================================
// HANDLER
// ============================================================================

const handler: AdminApiHandler = async (req, res, admin) => {
  const requestLogger = (res as NextApiResponse & { logger: any }).logger;

  // Validate HTTP method - allow POST for reconciliation
  validateMethod(req, ['POST'], requestLogger);

  // Rate limiting
  const rateLimitResult = await rateLimiter.check(req);
  if (!rateLimitResult.allowed) {
    requestLogger.warn('Reconciliation rate limit exceeded', {
      component: 'admin',
      operation: 'reconciliation',
      adminUid: admin.uid,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
    });

    const errorResponse = createErrorResponse(
      ErrorType.RATE_LIMIT,
      'Too many reconciliation requests. Rate limit: 10 per hour',
      {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      req.headers['x-request-id'] as string | undefined
    );

    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }

  const startTime = Date.now();

  requestLogger.info('Reconciliation request', {
    component: 'admin',
    operation: 'reconciliation',
    adminUid: admin.uid,
    adminEmail: admin.email,
    method: req.method,
  });

  try {
    // Parse and validate request body
    const body = req.body as ReconciliationRequest;

    let result: ReconciliationResponse;
    let operationType: 'single' | 'bulk';

    if (body.userId) {
      // Single user reconciliation
      operationType = 'single';

      requestLogger.debug('Processing single user reconciliation', {
        component: 'admin',
        operation: 'reconciliation',
        userId: body.userId,
        adminUid: admin.uid,
      });

      result = await reconcileUserBalance(body.userId);

      // Log discrepancies for audit
      if ('status' in result && result.status === 'discrepant') {
        requestLogger.warn('Discrepancy found during reconciliation', {
          component: 'admin',
          operation: 'reconciliation',
          userId: body.userId,
          adminUid: admin.uid,
          storedBalance: result.storedBalance,
          calculatedBalance: result.calculatedBalance,
          discrepancy: result.discrepancy,
        });
      }
    } else {
      // Bulk reconciliation
      operationType = 'bulk';

      const bulkOptions = body.bulkOptions || {};

      requestLogger.info('Processing bulk balance reconciliation', {
        component: 'admin',
        operation: 'reconciliation',
        adminUid: admin.uid,
        adminEmail: admin.email,
        maxUsers: bulkOptions.maxUsers,
        onlyDiscrepancies: bulkOptions.onlyDiscrepancies,
      });

      result = await reconcileAllBalances(bulkOptions);

      // Log bulk summary
      if ('totalUsers' in result) {
        requestLogger.info('Bulk reconciliation complete', {
          component: 'admin',
          operation: 'reconciliation',
          adminUid: admin.uid,
          totalUsers: result.totalUsers,
          balancedUsers: result.balancedUsers,
          discrepantUsers: result.discrepantUsers,
          errorUsers: result.errorUsers,
          totalDiscrepancy: result.totalDiscrepancy,
          processingTimeMs: result.processingTimeMs,
        });
      }
    }

    const responseTime = Date.now() - startTime;

    requestLogger.info('Reconciliation complete', {
      component: 'admin',
      operation: 'reconciliation',
      operationType,
      adminUid: admin.uid,
      responseTimeMs: responseTime,
    });

    const response = createSuccessResponse<ReconciliationResponse>(result, 200, requestLogger);
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    requestLogger.error('Reconciliation error', {
      component: 'admin',
      operation: 'reconciliation',
      adminUid: admin.uid,
      error: errorMessage,
      responseTimeMs: Date.now() - startTime,
    });

    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      'Reconciliation operation failed',
      { error: errorMessage },
      req.headers['x-request-id'] as string | undefined
    );

    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
};

export default withAdminAuth(handler);
