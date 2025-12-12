/**
 * NFL Live & Final Scores API
 * 
 * GET /api/nfl/scores
 * Query params:
 *   - season: NFL season year (default: current)
 *   - week: Week number (default: current week)
 *   - status: Filter by status (live, final, scheduled, all)
 *   - team: Filter by team abbreviation
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns game scores with live game state (quarter, time, possession, etc.)
 * Cache: 10 seconds during live games
 */

import { getWeekScores, getCurrentWeek } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { season, week, status, team, refresh } = req.query;
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
        seasonYear = seasonYear || new Date().getFullYear();
        weekNum = weekNum || 1;
      }
    }
    
    let scores = await getWeekScores(apiKey, seasonYear, weekNum, forceRefresh);
    
    // Filter by status
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower === 'live') {
        scores = scores.filter(g => g.isLive);
      } else if (statusLower === 'final') {
        scores = scores.filter(g => g.isFinal);
      } else if (statusLower === 'scheduled') {
        scores = scores.filter(g => g.isScheduled);
      }
    }
    
    // Filter by team
    if (team) {
      const teamUpper = team.toUpperCase();
      scores = scores.filter(g => 
        g.homeTeam === teamUpper || g.awayTeam === teamUpper
      );
    }
    
    // Sort: live games first, then by date
    scores.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.dateTime) - new Date(b.dateTime);
    });
    
    // Summary stats
    const liveCount = scores.filter(g => g.isLive).length;
    const finalCount = scores.filter(g => g.isFinal).length;
    const scheduledCount = scores.filter(g => g.isScheduled).length;
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      week: weekNum,
      summary: {
        total: scores.length,
        live: liveCount,
        final: finalCount,
        scheduled: scheduledCount,
      },
      data: scores,
    });
  } catch (err) {
    console.error('Scores API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

