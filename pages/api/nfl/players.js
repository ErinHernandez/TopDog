/**
 * NFL Players API
 * 
 * GET /api/nfl/players
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - search: Search by player name
 *   - limit: Max results (default: all)
 *   - refresh: Force cache refresh (true/false)
 */

import { getPlayers } from '../../../lib/sportsdataio';
import { transformPlayerBasic } from '../../../lib/playerModel';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { team, position, search, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    let players = await getPlayers(apiKey, forceRefresh);
    
    // Filter by team
    if (team) {
      players = players.filter(p => p.Team === team.toUpperCase());
    }
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      players = players.filter(p => positions.includes(p.Position));
    }
    
    // Search by name
    if (search) {
      const searchLower = search.toLowerCase();
      players = players.filter(p => 
        p.Name && p.Name.toLowerCase().includes(searchLower)
      );
    }
    
    // Transform using unified player model
    const transformed = players.map(transformPlayerBasic).filter(Boolean);
    
    // Sort by name
    transformed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Limit results
    const limited = limit ? transformed.slice(0, parseInt(limit)) : transformed;
    
    return res.status(200).json({
      ok: true,
      count: limited.length,
      total: transformed.length,
      data: limited,
    });
  } catch (err) {
    console.error('Players API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

