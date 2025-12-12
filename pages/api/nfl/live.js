/**
 * NFL Live Games API
 * 
 * GET /api/nfl/live
 * 
 * Returns only games currently in progress with real-time game state.
 * Optimized for live updates during games.
 * Cache: 10 seconds
 */

import { getGamesInProgress, getCurrentWeek } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Get current week
    const current = await getCurrentWeek(apiKey);
    
    if (!current) {
      return res.status(200).json({
        ok: true,
        message: 'No current NFL week',
        data: [],
      });
    }
    
    const games = await getGamesInProgress(apiKey, current.season, current.week);
    
    return res.status(200).json({
      ok: true,
      season: current.season,
      week: current.week,
      weekName: current.name,
      gamesInProgress: games.length,
      data: games,
    });
  } catch (err) {
    console.error('Live API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

