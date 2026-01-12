/**
 * Admin Claims Verification Endpoint
 * 
 * Verifies that all admins have custom claims set correctly.
 * Returns list of admins with their claim status.
 * 
 * GET /api/admin/verify-claims
 * 
 * Authentication: Requires admin access (uses verifyAdminAccess)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminAccess } from '../../../lib/adminAuth';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
// Use require for firebase-admin to ensure compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');

// ============================================================================
// TYPES
// ============================================================================

interface AdminClaimStatus {
  uid: string;
  email: string | null;
  hasAdminClaim: boolean;
  claims: Record<string, unknown>;
  error?: string;
}

interface VerifyClaimsResponse {
  total: number;
  withClaims: number;
  withoutClaims: number;
  admins: AdminClaimStatus[];
  adminUidsFromEnv: string[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);
    
    // Verify admin access
    const authHeader = req.headers.authorization;
    const adminCheck = await verifyAdminAccess(authHeader || '');
    
    if (!adminCheck.isAdmin) {
      logger.warn('Non-admin attempted to verify claims', {
        component: 'admin',
        operation: 'verify-claims',
        error: adminCheck.error,
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        adminCheck.error || 'Admin access required',
        {},
        logger
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.message });
    }
    
    logger.info('Verifying admin claims', {
      component: 'admin',
      operation: 'verify-claims',
      adminUid: adminCheck.uid,
    });
    
    // Get admin UIDs from environment variable
    const adminUidsFromEnv = (process.env.ADMIN_UIDS?.split(',') || [])
      .map((uid) => uid.trim())
      .filter(Boolean);
    
    // Verify Firebase Admin is initialized
    if (admin.apps.length === 0) {
      const errorResponse = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Firebase Admin not initialized',
        {},
        logger
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.message });
    }
    
    const auth = admin.auth();
    const adminStatuses: AdminClaimStatus[] = [];
    
    // Check each admin UID
    for (const uid of adminUidsFromEnv) {
      try {
        const user = await auth.getUser(uid);
        const hasAdminClaim = user.customClaims?.admin === true;
        
        adminStatuses.push({
          uid,
          email: user.email || null,
          hasAdminClaim,
          claims: user.customClaims || {},
        });
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        adminStatuses.push({
          uid,
          email: null,
          hasAdminClaim: false,
          claims: {},
          error: err.code === 'auth/user-not-found' 
            ? 'User not found' 
            : err.message || 'Unknown error',
        });
      }
    }
    
    const withClaims = adminStatuses.filter((s) => s.hasAdminClaim).length;
    const withoutClaims = adminStatuses.filter((s) => !s.hasAdminClaim).length;
    
    logger.info('Admin claims verification complete', {
      component: 'admin',
      operation: 'verify-claims',
      total: adminStatuses.length,
      withClaims,
      withoutClaims,
    });
    
    const response = createSuccessResponse<VerifyClaimsResponse>(
      {
        total: adminStatuses.length,
        withClaims,
        withoutClaims,
        admins: adminStatuses,
        adminUidsFromEnv,
      },
      200,
      logger
    );
    
    return res.status(response.statusCode).json(response.body);
  });
}
