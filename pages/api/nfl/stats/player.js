/**
 * NFL Single Player Stats API
 * 
 * GET /api/nfl/stats/player
 * Query params:
 *   - name: Player name (required)
 *   - season: NFL season year (default: current year)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns season stats for a specific player.
 */

import { getPlayerStatsByName } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_player',
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
    const { name, season, refresh } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Player name required' });
    }
    
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    const stats = await getPlayerStatsByName(apiKey, name, seasonYear, forceRefresh);
    
    if (!stats) {
      return res.status(404).json({
        ok: false,
        error: `Player "${name}" not found in ${seasonYear} stats`,
      });
    }
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      data: stats,
    });
  } catch (err) {
    console.error('Player Stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

