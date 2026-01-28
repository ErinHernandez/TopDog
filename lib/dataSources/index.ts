/**
 * Data Source Abstraction Layer
 * 
 * Provides a unified interface for accessing player data from multiple sources.
 * Automatically handles source selection, fallback, and data transformation.
 */

import type { ProjectionData, HistoricalStats, AdvancedMetrics, GetProjectionsOptions } from './types';
import { getProjectionsSource, getHistoricalSource } from './config';
import * as espnFantasy from './espnFantasy';
import * as sportsdataio from './sportsdataio';

// ============================================================================
// PROJECTIONS
// ============================================================================

/**
 * Get player projections from the configured data source with automatic fallback
 * 
 * @param season - NFL season year
 * @param options - Query options (position filter, limit, force refresh)
 * @returns Array of projection data
 */
export async function getProjections(
  season: number,
  options: GetProjectionsOptions = {}
): Promise<ProjectionData[]> {
  const source = getProjectionsSource();
  let lastError: Error | null = null;

  // Try configured source first
  try {
    if (source === 'espn') {
      const data = await espnFantasy.getPlayerProjections(season, options);
      return data;
    } else {
      const data = await sportsdataio.getPlayerProjections(season, options);
      return data;
    }
  } catch (error) {
    lastError = error as Error;

    // Fallback to SportsDataIO if ESPN failed
    if (source === 'espn') {
      try {
        const data = await sportsdataio.getPlayerProjections(season, options);
        return data;
      } catch (fallbackError) {
        throw new Error(
          `Both ESPN and SportsDataIO failed. ESPN error: ${lastError.message}, SportsDataIO error: ${(fallbackError as Error).message}`
        );
      }
    } else {
      // SportsDataIO was primary and failed, no fallback available
      throw error;
    }
  }
}

// ============================================================================
// HISTORICAL STATS (for ingestion script only)
// ============================================================================

/**
 * Get historical stats for a player (used by ingestion script)
 * 
 * @param espnPlayerId - ESPN player ID
 * @param season - Season year
 * @returns Historical stats or null if not found
 */
export async function getHistoricalStats(
  espnPlayerId: string,
  season: number
): Promise<HistoricalStats | null> {
  const source = getHistoricalSource();

  if (source === 'espn_fantasy') {
    return await espnFantasy.getPlayerHistoricalStats(espnPlayerId, season);
  } else {
    // espn_core or sportsdataio - handled by ingestion script directly
    // This function is mainly for consistency
    return null;
  }
}

// ============================================================================
// ADVANCED METRICS (ESPN only)
// ============================================================================

/**
 * Get advanced metrics for a player (xFP, EPA, consistency)
 * Only available from ESPN Fantasy API
 * 
 * @param espnPlayerId - ESPN player ID
 * @returns Advanced metrics or null if not available
 */
export async function getPlayerAdvancedMetrics(
  espnPlayerId: string
): Promise<AdvancedMetrics | null> {
  const source = getProjectionsSource();

  if (source === 'espn') {
    return await espnFantasy.getPlayerAdvancedMetrics(espnPlayerId);
  }

  // Not available from SportsDataIO
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  getProjectionsSource, 
  getHistoricalSource, 
  getDataSourceConfig, 
  validateConfig 
} from './config';

export type { 
  ProjectionData, 
  HistoricalStats, 
  AdvancedMetrics, 
  DataSource, 
  HistoricalDataSource,
  GetProjectionsOptions
} from './types';
