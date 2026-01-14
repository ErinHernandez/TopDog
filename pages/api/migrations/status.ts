/**
 * Migration Status API
 * 
 * Get current migration status.
 * 
 * GET /api/migrations/status
 * 
 * @module pages/api/migrations/status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  type ApiLogger,
  type ApiHandler,
} from '../../../lib/apiErrorHandler';
import { logger } from '../../../lib/structuredLogger';
import { getMigrationStatus } from '../../../lib/migrations';
import { withAuth } from '../../../lib/apiAuth';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';

// ============================================================================
// TYPES
// ============================================================================

interface MigrationStatusResponse {
  currentVersion: number;
  appliedMigrations: Array<{
    version: number;
    name: string;
    appliedAt: string;
    appliedBy?: string;
  }>;
  totalMigrations: number;
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<MigrationStatusResponse>,
  logger: ApiLogger
): Promise<void> {
  // Only allow GET
  validateMethod(req, ['GET'], logger);
  
  logger.info('Fetching migration status');
  
  try {
    const status = await getMigrationStatus();
    
    const response = createSuccessResponse(
      {
        currentVersion: status.currentVersion,
        appliedMigrations: status.appliedMigrations,
        totalMigrations: status.totalMigrations,
      },
      200,
      logger
    );
    
    return res.status(response.statusCode).json(response.body.data);
    
  } catch (error) {
    logger.error('Failed to get migration status', error as Error);
    throw error;
  }
}

// Export with authentication
const authenticatedHandler = withAuth(handler, { required: true, allowAnonymous: false });

export default async function(
  req: NextApiRequest,
  res: NextApiResponse<MigrationStatusResponse>
): Promise<void> {
  await withErrorHandling(req, res, authenticatedHandler as ApiHandler);
}
