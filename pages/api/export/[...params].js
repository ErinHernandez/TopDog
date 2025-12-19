/**
 * Universal Export API
 * Provides data export for all users
 * Routes: /api/export/draft/[draftId], /api/export/user/[userId], etc.
 */

import { exportSystem } from '../../../lib/exportSystem.js';
import { dataAccessControl } from '../../../lib/dataAccessControl.js';
import { 
  withErrorHandling, 
  validateMethod, 
  validateQueryParams,
  ErrorType,
  createErrorResponse,
} from '../../../lib/apiErrorHandler';

export default function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    const { params } = req.query;
    const [exportType, id, format] = params || [];

    // Set CORS headers for external tool access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    logger.info('Export request', {
      exportType,
      id,
      format: format || 'csv',
      requesterId: req.query.userId || 'anonymous',
    });

    // Validate export type
    if (!exportType) {
      const error = new Error('Export type is required');
      error.name = 'ValidationError';
      throw error;
    }

    const validExportTypes = ['draft', 'tournament', 'player', 'user'];
    if (!validExportTypes.includes(exportType)) {
      const error = new Error(`Invalid export type. Valid types: ${validExportTypes.join(', ')}`);
      error.name = 'ValidationError';
      throw error;
    }

    // Check data access restrictions first
    const { userId: requesterId } = req.query;
    const validation = dataAccessControl.validateExportRequest(exportType, id, requesterId);
    
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

    let exportData = null;
    const exportFormat = format || 'csv';

    logger.debug('Processing export', { exportType, id, format: exportFormat });

    switch (exportType) {
      case 'draft':
        const { userId } = req.query;
        if (!userId) {
          const error = new Error('userId required for draft export');
          error.name = 'ValidationError';
          throw error;
        }
        exportData = exportSystem.exportDraftData(id, userId, exportFormat);
        break;

      case 'tournament':
        const options = {
          anonymize: req.query.anonymize === 'true'
        };
        exportData = exportSystem.exportTournamentData(id, exportFormat, options);
        break;

      case 'player':
        exportData = exportSystem.exportPlayerData(id, exportFormat);
        break;

      case 'user':
        const timeframe = req.query.timeframe || 'season';
        exportData = exportSystem.exportUserHistory(id, exportFormat, timeframe);
        break;
    }

    if (!exportData) {
      logger.warn('No data found for export', { exportType, id });
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No data found for export',
        { exportType, id },
        res.getHeader('X-Request-ID')
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

    return res.status(200).send(exportData);
  });
}

// API route examples:
// GET /api/export/draft/room123?userId=user456&format=csv
// GET /api/export/tournament/tournament789?format=json&anonymize=true  
// GET /api/export/player/player_jamarr_chase?format=csv
// GET /api/export/user/user123?format=json&timeframe=season