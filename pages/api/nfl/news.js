/**
 * NFL News API
 * 
 * GET /api/nfl/news
 * Query params:
 *   - player: Filter by player name (partial match)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - refresh: Force cache refresh (true/false)
 */

import { getNews } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { player, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    let news = await getNews(apiKey, forceRefresh);
    
    // Filter by player name
    if (player) {
      const playerLower = player.toLowerCase();
      news = news.filter(n => {
        const title = (n.Title || '').toLowerCase();
        const content = (n.Content || '').toLowerCase();
        const playerName = (n.PlayerID2 || '').toLowerCase();
        return title.includes(playerLower) || 
               content.includes(playerLower) ||
               playerName.includes(playerLower);
      });
    }
    
    // Filter by team
    if (team) {
      news = news.filter(n => n.Team === team.toUpperCase());
    }
    
    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.Updated) - new Date(a.Updated));
    
    // Limit results
    news = news.slice(0, parseInt(limit));
    
    // Transform for cleaner output
    const transformed = news.map(n => ({
      id: n.NewsID,
      title: n.Title,
      content: n.Content,
      source: n.Source,
      url: n.Url,
      team: n.Team,
      playerName: n.PlayerID2,
      updated: n.Updated,
      categories: n.Categories,
    }));
    
    return res.status(200).json({
      ok: true,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    console.error('News API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

