/**
 * Universal Export API
 * Provides data export for all users
 * Routes: /api/export/draft/[draftId], /api/export/user/[userId], etc.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthenticatedRequest, ApiHandler as AuthApiHandler } from '../../../lib/apiAuth';
 
const { exportSystem } = require('../../../lib/exportSystem');
 
const { dataAccessControl } = require('../../../lib/dataAccessControl');
import { 
  withErrorHandling, 
  validateMethod, 
  ErrorType,
  createErrorResponse,
} from '../../../lib/apiErrorHandler';
import { withAuth, verifyUserAccess } from '../../../lib/apiAuth';
import { createExportRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { logSecurityEvent, getClientIP, SecurityEventType } from '../../../lib/securityLogger';
import { verifyDraftOwnership, verifyUserOwnership } from '../../../lib/export/ownershipVerification';

// ============================================================================
// TYPES
// ============================================================================

export type ExportType = 'draft' | 'tournament' | 'player' | 'user';
export type ExportFormat = 'csv' | 'json' | 'txt';

export interface ExportResponse {
  error?: string;
  message?: string;
  retryAfter?: number;
  reason?: string;
  period?: string;
  status?: string;
}

export interface ExportQueryParams {
  params?: string[];
  userId?: string;
  anonymize?: string;
  timeframe?: string;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Create rate limiter for export
const exportLimiter = createExportRateLimiter();

// ============================================================================
// HANDLER
// ============================================================================

const handler = function(
  req: AuthenticatedRequest,
  res: NextApiResponse<ExportResponse | string>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    const authenticatedReq = req as AuthenticatedRequest;
    const { params } = authenticatedReq.query as ExportQueryParams;
    const [exportType, id, format] = (params as string[]) || [];
    const clientIP = getClientIP(authenticatedReq);
    
    // Check rate limit
    const rateLimitResult = await exportLimiter.check(authenticatedReq);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', exportLimiter.config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());
    
    if (!rateLimitResult.allowed) {
      // Log rate limit exceeded
      await logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        'medium',
        { endpoint: '/api/export', exportType },
        authenticatedReq.user?.uid || null,
        clientIP
      );
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many export requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000),
      });
    }

    // CORS Configuration - Secure by default
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
      .map((o: string) => o.trim())
      .filter(Boolean) || [];
    
    // In production, require ALLOWED_ORIGINS to be set
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        logger.warn('ALLOWED_ORIGINS not configured in production - denying CORS');
        return res.status(500).json({
          error: 'CORS configuration error',
          message: 'Server configuration error',
        });
      }
      
      // Only allow specific origins in production
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        // Origin not allowed - deny request
        logger.warn('CORS request from unauthorized origin', { origin, allowedOrigins });
        return res.status(403).json({
          error: 'CORS policy violation',
          message: 'Origin not allowed',
        });
      }
    } else {
      // Development: allow all origins (for local testing)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    logger.info('Export request', {
      exportType,
      id,
      format: format || 'csv',
      requesterId: (authenticatedReq.query as ExportQueryParams).userId || 'anonymous',
    });

    // Validate export type
    if (!exportType) {
      const error = new Error('Export type is required');
      error.name = 'ValidationError';
      throw error;
    }

    const validExportTypes: ExportType[] = ['draft', 'tournament', 'player', 'user'];
    if (!validExportTypes.includes(exportType as ExportType)) {
      const error = new Error(`Invalid export type. Valid types: ${validExportTypes.join(', ')}`);
      error.name = 'ValidationError';
      throw error;
    }

    // Check data access restrictions first
    const { userId: requesterId } = authenticatedReq.query as ExportQueryParams;
    
    // SECURITY: Verify ownership for each export type before processing
    if (!authenticatedReq.user) {
      return res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const authenticatedUserId = authenticatedReq.user.uid;

    // Verify ownership based on export type
    switch (exportType) {
      case 'draft':
        if (!id) {
          const error = new Error('Draft ID is required');
          error.name = 'ValidationError';
          throw error;
        }
        const ownsDraft = await verifyDraftOwnership(id, authenticatedUserId);
        if (!ownsDraft) {
          await logSecurityEvent(
            SecurityEventType.DATA_ACCESS,
            'high',
            { 
              endpoint: '/api/export',
              exportType: 'draft',
              reason: 'unauthorized_draft_access',
              draftId: id,
              userId: authenticatedUserId
            },
            authenticatedUserId,
            clientIP
          );
          return res.status(403).json({ 
            error: 'FORBIDDEN',
            message: 'Access denied',
          });
        }
        break;
        
      case 'user':
        if (!id) {
          const error = new Error('User ID is required');
          error.name = 'ValidationError';
          throw error;
        }
        const ownsUser = await verifyUserOwnership(id, authenticatedUserId);
        if (!ownsUser) {
          await logSecurityEvent(
            SecurityEventType.DATA_ACCESS,
            'high',
            { 
              endpoint: '/api/export',
              exportType: 'user',
              reason: 'unauthorized_user_access',
              requestedUserId: id,
              authenticatedUserId: authenticatedUserId
            },
            authenticatedUserId,
            clientIP
          );
          return res.status(403).json({ 
            error: 'FORBIDDEN',
            message: 'Access denied',
          });
        }
        break;
        
      case 'tournament':
        // Tournaments may be public, but verify access if needed
        // For now, allow access (can be extended later)
        break;
        
      case 'player':
        // Player data is public, no ownership check needed
        break;
    }
    
    // Also verify userId query param if provided (legacy check)
    if (requesterId && !verifyUserAccess(authenticatedUserId, requesterId)) {
      logger.warn('Export request blocked - unauthorized access', {
        exportType,
        id,
        requestedUserId: requesterId,
        authenticatedUserId: authenticatedUserId,
      });
      
      await logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        'high',
        { 
          endpoint: '/api/export',
          exportType,
          reason: 'unauthorized_user_access',
          requestedUserId: requesterId,
          authenticatedUserId: authenticatedUserId
        },
        authenticatedUserId,
        clientIP
      );
      
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
    }
    
    const validation = dataAccessControl.validateExportRequest(exportType, id, requesterId || authenticatedUserId);
    
    if (!validation.allowed) {
      logger.warn('Export request blocked by access control', {
        exportType,
        id,
        reason: validation.reason,
      });
      return res.status(403).json({ 
        error: 'Data not yet available',
        reason: validation.reason,
        period: dataAccessControl.getCurrentPeriod(),
        message: dataAccessControl.getPeriodMessage(),
        status: dataAccessControl.getDataAvailabilityStatus()
      });
    }

    let exportData: string | null = null;
    const exportFormat: ExportFormat = (format as ExportFormat) || 'csv';

    logger.debug('Processing export', { exportType, id, format: exportFormat });

    switch (exportType) {
      case 'draft':
        const { userId } = req.query as ExportQueryParams;
        if (!userId) {
          const error = new Error('userId required for draft export');
          error.name = 'ValidationError';
          throw error;
        }
        exportData = exportSystem.exportDraftData(id, userId, exportFormat);
        break;

      case 'tournament':
        const options = {
          anonymize: (authenticatedReq.query as ExportQueryParams).anonymize === 'true'
        };
        exportData = exportSystem.exportTournamentData(id, exportFormat, options);
        break;

      case 'player':
        exportData = exportSystem.exportPlayerData(id, exportFormat);
        break;

      case 'user':
        const timeframe = (authenticatedReq.query as ExportQueryParams).timeframe || 'season';
        exportData = exportSystem.exportUserHistory(id, exportFormat, timeframe);
        break;
    }

    if (!exportData) {
      logger.warn('No data found for export', { exportType, id });
      const requestId = res.getHeader('X-Request-ID') as string || null;
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No data found for export',
        { exportType, id },
        requestId
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Set appropriate content type and filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `topdog_${exportType}_${id}_${timestamp}.${exportFormat}`;

    logger.debug('Setting response headers', { filename, format: exportFormat });

    switch (exportFormat) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        break;
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        break;
      case 'txt':
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }

    logger.info('Export completed successfully', {
      exportType,
      id,
      format: exportFormat,
      dataSize: exportData.length,
    });
    
    // Log export event
    await logSecurityEvent(
      SecurityEventType.DATA_ACCESS,
      'low',
      { 
        endpoint: '/api/export',
        exportType,
        format: exportFormat,
        dataSize: exportData.length 
      },
      authenticatedReq.user?.uid || null,
      clientIP
    );

    return res.status(200).send(exportData);
  });
};

// Export with authentication and rate limiting
export default withAuth(
  withRateLimit(handler as unknown as (req: NextApiRequest, res: NextApiResponse<ExportResponse | string>) => Promise<unknown>, exportLimiter) as unknown as AuthApiHandler,
  { required: true, allowAnonymous: false }
);

// API route examples:
// GET /api/export/draft/room123?userId=user456&format=csv
// GET /api/export/tournament/tournament789?format=json&anonymize=true  
// GET /api/export/player/player_jamarr_chase?format=csv
// GET /api/export/user/user123?format=json&timeframe=season
