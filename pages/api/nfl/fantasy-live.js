/**
 * NFL Live Fantasy Scores API
 * 
 * GET /api/nfl/fantasy-live
 * Query params:
 *   - season: NFL season year (default: current)
 *   - week: Week number (default: current week)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team
 *   - limit: Max results (default: 50)
 * 
 * Returns live fantasy scores for players during games.
 * Sorted by PPR fantasy points (highest first).
 */

import { getLiveFantasyScores, getCurrentWeek } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { season, week, position, team, limit = '50' } = req.query;
    
    // Get current week if not specified
    let seasonYear = parseInt(season);
    let weekNum = parseInt(week);
    
    if (!seasonYear || !weekNum) {
      const current = await getCurrentWeek(apiKey);
      if (current) {
        seasonYear = seasonYear || current.season;
        weekNum = weekNum || current.week;
      } else {
        return res.status(200).json({
          ok: true,
          message: 'No current NFL week',
          data: [],
        });
      }
    }
    
    let stats = await getLiveFantasyScores(apiKey, seasonYear, weekNum);
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      stats = stats.filter(p => positions.includes(p.position));
    }
    
    // Filter by team
    if (team) {
      stats = stats.filter(p => p.team === team.toUpperCase());
    }
    
    // Limit results
    stats = stats.slice(0, parseInt(limit));
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      week: weekNum,
      count: stats.length,
      data: stats,
    });
  } catch (err) {
    console.error('Fantasy Live API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

