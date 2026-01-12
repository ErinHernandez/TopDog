/**
 * NFL Fantasy ADP (Average Draft Position) API
 * 
 * GET /api/nfl/fantasy/adp
 * Query params:
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: 100)
 *   - scoring: Scoring type (ppr, standard) - default: ppr
 *   - name: Get ADP for specific player
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns ADP rankings for fantasy players.
 * Cache: 6 hours
 */

import { getADP, getPlayerADP, getADPByPosition, transformADP } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger.js';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_fantasy_adp',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    const { position, limit = '100', scoring = 'ppr', name, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Single player lookup
    if (name) {
      const player = await getPlayerADP(apiKey, name, forceRefresh);
      
      if (!player) {
        return res.status(404).json({
          ok: false,
          error: `Player "${name}" not found in ADP data`,
        });
      }
      
      return res.status(200).json({
        ok: true,
        data: player,
      });
    }
    
    // Get ADP by position
    const data = await getADPByPosition(apiKey, position, {
      limit: parseInt(limit),
      scoringType: scoring,
    });
    
    return res.status(200).json({
      ok: true,
      scoringType: scoring,
      count: data.length,
      data,
    });
  } catch (err) {
    logger.error('ADP API error', err, {
      component: 'nfl-api',
      operation: 'fantasy-adp',
    });
    return res.status(500).json({ error: err.message });
  }
}

