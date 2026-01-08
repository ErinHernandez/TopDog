/**
 * NFL Player Weekly Stats API
 * 
 * GET /api/nfl/stats/weekly
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Week number (required)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns player stats for a specific week.
 * Cache: 1 hour
 */

import { getWeeklyFantasyStats, getCurrentWeek } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_weekly',
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
    const { season, week, position, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Get current week if not specified
    let seasonYear = parseInt(season);
    let weekNum = parseInt(week);
    
    if (!seasonYear || !weekNum) {
      const current = await getCurrentWeek(apiKey);
      if (current) {
        seasonYear = seasonYear || current.season;
        weekNum = weekNum || current.week;
      } else {
        return res.status(400).json({ error: 'Week number required' });
      }
    }
    
    let stats = await getWeeklyFantasyStats(apiKey, seasonYear, weekNum, {
      position,
      limit: parseInt(limit),
    });
    
    // Filter by team
    if (team) {
      stats = stats.filter(p => p.team === team.toUpperCase());
    }
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      week: weekNum,
      count: stats.length,
      data: stats,
    });
  } catch (err) {
    console.error('Weekly Stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

