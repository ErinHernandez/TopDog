/**
 * NFL API Cache Status
 * 
 * GET /api/nfl/cache-status
 * Returns the status of all SportsDataIO caches
 * 
 * POST /api/nfl/cache-status
 * Body: { action: 'clear' } - Clears all caches
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllCacheStatus, clearAllCaches } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface CacheStatusResponse {
  caches?: Record<string, {
    [key: string]: unknown;
  }>;
  message?: string;
}

export interface CacheStatusRequest {
  action?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheStatusResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET', 'POST'], logger);

    if (req.method === 'GET') {
      logger.info('Fetching cache status');
      const status = getAllCacheStatus();
      
      const response = createSuccessResponse({ caches: status }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as unknown as CacheStatusResponse);
    }
    
    if (req.method === 'POST') {
      const { action } = req.body as CacheStatusRequest;
      
      if (action === 'clear') {
        logger.info('Clearing all caches');
        clearAllCaches();
        const response = createSuccessResponse({ message: 'All caches cleared' }, 200, logger);
        return res.status(response.statusCode).json(response.body.data as CacheStatusResponse);
      }
      
      const error = createErrorResponse(ErrorType.VALIDATION, 'Unknown action');
      return res.status(error.statusCode).json(error.body as CacheStatusResponse);
    }
  });
}
