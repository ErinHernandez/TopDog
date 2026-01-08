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

interface CSRFTokenResponse {
  csrfToken: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CSRFTokenResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      csrfToken: '',
      message: 'Method not allowed'
    });
  }

  try {
    // Generate new CSRF token
    const token = generateCSRFToken();
    
    // Set token as HttpOnly cookie
    setCSRFTokenCookie(res, token);
    
    // Return token in response (client needs this for header)
    return res.status(200).json({
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return res.status(500).json({
      csrfToken: '',
      message: 'Failed to generate CSRF token'
    });
  }
}

