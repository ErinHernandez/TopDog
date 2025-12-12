/**
 * NFL Player Headshots API
 * 
 * GET /api/nfl/headshots
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - name: Get headshot for specific player name
 *   - id: Get headshot for specific player ID
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns headshot URLs for players. Headshots are 1200x1200 @ 300ppi.
 * Cache TTL: 7 days (headshots are updated annually in August)
 */

import { getPlayers, getPlayerHeadshot } from '../../../lib/sportsdataio';
import { transformPlayerHeadshot, FANTASY_POSITIONS } from '../../../lib/playerModel';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { team, position, name, id, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Single player lookup by name
    if (name) {
      const player = await getPlayerHeadshot(apiKey, name, forceRefresh);
      
      if (!player) {
        return res.status(404).json({ 
          ok: false, 
          error: `Player "${name}" not found` 
        });
      }
      
      return res.status(200).json({
        ok: true,
        data: player,
      });
    }
    
    // Get all players (with headshot URLs)
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
    
    // Filter by ID
    if (id) {
      players = players.filter(p => p.PlayerID === parseInt(id));
    }
    
    // Only include players with headshots and relevant positions
    players = players.filter(p => 
      p.PhotoUrl && FANTASY_POSITIONS.includes(p.Position)
    );
    
    // Transform using unified player model
    const headshots = players.map(transformPlayerHeadshot).filter(Boolean);
    
    // Sort by name
    headshots.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    return res.status(200).json({
      ok: true,
      count: headshots.length,
      data: headshots,
    });
  } catch (err) {
    console.error('Headshots API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

