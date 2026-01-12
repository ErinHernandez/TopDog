/**
 * NFL Player Red Zone Stats API
 * 
 * GET /api/nfl/stats/redzone
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns red zone stats (inside the 20) for players.
 * Cache: 6 hours
 */

import { getPlayerRedZoneStats } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../components/draft/v3/constants/positions';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger.js';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_redzone',
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
    const { season, position, team, limit = '50', refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let stats = await getPlayerRedZoneStats(apiKey, seasonYear, forceRefresh);
    
    // Filter to fantasy-relevant positions
    stats = stats.filter(p => POSITIONS.includes(p.Position));
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      stats = stats.filter(p => positions.includes(p.Position));
    }
    
    // Filter by team
    if (team) {
      stats = stats.filter(p => p.Team === team.toUpperCase());
    }
    
    // Sort by red zone opportunities (touches + targets)
    stats.sort((a, b) => {
      const aOpps = (a.RushingAttempts || 0) + (a.ReceivingTargets || 0);
      const bOpps = (b.RushingAttempts || 0) + (b.ReceivingTargets || 0);
      return bOpps - aOpps;
    });
    
    // Transform and limit
    const limited = stats.slice(0, parseInt(limit));
    const transformed = limited.map(p => ({
      playerId: p.PlayerID,
      name: p.Name,
      team: p.Team,
      position: p.Position,
      games: p.Played || 0,
      
      // Red Zone Rushing
      rushAttempts: p.RushingAttempts || 0,
      rushTouchdowns: p.RushingTouchdowns || 0,
      rushYards: p.RushingYards || 0,
      
      // Red Zone Receiving
      targets: p.ReceivingTargets || 0,
      receptions: p.Receptions || 0,
      recTouchdowns: p.ReceivingTouchdowns || 0,
      recYards: p.ReceivingYards || 0,
      
      // Red Zone Passing
      passAttempts: p.PassingAttempts || 0,
      passCompletions: p.PassingCompletions || 0,
      passTouchdowns: p.PassingTouchdowns || 0,
      passInterceptions: p.PassingInterceptions || 0,
      
      // Totals
      totalOpportunities: (p.RushingAttempts || 0) + (p.ReceivingTargets || 0),
      totalTouchdowns: (p.RushingTouchdowns || 0) + (p.ReceivingTouchdowns || 0),
      
      // Fantasy Points (red zone only)
      fantasyPoints: p.FantasyPoints || 0,
      fantasyPointsPPR: p.FantasyPointsPPR || 0,
    }));
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    logger.error('Red Zone Stats API error', err, {
      component: 'nfl-api',
      operation: 'redzone-stats',
    });
    return res.status(500).json({ error: err.message });
  }
}

