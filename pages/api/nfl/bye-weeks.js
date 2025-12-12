/**
 * NFL Bye Weeks API
 * 
 * GET /api/nfl/bye-weeks
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Filter by specific bye week
 *   - refresh: Force cache refresh (true/false)
 */

import { getByeWeeks } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { season, week, refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let byes = await getByeWeeks(apiKey, seasonYear, forceRefresh);
    
    // Filter by week
    if (week) {
      byes = byes.filter(b => b.Week === parseInt(week));
    }
    
    // Sort by week then team
    byes.sort((a, b) => {
      if (a.Week !== b.Week) return a.Week - b.Week;
      return a.Team.localeCompare(b.Team);
    });
    
    // Group by week for easier consumption
    const byWeek = {};
    byes.forEach(b => {
      if (!byWeek[b.Week]) byWeek[b.Week] = [];
      byWeek[b.Week].push(b.Team);
    });
    
    return res.status(200).json({
      ok: true,
      season: seasonYear,
      count: byes.length,
      byWeek,
      data: byes.map(b => ({ team: b.Team, week: b.Week })),
    });
  } catch (err) {
    console.error('Bye Weeks API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

