/**
 * Admin Route Middleware
 *
 * Provides standardized admin authentication and logging for admin API routes.
 * Centralizes:
 * - Admin access verification
 * - Consistent error responses (403 Forbidden)
 * - Standardized unauthorized attempt logging
 * - Request tracing and monitoring
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAdminAccess } from './adminAuth';
import {
  createErrorResponse,
  ErrorType,
  withErrorHandling,
} from './apiErrorHandler';

/**
 * Admin authentication context available to protected handlers
 */
export interface AdminContext {
  uid: string;
  email?: string;
}

/**
 * Handler type for routes protected by withAdminAuth
 */
export type AdminApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  admin: AdminContext
) => Promise<void>;

/**
 * Higher-order function middleware for admin-protected API routes
 *
 * Provides:
 * - Standardized admin verification via Firebase custom claims
 * - Consistent 403 Forbidden responses for unauthorized access
 * - Automatic logging of unauthorized attempts
 * - Request tracing via X-Request-ID header
 * - Error context for monitoring and debugging
 *
 * @param handler - The actual route handler that will execute if admin check passes
 * @returns NextApiRequest handler with built-in admin verification
 *
 * @example
 * ```ts
 * const deleteHandler: AdminApiHandler = async (req, res, admin) => {
 *   // admin.uid and admin.email are guaranteed to be valid
 *   logger.info(`Admin ${admin.uid} deleted item ${itemId}`, {
 *     adminId: admin.uid,
 *     operation: 'delete_item',
 *   });
 *   return res.status(200).json({ success: true });
 * };
 *
 * export default withAdminAuth(deleteHandler);
 * ```
 */
export function withAdminAuth(handler: AdminApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    await withErrorHandling(req, res, async (req, res, logger) => {
      // Verify admin access
      const authHeader = req.headers.authorization;
      const adminResult = await verifyAdminAccess(authHeader || '');

      if (!adminResult.isAdmin) {
        // Log unauthorized attempt with context
        const requestId = res.getHeader('X-Request-ID') as string | undefined;
        logger.warn('Unauthorized admin access attempt', {
          component: 'admin',
          operation: 'authentication',
          error: adminResult.error || 'Unknown reason',
          requestId,
          // Include token info for security auditing (without exposing the token)
          hasAuthHeader: !!authHeader,
          authMethod: authHeader?.startsWith('Bearer ') ? 'bearer' : 'unknown',
        });

        // Return consistent 403 Forbidden response
        const errorResponse = createErrorResponse(
          ErrorType.FORBIDDEN,
          'Admin access required - insufficient permissions',
          {
            requiredRole: 'admin',
            userRole: 'user',
          },
          requestId
        );

        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      // Admin is verified - pass context to handler
      const adminContext: AdminContext = {
        uid: adminResult.uid || '',
        email: adminResult.email,
      };

      // Log successful authentication
      logger.debug('Admin authentication successful', {
        component: 'admin',
        operation: 'authentication',
        adminUid: adminContext.uid,
        requestId: res.getHeader('X-Request-ID'),
      });

      // Execute the actual handler with admin context
      return await handler(req, res, adminContext);
    });
  };
}
