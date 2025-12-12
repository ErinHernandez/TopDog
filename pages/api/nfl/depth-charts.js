/**
 * NFL Depth Charts API
 * 
 * GET /api/nfl/depth-charts
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position
 *   - grouped: Return grouped by team (true/false, default: false)
 *   - refresh: Force cache refresh (true/false)
 */

import { getDepthCharts, getDepthChartsByTeam } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { team, position, grouped, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Return grouped by team if requested
    if (grouped === 'true') {
      const byTeam = await getDepthChartsByTeam(apiKey, forceRefresh);
      
      // Filter by team if specified
      if (team) {
        const teamData = byTeam[team.toUpperCase()];
        if (!teamData) {
          return res.status(404).json({ error: `Team ${team} not found` });
        }
        return res.status(200).json({
          ok: true,
          team: team.toUpperCase(),
          data: teamData,
        });
      }
      
      return res.status(200).json({
        ok: true,
        teamCount: Object.keys(byTeam).length,
        data: byTeam,
      });
    }
    
    // Return flat list
    let charts = await getDepthCharts(apiKey, forceRefresh);
    
    // Filter by team
    if (team) {
      charts = charts.filter(c => c.Team === team.toUpperCase());
    }
    
    // Filter by position
    if (position) {
      charts = charts.filter(c => c.Position === position.toUpperCase());
    }
    
    // Sort by team, position, depth order
    charts.sort((a, b) => {
      if (a.Team !== b.Team) return a.Team.localeCompare(b.Team);
      if (a.Position !== b.Position) return a.Position.localeCompare(b.Position);
      return a.DepthOrder - b.DepthOrder;
    });
    
    // Transform for cleaner output
    const transformed = charts.map(c => ({
      team: c.Team,
      position: c.Position,
      positionCategory: c.PositionCategory,
      name: c.Name,
      depthOrder: c.DepthOrder,
      playerId: c.PlayerID,
    }));
    
    return res.status(200).json({
      ok: true,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    console.error('Depth Charts API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

