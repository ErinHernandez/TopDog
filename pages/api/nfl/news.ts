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

import type { NextApiRequest, NextApiResponse } from 'next';
import { getNews } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface NewsItem {
  NewsID?: number;
  Title?: string;
  Content?: string;
  Source?: string;
  Url?: string;
  Team?: string;
  PlayerID2?: string;
  Updated?: string;
  Categories?: string;
  [key: string]: unknown;
}

export interface TransformedNewsItem {
  id: number | undefined;
  title: string | undefined;
  content: string | undefined;
  source: string | undefined;
  url: string | undefined;
  team: string | undefined;
  playerName: string | undefined;
  updated: string | undefined;
  categories: string | undefined;
}

export interface NewsResponse {
  count: number;
  data: TransformedNewsItem[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { player, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching news', {
      filters: {
        player: player ? '***' : undefined, // Don't log full player names
        team: team as string | undefined,
        limit: limit as string | undefined,
        refresh: forceRefresh,
      }
    });
    
    let news = await getNews(apiKey, forceRefresh) as NewsItem[];
    logger.debug('News fetched', { count: news.length });
    
    // Filter by player name
    if (player) {
      const playerLower = (player as string).toLowerCase();
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
      const teamUpper = (team as string).toUpperCase();
      news = news.filter(n => n.Team === teamUpper);
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: news.length 
      });
    }
    
    // Sort by date (newest first)
    news.sort((a, b) => {
      const aDate = a.Updated ? new Date(a.Updated).getTime() : 0;
      const bDate = b.Updated ? new Date(b.Updated).getTime() : 0;
      return bDate - aDate;
    });
    
    // Limit results
    const limitNum = parseInt(limit as string, 10);
    news = news.slice(0, limitNum);
    
    // Transform for cleaner output
    const transformed: TransformedNewsItem[] = news.map(n => ({
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
    
    return res.status(response.statusCode).json(response.body.data as NewsResponse);
  });
}
