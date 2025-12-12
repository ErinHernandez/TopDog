/**
 * Universal Export API
 * Provides data export for all users
 * Routes: /api/export/draft/[draftId], /api/export/user/[userId], etc.
 */

import { exportSystem } from '../../../lib/exportSystem.js';
import { dataAccessControl } from '../../../lib/dataAccessControl.js';

export default function handler(req, res) {
  const { params } = req.query;
  const [exportType, id, format] = params || [];

  // Set CORS headers for external tool access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Check data access restrictions first
    const { userId: requesterId } = req.query;
    const validation = dataAccessControl.validateExportRequest(exportType, id, requesterId);
    
    if (!validation.allowed) {
      res.status(403).json({ 
        error: 'Data not yet available',
        reason: validation.reason,
        period: dataAccessControl.getCurrentPeriod(),
        message: dataAccessControl.getPeriodMessage(),
        status: dataAccessControl.getDataAvailabilityStatus()
      });
      return;
    }

    let exportData = null;
    const exportFormat = format || 'csv';

    switch (exportType) {
      case 'draft':
        const { userId } = req.query;
        if (!userId) {
          res.status(400).json({ error: 'userId required for draft export' });
          return;
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

      default:
        res.status(400).json({ 
          error: 'Invalid export type',
          validTypes: ['draft', 'tournament', 'player', 'user']
        });
        return;
    }

    if (!exportData) {
      res.status(404).json({ error: 'No data found for export' });
      return;
    }

    // Set appropriate content type and filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `topdog_${exportType}_${id}_${timestamp}.${exportFormat}`;

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

    res.status(200).send(exportData);

  } catch (error) {
    console.error('Export API error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message 
    });
  }
}

// API route examples:
// GET /api/export/draft/room123?userId=user456&format=csv
// GET /api/export/tournament/tournament789?format=json&anonymize=true  
// GET /api/export/player/player_jamarr_chase?format=csv
// GET /api/export/user/user123?format=json&timeframe=season