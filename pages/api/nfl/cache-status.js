/**
 * NFL API Cache Status
 * 
 * GET /api/nfl/cache-status
 * Returns the status of all SportsDataIO caches
 * 
 * POST /api/nfl/cache-status
 * Body: { action: 'clear' } - Clears all caches
 */

import { getAllCacheStatus, clearAllCaches } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const status = getAllCacheStatus();
      
      return res.status(200).json({
        ok: true,
        caches: status,
      });
    } catch (err) {
      console.error('Cache status error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { action } = req.body;
      
      if (action === 'clear') {
        clearAllCaches();
        return res.status(200).json({
          ok: true,
          message: 'All caches cleared',
        });
      }
      
      return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
      console.error('Cache action error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

