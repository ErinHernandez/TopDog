/**
 * Analytics API Endpoint
 * 
 * POST /api/analytics
 * 
 * Receives analytics events from the client and logs them.
 * Currently a stub endpoint - can be extended to send to external analytics services.
 */

import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
} from '../../lib/apiErrorHandler';

export default async function handler(req, res) {
  // Handle CORS preflight requests (before withErrorHandling)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const { event, userId, sessionId, timestamp } = req.body;

    // Log analytics event (in dev mode with debug logger)
    logger.debug('Analytics event received', { event, userId, sessionId, timestamp });

    // Return success response
    const response = createSuccessResponse({ 
      message: 'Analytics event received' 
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

