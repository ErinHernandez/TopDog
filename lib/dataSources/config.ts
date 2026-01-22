/**
 * Data Source Configuration
 * 
 * Reads and validates environment variables for data source selection.
 */

import type { DataSource, HistoricalDataSource, DataSourceConfig } from './types';

const DEFAULT_PUBLIC_LEAGUE_ID = 1; // ESPN's default public league

/**
 * Get data source configuration from environment variables
 */
export function getDataSourceConfig(): DataSourceConfig {
  const projections = (process.env.DATA_SOURCE_PROJECTIONS || 'sportsdataio') as DataSource;
  const historical = (process.env.DATA_SOURCE_HISTORICAL || 'espn_core') as HistoricalDataSource;

  const config: DataSourceConfig = {
    projections,
    historical,
  };

  // ESPN configuration (required if using ESPN)
  if (projections === 'espn' || historical === 'espn_fantasy') {
    const s2Cookie = process.env.ESPN_S2_COOKIE;
    const swidCookie = process.env.ESPN_SWID_COOKIE;
    const leagueId = process.env.ESPN_LEAGUE_ID 
      ? parseInt(process.env.ESPN_LEAGUE_ID, 10) 
      : DEFAULT_PUBLIC_LEAGUE_ID;

    if (!s2Cookie || !swidCookie) {
      throw new Error(
        'ESPN credentials required when using ESPN data source. ' +
        'Set ESPN_S2_COOKIE and ESPN_SWID_COOKIE environment variables.'
      );
    }

    config.espn = {
      s2Cookie,
      swidCookie,
      leagueId,
    };
  }

  // SportsDataIO configuration (required for fallback or if using SportsDataIO)
  const sportsdataioKey = process.env.SPORTSDATAIO_API_KEY;
  if (projections === 'sportsdataio' || !sportsdataioKey) {
    // Only require if explicitly using SportsDataIO, or if we need it for fallback
    if (projections === 'sportsdataio' && !sportsdataioKey) {
      throw new Error(
        'SPORTSDATAIO_API_KEY required when using SportsDataIO data source.'
      );
    }
  }

  if (sportsdataioKey) {
    config.sportsdataio = {
      apiKey: sportsdataioKey,
    };
  }

  return config;
}

/**
 * Get the configured data source for projections
 */
export function getProjectionsSource(): DataSource {
  return (process.env.DATA_SOURCE_PROJECTIONS || 'sportsdataio') as DataSource;
}

/**
 * Get the configured data source for historical stats
 */
export function getHistoricalSource(): HistoricalDataSource {
  return (process.env.DATA_SOURCE_HISTORICAL || 'espn_core') as HistoricalDataSource;
}

/**
 * Validate configuration and return helpful error messages
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const projections = getProjectionsSource();
  const historical = getHistoricalSource();

  // Validate ESPN credentials if needed
  if (projections === 'espn' || historical === 'espn_fantasy') {
    if (!process.env.ESPN_S2_COOKIE) {
      errors.push('ESPN_S2_COOKIE is required when using ESPN data source');
    }
    if (!process.env.ESPN_SWID_COOKIE) {
      errors.push('ESPN_SWID_COOKIE is required when using ESPN data source');
    }
  }

  // Validate SportsDataIO if explicitly using it
  if (projections === 'sportsdataio' && !process.env.SPORTSDATAIO_API_KEY) {
    errors.push('SPORTSDATAIO_API_KEY is required when using SportsDataIO data source');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
