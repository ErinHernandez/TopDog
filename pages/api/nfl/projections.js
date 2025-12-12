/**
 * NFL Player Season Projections API
 * 
 * GET /api/nfl/projections
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: all)
 *   - refresh: Force cache refresh (true/false)
 */

import { getProjections } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { season, position, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    let projections = await getProjections(apiKey, forceRefresh);
    
    // Filter by position if specified
    if (position) {
      const positions = position.toUpperCase().split(',');
      projections = projections.filter(p => positions.includes(p.Position));
    }
    
    // Sort by PPR fantasy points
    projections.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));
    
    // Limit results
    if (limit) {
      projections = projections.slice(0, parseInt(limit));
    }
    
    return res.status(200).json({
      ok: true,
      season: season || new Date().getFullYear(),
      count: projections.length,
      data: projections,
    });
  } catch (err) {
    console.error('Projections API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

