/**
 * NFL Fantasy Rankings API
 * 
 * GET /api/nfl/fantasy/rankings
 * Query params:
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: 100)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns fantasy player rankings with ADP, projections, and auction values.
 * Cache: 6 hours
 */

import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_fantasy_rankings',
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
    const { position, limit = '100', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    const data = await getFantasyPlayers(apiKey, {
      position,
      limit: parseInt(limit),
      forceRefresh,
    });
    
    return res.status(200).json({
      ok: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('Fantasy Rankings API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

