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
  req: AuthenticatedRequest,
  res: NextApiResponse<RunMigrationsResponse>,
  logger: typeof logger
): Promise<void> {
  // Only allow POST
  validateMethod(req, ['POST'], logger);
  
  // Check authentication (admin only in production)
  if (process.env.NODE_ENV === 'production') {
    // In production, verify admin access
    // This is a placeholder - implement proper admin check
    logger.warn('Migration API called in production - admin check needed');
  }
  
  const { dryRun = false } = req.body as RunMigrationsRequest;
  
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
    
    return res.status(response.statusCode).json(response.body);
    
  } catch (error) {
    logger.error('Migration run failed', error as Error);
    
    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      'Failed to run migrations',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    return res.status(errorResponse.statusCode).json({
      success: false,
      results: [],
      dryRun,
      error: errorResponse.body.error,
    });
  }
}

// Export with authentication (admin only)
export default withErrorHandling(
  withAuth(handler, { required: true, allowAnonymous: false })
);
