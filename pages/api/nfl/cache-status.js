/**
 * NFL API Cache Status
 * 
 * GET /api/nfl/cache-status
 * Returns the status of all SportsDataIO caches
 * 
 * POST /api/nfl/cache-status
 * Body: { action: 'clear' } - Clears all caches
 */

import { getAllCacheStatus, clearAllCaches } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);

    if (req.method === 'GET') {
      logger.info('Fetching cache status');
      const status = getAllCacheStatus();
      
      const response = createSuccessResponse({ caches: status }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    if (req.method === 'POST') {
      const { action } = req.body;
      
      if (action === 'clear') {
        logger.info('Clearing all caches');
        clearAllCaches();
        const response = createSuccessResponse({ message: 'All caches cleared' }, 200, logger);
        return res.status(response.statusCode).json(response.body);
      }
      
      const error = createErrorResponse(ErrorType.VALIDATION, 'Unknown action', 400, logger);
      return res.status(error.statusCode).json(error.body);
    }
  });
}

