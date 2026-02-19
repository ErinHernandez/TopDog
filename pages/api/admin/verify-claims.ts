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

import {
  withAdminAuth,
  type AdminApiHandler,
} from '../../../lib/adminMiddleware';
import {
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
// Use require for firebase-admin to ensure compatibility

const firebaseAdmin = require('firebase-admin');

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

const handler: AdminApiHandler = async (req, res, admin) => {
  // Validate HTTP method
  const logger = (res as NextApiResponse & { logger: any }).logger; // Access logger from error handler context
  validateMethod(req, ['GET'], logger);

  logger.info('Verifying admin claims', {
    component: 'admin',
    operation: 'verify-claims',
    adminUid: admin.uid,
  });
    
    // Get admin UIDs from environment variable
    const adminUidsFromEnv = (process.env.ADMIN_UIDS?.split(',') || [])
      .map((uid) => uid.trim())
      .filter(Boolean);
    
    // Verify Firebase Admin is initialized
    if (!firebaseAdmin || !firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
      const errorResponse = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Firebase Admin not initialized',
        {},
        null
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message });
    }

    const auth = firebaseAdmin.auth?.();
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
};

export default withAdminAuth(handler);
