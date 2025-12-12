/**
 * NFL Fantasy Overview API
 * 
 * GET /api/nfl/fantasy
 * 
 * Returns a summary of fantasy data including top players by position.
 */

import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../components/draft/v3/constants/positions';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const allPlayers = await getFantasyPlayers(apiKey, { limit: 500 });
    
    // Group by position and get top 10 each
    const byPosition = {};
    
    POSITIONS.forEach(pos => {
      byPosition[pos] = allPlayers
        .filter(p => p.position === pos)
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          team: p.team,
          adp: p.adpPPR || p.adp,
          projectedPoints: p.projectedPointsPPR || p.projectedPoints,
          positionRank: p.positionRank,
          byeWeek: p.byeWeek,
        }));
    });
    
    // Overall top 20
    const top20 = allPlayers.slice(0, 20).map(p => ({
      name: p.name,
      team: p.team,
      position: p.position,
      adp: p.adpPPR || p.adp,
      projectedPoints: p.projectedPointsPPR || p.projectedPoints,
      overallRank: p.overallRank,
    }));
    
    return res.status(200).json({
      ok: true,
      summary: {
        totalPlayers: allPlayers.length,
        byPosition: {
          QB: allPlayers.filter(p => p.position === 'QB').length,
          RB: allPlayers.filter(p => p.position === 'RB').length,
          WR: allPlayers.filter(p => p.position === 'WR').length,
          TE: allPlayers.filter(p => p.position === 'TE').length,
        },
      },
      top20,
      topByPosition: byPosition,
    });
  } catch (err) {
    console.error('Fantasy Overview API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

