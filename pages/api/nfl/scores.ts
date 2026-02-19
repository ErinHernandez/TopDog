/**
 * NFL Live & Final Scores API
 * 
 * GET /api/nfl/scores
 * Query params:
 *   - season: NFL season year (default: current)
 *   - week: Week number (default: current week)
 *   - status: Filter by status (live, final, scheduled, all)
 *   - team: Filter by team abbreviation
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns game scores with live game state (quarter, time, possession, etc.)
 * Cache: 10 seconds during live games
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { getWeekScores, getTimeframes } from '../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface GameScore {
  isLive?: boolean;
  isFinal?: boolean;
  isScheduled?: boolean;
  homeTeam?: string;
  awayTeam?: string;
  dateTime?: string;
  [key: string]: unknown;
}

export interface ScoresResponse {
  season: number;
  week: number;
  summary: {
    total: number;
    live: number;
    final: number;
    scheduled: number;
  };
  data: GameScore[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScoresResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, status, team, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching scores', {
      season: (season as string) || 'default',
      week: (week as string) || 'default',
      status: status as string | undefined,
      team: team as string | undefined,
      refresh: forceRefresh,
    });
    
    // Get current week if not specified
    let seasonYear = season ? parseInt(season as string, 10) : undefined;
    let weekNum = week ? parseInt(week as string, 10) : undefined;
    
    if (!seasonYear || !weekNum) {
      logger.debug('Week/season not provided, fetching current week');
      const timeframes = await getTimeframes(apiKey);
      const current = timeframes.find((tf: { SeasonType: number }) => tf.SeasonType === 1); // Regular season
      if (current) {
        seasonYear = seasonYear || current.Season;
        weekNum = weekNum || current.Week;
        logger.debug('Using current week from API', { season: seasonYear, week: weekNum });
      } else {
        seasonYear = seasonYear || new Date().getFullYear();
        weekNum = weekNum || 1;
        logger.warn('Could not get current week, using defaults', { season: seasonYear, week: weekNum });
      }
    }
    
    let scores = await getWeekScores(apiKey, seasonYear!, weekNum!, forceRefresh) as unknown as GameScore[];
    logger.debug('Scores fetched', { count: scores.length });
    
    // Filter by status
    if (status) {
      const statusLower = (status as string).toLowerCase();
      const beforeCount = scores.length;
      if (statusLower === 'live') {
        scores = scores.filter(g => g.isLive);
      } else if (statusLower === 'final') {
        scores = scores.filter(g => g.isFinal);
      } else if (statusLower === 'scheduled') {
        scores = scores.filter(g => g.isScheduled);
      }
      logger.debug('Filtered by status', { 
        status: statusLower, 
        before: beforeCount, 
        after: scores.length 
      });
    }
    
    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      const beforeCount = scores.length;
      scores = scores.filter(g => 
        g.homeTeam === teamUpper || g.awayTeam === teamUpper
      );
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: scores.length 
      });
    }
    
    // Sort: live games first, then by date
    scores.sort((a, b) => {
      const aLive = a.isLive || false;
      const bLive = b.isLive || false;
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      const aDate = a.dateTime ? new Date(a.dateTime).getTime() : 0;
      const bDate = b.dateTime ? new Date(b.dateTime).getTime() : 0;
      return aDate - bDate;
    });
    
    // Summary stats
    const liveCount = scores.filter(g => g.isLive).length;
    const finalCount = scores.filter(g => g.isFinal).length;
    const scheduledCount = scores.filter(g => g.isScheduled).length;

    // Set cache headers - live games need short cache, finished games can be longer
    if (liveCount > 0) {
      // During live games: 10 second cache for fresh data
      setCacheHeaders(res, { profile: 'public-short', maxAge: 10 });
    } else {
      // No live games: use standard short cache
      setCacheHeaders(res, 'public-short');
    }

    const response = createSuccessResponse({
      season: seasonYear!,
      week: weekNum!,
      summary: {
        total: scores.length,
        live: liveCount,
        final: finalCount,
        scheduled: scheduledCount,
      },
      data: scores,
    }, 200, logger);

    return res.status(response.statusCode).json(response.body.data as ScoresResponse);
  });
}
