/**
 * SportsDataIO Data Source Wrapper
 * 
 * Wraps the existing SportsDataIO implementation to work with the
 * data source abstraction layer. No changes to existing code.
 */

import type { ProjectionData, GetProjectionsOptions } from './types';

// Import existing SportsDataIO functions
// Use require for CommonJS module compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sportsdataio = require('../sportsdataio');

/**
 * Get projections from SportsDataIO
 */
export async function getPlayerProjections(
  season: number,
  options: GetProjectionsOptions = {}
): Promise<ProjectionData[]> {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    throw new Error('SPORTSDATAIO_API_KEY environment variable is required');
  }

  // Use existing SportsDataIO getProjections function
  // Note: Original function signature is getProjections(apiKey, forceRefresh)
  // Season is not used by SportsDataIO - it always returns current season projections
  let projections;
  try {
    projections = await sportsdataio.getProjections(apiKey, options.forceRefresh || false);
  } catch (error) {
    console.error('[DataSources] SportsDataIO getProjections error:', error);
    throw new Error(`Failed to fetch projections from SportsDataIO: ${error.message}`);
  }
  
  if (!Array.isArray(projections)) {
    throw new Error(`SportsDataIO returned invalid data: expected array, got ${typeof projections}`);
  }

  // Filter by position if specified
  let filtered = projections;
  if (options.position) {
    const positions = options.position.toUpperCase().split(',');
    filtered = projections.filter((p: any) => positions.includes(p.Position));
  }

  // Sort by PPR fantasy points
  filtered.sort((a: any, b: any) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));

  // Apply limit
  const limited = options.limit ? filtered.slice(0, options.limit) : filtered;

  // Add source tracking
  return limited.map((p: any) => ({
    ...p,
    _source: 'sportsdataio' as const,
  }));
}

/**
 * Get historical stats from SportsDataIO
 * Note: SportsDataIO doesn't provide historical stats in the same format,
 * so this is a placeholder that returns null
 */
export async function getPlayerHistoricalStats(
  playerId: string,
  season: number
): Promise<null> {
  // SportsDataIO doesn't provide historical stats in the format we need
  // This is only used by the ingestion script, which uses ESPN Core API
  return null;
}
