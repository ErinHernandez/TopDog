/**
 * ESPN Fantasy API Client
 * 
 * Provides access to ESPN Fantasy Football API with authentication,
 * rate limiting, and error handling.
 */

import https from 'https';
import type {
  ProjectionData,
  HistoricalStats,
  AdvancedMetrics,
  ESPNProjection,
  ESPNSeasonStats,
  GetProjectionsOptions,
} from './types';
import { getDataSourceConfig } from './config';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_PUBLIC_LEAGUE_ID = 1;
const RATE_LIMIT_DELAY = 3500; // 3.5 seconds between requests (respect ESPN's 3-second cache)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second initial retry delay

// In-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Make HTTP request to ESPN Fantasy API
 */
function makeRequest(url: string, options: { retries?: number } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const config = getDataSourceConfig();
    if (!config.espn) {
      reject(new Error('ESPN configuration not available'));
      return;
    }

    const cookieHeader = `espn_s2=${config.espn.s2Cookie}; SWID=${config.espn.swidCookie}`;

    const requestOptions = {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (compatible; BestBall/1.0)',
      },
      timeout: 15000,
    };

    https.get(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse ESPN API response: ${e}`));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error(`ESPN API authentication failed: ${res.statusCode}`));
        } else if (res.statusCode === 429) {
          // Rate limited - retry with backoff
          if (options.retries && options.retries > 0) {
            setTimeout(() => {
              makeRequest(url, { retries: options.retries - 1 })
                .then(resolve)
                .catch(reject);
            }, RETRY_DELAY * (MAX_RETRIES - options.retries + 1));
          } else {
            reject(new Error('ESPN API rate limit exceeded'));
          }
        } else {
          reject(new Error(`ESPN API error: ${res.statusCode} - ${data.substring(0, 100)}`));
        }
      });
    }).on('error', (error) => {
      // Network error - retry if retries available
      if (options.retries && options.retries > 0) {
        setTimeout(() => {
          makeRequest(url, { retries: options.retries - 1 })
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY * (MAX_RETRIES - options.retries + 1));
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Rate limiting helper
 */
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Get cache key for a request
 */
function getCacheKey(type: string, ...params: (string | number)[]): string {
  return `espn:${type}:${params.join(':')}`;
}

/**
 * Get from cache if valid
 */
function getCached<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  return null;
}

/**
 * Set cache
 */
function setCache(key: string, data: unknown, ttl: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

// ============================================================================
// POSITION MAPPING
// ============================================================================

const ESPN_POSITION_MAP: Record<number, string> = {
  1: 'QB',
  2: 'RB',
  3: 'WR',
  4: 'TE',
  5: 'K',
  16: 'D/ST',
};

function mapESPNPosition(positionId: number): string {
  return ESPN_POSITION_MAP[positionId] || 'UNK';
}

// ============================================================================
// TEAM MAPPING
// ============================================================================

// ESPN team IDs to abbreviations (simplified - may need expansion)
const ESPN_TEAM_MAP: Record<number, string> = {
  1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL',
  7: 'DEN', 8: 'DET', 9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC',
  13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO',
  19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
  25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'BAL', 30: 'HOU',
  33: 'BAL', 34: 'HOU',
};

function mapESPNTeam(teamId: number): string {
  return ESPN_TEAM_MAP[teamId] || 'UNK';
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get player projections for a season
 */
export async function getPlayerProjections(
  season: number,
  options: GetProjectionsOptions = {}
): Promise<ProjectionData[]> {
  await rateLimit();

  const config = getDataSourceConfig();
  if (!config.espn) {
    throw new Error('ESPN configuration not available');
  }

  const leagueId = config.espn.leagueId || DEFAULT_PUBLIC_LEAGUE_ID;
  const cacheKey = getCacheKey('projections', season.toString());
  const cacheTTL = 6 * 60 * 60 * 1000; // 6 hours

  // Check cache
  if (!options.forceRefresh) {
    const cached = getCached<ProjectionData[]>(cacheKey, cacheTTL);
    if (cached) {
      return cached;
    }
  }

  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=kona_player_info&view=players_wl`;

  try {
    const data = await makeRequest(url, { retries: MAX_RETRIES });
    
    // Transform ESPN response to ProjectionData format
    const projections: ProjectionData[] = [];
    
    if (data.players && Array.isArray(data.players)) {
      for (const player of data.players) {
        const espnPlayer = player.player || player;
        const position = mapESPNPosition(espnPlayer.defaultPositionId || 0);
        
        // Filter by position if specified
        if (options.position && !options.position.split(',').includes(position)) {
          continue;
        }

        // Only include fantasy-relevant positions
        if (!['QB', 'RB', 'WR', 'TE'].includes(position)) {
          continue;
        }

        const projection: ProjectionData = {
          PlayerID: espnPlayer.id,
          Name: espnPlayer.fullName || `${espnPlayer.firstName} ${espnPlayer.lastName}`,
          Position: position,
          Team: mapESPNTeam(espnPlayer.proTeamId || 0),
          FantasyPointsPPR: player.projectedPointsPPR || player.projectedPoints || 0,
          FantasyPoints: player.projectedPoints || 0,
          FantasyPointsHalfPPR: player.projectedPointsHalfPPR || player.projectedPoints || 0,
          ByeWeek: espnPlayer.byeWeek,
          AverageDraftPosition: player.averageDraftPosition,
          AverageDraftPositionPPR: player.averageDraftPositionPPR,
          _source: 'espn',
        };

        // Add stat projections if available
        if (player.stats) {
          if (player.stats.passing) {
            projection.PassingAttempts = player.stats.passing.attempts;
            projection.PassingCompletions = player.stats.passing.completions;
            projection.PassingYards = player.stats.passing.yards;
            projection.PassingTouchdowns = player.stats.passing.touchdowns;
            projection.PassingInterceptions = player.stats.passing.interceptions;
          }
          if (player.stats.rushing) {
            projection.RushingAttempts = player.stats.rushing.attempts;
            projection.RushingYards = player.stats.rushing.yards;
            projection.RushingTouchdowns = player.stats.rushing.touchdowns;
          }
          if (player.stats.receiving) {
            projection.Receptions = player.stats.receiving.receptions;
            projection.ReceivingTargets = player.stats.receiving.targets;
            projection.ReceivingYards = player.stats.receiving.yards;
            projection.ReceivingTouchdowns = player.stats.receiving.touchdowns;
          }
        }

        projections.push(projection);
      }
    }

    // Sort by PPR fantasy points
    projections.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));

    // Apply limit
    const limited = options.limit ? projections.slice(0, options.limit) : projections;

    // Cache result
    setCache(cacheKey, limited, cacheTTL);

    return limited;
  } catch (error) {
    console.error('[ESPN Fantasy API] Error fetching projections:', error);
    throw error;
  }
}

