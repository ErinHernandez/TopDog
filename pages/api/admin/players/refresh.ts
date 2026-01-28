/**
 * Admin API - Refresh Player Stats Cache
 *
 * POST /api/admin/players/refresh
 *
 * Triggers a cache refresh for player stats by updating the metadata version.
 * This invalidates edge caches and forces clients to fetch fresh data.
 *
 * Authentication: Requires auth token with admin claim
 *
 * Request Body:
 * {
 *   reason?: string  // Optional reason for the refresh
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   previousVersion: string,
 *   newVersion: string
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createErrorResponse,
  ErrorType,
} from '../../../../lib/apiErrorHandler';
import { verifyAdminAccess } from '../../../../lib/adminAuth';

// ============================================================================
// TYPES
// ============================================================================

interface RefreshRequest {
  reason?: string;
}

interface RefreshResponse {
  success: boolean;
  message: string;
  previousVersion: string;
  newVersion: string;
  refreshedAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a new cache version string
 */
function generateNewVersion(currentVersion: string): string {
  // Parse current version (e.g., "5.0" -> [5, 0])
  const parts = currentVersion.split('.').map(Number);
  const major = parts[0] || 5;
  const minor = (parts[1] || 0) + 1;

  // Increment minor version
  return `${major}.${minor}`;
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * POST /api/admin/players/refresh
 *
 * Refreshes the player stats cache by updating the metadata version.
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['POST'], logger);

    // 2. Check admin authorization
    const authHeader = req.headers.authorization;
    const adminResult = await verifyAdminAccess(authHeader);

    if (!adminResult.isAdmin) {
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        adminResult.error || 'Admin access required'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // 3. Check if Firestore is available
    if (!db) {
      logger.error('Firestore not available');
      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Database not available'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const { reason } = (req.body || {}) as RefreshRequest;

    logger.info('Admin triggered player stats cache refresh', {
      reason,
      adminUid: adminResult.uid
    });

    try {
      // 4. Get current metadata
      const metadataRef = doc(db, 'playerStatsMetadata', 'current');
      const metadataSnap = await getDoc(metadataRef);

      if (!metadataSnap.exists()) {
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          'Player stats metadata not found. Run migration first.'
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      const currentData = metadataSnap.data();
      const previousVersion = currentData.version || '5.0';
      const newVersion = generateNewVersion(previousVersion);
      const refreshedAt = Timestamp.now();

      // 5. Update metadata with new version
      await updateDoc(metadataRef, {
        version: newVersion,
        lastUpdated: refreshedAt,
        lastRefreshReason: reason || 'Manual admin refresh',
        lastRefreshedBy: adminResult.uid,
      });

      logger.info('Cache refresh completed', {
        previousVersion,
        newVersion,
        reason,
      });

      // 6. Return success response
      const response: RefreshResponse = {
        success: true,
        message: 'Player stats cache refresh triggered successfully',
        previousVersion,
        newVersion,
        refreshedAt: refreshedAt.toDate().toISOString(),
      };

      // Set no-cache headers for this admin endpoint
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

      return res.status(200).json(response);

    } catch (error) {
      logger.error('Failed to refresh player stats cache', error instanceof Error ? error : new Error(String(error)));

      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Failed to refresh cache',
        { error: error instanceof Error ? error.message : String(error) }
      );

      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}

// Export handler (admin auth is handled internally via verifyAdminAccess)
export default handler;
