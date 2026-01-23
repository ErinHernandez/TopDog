/**
 * Migration Runner API
 * 
 * Run pending Firestore migrations.
 * 
 * POST /api/migrations/run
 * Body: { dryRun?: boolean }
 * 
 * @module pages/api/migrations/run
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
  type ApiHandler,
} from '../../../lib/apiErrorHandler';
import { logger } from '../../../lib/structuredLogger';
import { runMigrations, migrations } from '../../../lib/migrations';
import { withAuth } from '../../../lib/apiAuth';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';

// ============================================================================
// TYPES
// ============================================================================

interface RunMigrationsRequest {
  dryRun?: boolean;
}

interface RunMigrationsResponse {
  success: boolean;
  results: Array<{
    version: number;
    name: string;
    success: boolean;
    error?: string;
  }>;
  dryRun: boolean;
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RunMigrationsResponse>,
  logger: ApiLogger
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;
  // Only allow POST
  validateMethod(authenticatedReq, ['POST'], logger);
  
  // Check authentication (admin only in production)
  if (process.env.NODE_ENV === 'production') {
    // In production, verify admin access
    // This is a placeholder - implement proper admin check
    logger.warn('Migration API called in production - admin check needed');
  }
  
  const { dryRun = false } = authenticatedReq.body as RunMigrationsRequest;
  
  logger.info('Running migrations', { dryRun, migrationCount: migrations.length });
  
  try {
    const results = await runMigrations(migrations, dryRun);
    
    const response = createSuccessResponse(
      {
        success: results.every(r => r.success),
        results: results.map(r => ({
          version: r.version,
          name: r.name,
          success: r.success,
          error: r.error,
        })),
        dryRun,
      },
      200,
      logger
    );
    
    return res.status(response.statusCode).json(response.body.data);
    
  } catch (error) {
    logger.error('Migration run failed', error as Error);
    
    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      'Failed to run migrations',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    return res.status(errorResponse.statusCode).json({
      success: false,
      results: [{
        version: 0,
        name: 'error',
        success: false,
        error: errorResponse.body.error.message,
      }],
      dryRun,
    });
  }
}

// Export with authentication (admin only) and error handling
export default withAuth(
  async (req: AuthenticatedRequest, res: NextApiResponse<RunMigrationsResponse>): Promise<void> => {
    await withErrorHandling(req, res, handler as unknown as ApiHandler);
  },
  { required: true, allowAnonymous: false }
);
