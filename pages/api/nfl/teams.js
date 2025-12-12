/**
 * NFL Teams API
 * 
 * GET /api/nfl/teams
 * Query params:
 *   - conference: Filter by conference (AFC, NFC)
 *   - division: Filter by division (North, South, East, West)
 *   - team: Get single team by abbreviation (e.g., KC, BUF)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns full team data including:
 * - Coaching staff
 * - Team colors (hex)
 * - Stadium details
 * - DFS platform IDs/names
 * - Upcoming game salaries
 */

import { getTeams, getTeamByKey, transformTeam } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { conference, division, team, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Single team lookup
    if (team) {
      const teamData = await getTeamByKey(apiKey, team, forceRefresh);
      
      if (!teamData) {
        return res.status(404).json({
          ok: false,
          error: `Team "${team}" not found`,
        });
      }
      
      return res.status(200).json({
        ok: true,
        data: teamData,
      });
    }
    
    // Get all teams
    let teams = await getTeams(apiKey, forceRefresh);
    
    // Transform and filter out non-NFL teams
    let transformed = teams
      .map(transformTeam)
      .filter(t => t !== null);
    
    // Filter by conference
    if (conference) {
      transformed = transformed.filter(t => 
        t.conference === conference.toUpperCase()
      );
    }
    
    // Filter by division
    if (division) {
      transformed = transformed.filter(t => 
        t.division.toLowerCase().includes(division.toLowerCase())
      );
    }
    
    // Sort by conference, division, then name
    transformed.sort((a, b) => {
      if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
      if (a.division !== b.division) return a.division.localeCompare(b.division);
      return a.name.localeCompare(b.name);
    });
    
    return res.status(200).json({
      ok: true,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    console.error('Teams API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

