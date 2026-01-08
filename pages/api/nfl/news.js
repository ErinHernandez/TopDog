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
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { player, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching news', {
      filters: {
        player: player ? '***' : undefined, // Don't log full player names
        team,
        limit,
        refresh: forceRefresh,
      }
    });
    
    let news = await getNews(apiKey, forceRefresh);
    logger.debug('News fetched', { count: news.length });
    
    // Filter by player name
    if (player) {
      const playerLower = player.toLowerCase();
      const beforeCount = news.length;
      news = news.filter(n => {
        const title = (n.Title || '').toLowerCase();
        const content = (n.Content || '').toLowerCase();
        const playerName = (n.PlayerID2 || '').toLowerCase();
        return title.includes(playerLower) || 
               content.includes(playerLower) ||
               playerName.includes(playerLower);
      });
      logger.debug('Filtered by player', { 
        player: '***', 
        before: beforeCount, 
        after: news.length 
      });
    }
    
    // Filter by team
    if (team) {
      const beforeCount = news.length;
      news = news.filter(n => n.Team === team.toUpperCase());
      logger.debug('Filtered by team', { 
        team: team.toUpperCase(), 
        before: beforeCount, 
        after: news.length 
      });
    }
    
    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.Updated) - new Date(a.Updated));
    
    // Limit results
    const limitNum = parseInt(limit);
    news = news.slice(0, limitNum);
    
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
    
    const response = createSuccessResponse({
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

