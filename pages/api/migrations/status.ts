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

import { withAuth } from '../../../lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  type ApiLogger,
  type ApiHandler,
} from '../../../lib/apiErrorHandler';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';
import { getMigrationStatus } from '../../../lib/migrations';
import { logger } from '../../../lib/structuredLogger';

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
  req: NextApiRequest,
  res: NextApiResponse<MigrationStatusResponse>,
  logger: ApiLogger
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;
  // Only allow GET
  validateMethod(authenticatedReq, ['GET'], logger);
  
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

// Export with authentication and error handling
export default withAuth(
  async (req: AuthenticatedRequest, res: NextApiResponse<MigrationStatusResponse>): Promise<void> => {
    await withErrorHandling(req, res, handler as unknown as ApiHandler);
  },
  { required: true, allowAnonymous: false }
);
