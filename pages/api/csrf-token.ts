/**
 * CSRF Token Endpoint
 * 
 * GET /api/csrf-token
 * 
 * Returns a CSRF token for the client to use in subsequent requests.
 * Sets the token as an HttpOnly cookie and returns it in the response.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  generateCSRFToken, 
  setCSRFTokenCookie 
} from '../../lib/csrfProtection';
import { logger } from '../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../lib/apiErrorHandler';

interface CSRFTokenResponse {
  csrfToken: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CSRFTokenResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);
    
    logger.info('Generating CSRF token', {
      component: 'csrf',
      operation: 'generate-token',
    });
    
    // Generate new CSRF token
    const token = generateCSRFToken();
    
    // Set token as HttpOnly cookie
    setCSRFTokenCookie(res, token);
    
    // Return token in response (client needs this for header)
    const response = createSuccessResponse({
      csrfToken: token,
      message: 'CSRF token generated successfully',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

