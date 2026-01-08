/**
 * API Route: Verify Admin Access
 * 
 * GET /api/auth/verify-admin
 * 
 * Verifies if the authenticated user has admin privileges.
 * Used by client-side components to check admin access.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminAccess } from '../../../lib/adminAuth';
import { withErrorHandling } from '../../../lib/apiErrorHandler';

interface VerifyAdminResponse {
  isAdmin: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyAdminResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    if (req.method !== 'GET') {
      return res.status(405).json({
        isAdmin: false,
        error: 'Method not allowed',
      });
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        isAdmin: false,
        error: 'Authorization header required',
      });
    }
    
    const result = await verifyAdminAccess(authHeader);
    
    if (!result.isAdmin) {
      return res.status(403).json({
        isAdmin: false,
        error: result.error || 'Access denied',
      });
    }
    
    logger.info('Admin access verified', {
      uid: result.uid,
      email: result.email,
    });
    
    return res.status(200).json({
      isAdmin: true,
      uid: result.uid,
      email: result.email,
    });
  });
}

