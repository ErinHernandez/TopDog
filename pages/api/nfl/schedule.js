/**
 * NFL Schedule API
 * 
 * GET /api/nfl/schedule
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Filter by week number
 *   - team: Filter by team abbreviation
 *   - refresh: Force cache refresh (true/false)
 */

import { getSchedule } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { season, week, team, refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let schedule = await getSchedule(apiKey, seasonYear, forceRefresh);
    
    // Filter by week
    if (week) {
      schedule = schedule.filter(g => g.Week === parseInt(week));
    }
    
    // Filter by team
    if (team) {
      const teamUpper = team.toUpperCase();
      schedule = schedule.filter(g => 
        g.HomeTeam === teamUpper || g.AwayTeam === teamUpper
      );
    }
    
    // Sort by date
    schedule.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      count: schedule.length,
      data: schedule,
    });
  } catch (err) {
    console.error('Schedule API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