/**
 * Get historical season stats for a player (for ingestion script)
 */
export async function getPlayerHistoricalStats(
  espnPlayerId: string,
  season: number
): Promise<HistoricalStats | null> {
  await rateLimit();

  const config = getDataSourceConfig();
  if (!config.espn) {
    throw new Error('ESPN configuration not available');
  }

  const leagueId = config.espn.leagueId || DEFAULT_PUBLIC_LEAGUE_ID;
  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mMatchupScore&view=mRoster`;

  try {
    const data = await makeRequest(url, { retries: MAX_RETRIES });
    
    // Find player in response
    // Note: ESPN Fantasy API structure may vary - this is a simplified implementation
    // You may need to adjust based on actual API response structure
    
    // For now, return null as this requires more investigation of ESPN's actual response format
    // This will be implemented based on actual API testing
    console.warn('[ESPN Fantasy API] Historical stats endpoint needs implementation based on actual API structure');
    return null;
  } catch (error) {
    console.error('[ESPN Fantasy API] Error fetching historical stats:', error);
    return null;
  }
}

/**
 * Get advanced metrics for a player (xFP, EPA, consistency)
 */
export async function getPlayerAdvancedMetrics(
  espnPlayerId: string
): Promise<AdvancedMetrics | null> {
  await rateLimit();

  const config = getDataSourceConfig();
  if (!config.espn) {
    throw new Error('ESPN configuration not available');
  }

  const season = new Date().getFullYear();
  const leagueId = config.espn.leagueId || DEFAULT_PUBLIC_LEAGUE_ID;
  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=kona_playercard`;

  try {
    const data = await makeRequest(url, { retries: MAX_RETRIES });
    
    // Find player and extract advanced metrics
    // Note: This requires investigation of ESPN's actual response format
    // Placeholder implementation
    console.warn('[ESPN Fantasy API] Advanced metrics endpoint needs implementation based on actual API structure');
    return null;
  } catch (error) {
    console.error('[ESPN Fantasy API] Error fetching advanced metrics:', error);
    return null;
  }
}
