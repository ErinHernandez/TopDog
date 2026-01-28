/**
 * Tournament Filter Configuration
 *
 * Centralized configuration for filtering tournaments across the application.
 * Allows filtering by inclusion patterns, exclusion patterns, and custom rules.
 *
 * ## Configuration via Environment Variables
 *
 * Filters can be overridden via environment variables:
 * - TOURNAMENT_FILTER_SLOW_DRAFTS_INCLUDE=topdog international,elite series
 * - TOURNAMENT_FILTER_SLOW_DRAFTS_EXCLUDE=test,practice
 *
 * @module lib/config/tournamentFilters
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentFilterConfig {
  /** Patterns that tournament names must match (case-insensitive) */
  includePatterns: string[];
  /** Patterns that tournament names must NOT match (case-insensitive) */
  excludePatterns: string[];
  /** Whether to use strict matching (starts with) vs contains */
  strictMatch: boolean;
  /** Optional description for logging/debugging */
  description?: string;
}

export interface TournamentFilters {
  slowDrafts: TournamentFilterConfig;
  publicTournaments: TournamentFilterConfig;
  [key: string]: TournamentFilterConfig;
}

// ============================================================================
// ENVIRONMENT VARIABLE HELPERS
// ============================================================================

/**
 * Parse a comma-separated list from environment variable
 */
function parseEnvList(key: string, defaultValue: string[]): string[] {
  const envValue = process.env[key];
  if (envValue) {
    return envValue
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
  }
  return defaultValue;
}

/**
 * Parse a boolean from environment variable
 */
function parseEnvBool(key: string, defaultValue: boolean): boolean {
  const envValue = process.env[key];
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true' || envValue === '1';
  }
  return defaultValue;
}

// ============================================================================
// DEFAULT FILTER VALUES
// ============================================================================

const SLOW_DRAFTS_DEFAULT_INCLUDE = [
  'topdog international',
];

const SLOW_DRAFTS_DEFAULT_EXCLUDE = [
  'best ball',
  'summer',
  'ultimate',
  'draft masters',
  'gridiron',
  'championship',
  'showdown',
  'bowl',
  'league',
  'premier',
  'elite',
  'regional',
  'test',
  'practice',
];

const PUBLIC_TOURNAMENTS_DEFAULT_INCLUDE: string[] = [];

const PUBLIC_TOURNAMENTS_DEFAULT_EXCLUDE = [
  'test',
  'practice',
  'internal',
  'dev',
  'staging',
];

// ============================================================================
// FILTER CONFIGURATIONS
// ============================================================================

/**
 * Tournament filter configurations by context.
 * Values can be overridden via environment variables.
 */
export const TOURNAMENT_FILTERS: TournamentFilters = {
  /**
   * Slow Drafts Filter
   *
   * Used by: /api/slow-drafts
   * Purpose: Filter to show only specific tournament types in slow draft view
   *
   * Default: Only "TopDog International" tournaments, excluding common
   * tournament types that shouldn't appear in slow drafts.
   */
  slowDrafts: {
    includePatterns: parseEnvList(
      'TOURNAMENT_FILTER_SLOW_DRAFTS_INCLUDE',
      SLOW_DRAFTS_DEFAULT_INCLUDE
    ),
    excludePatterns: parseEnvList(
      'TOURNAMENT_FILTER_SLOW_DRAFTS_EXCLUDE',
      SLOW_DRAFTS_DEFAULT_EXCLUDE
    ),
    strictMatch: parseEnvBool('TOURNAMENT_FILTER_SLOW_DRAFTS_STRICT', true),
    description: 'Filter for slow draft tournament display',
  },

  /**
   * Public Tournaments Filter
   *
   * Used by: /api/tournaments (public listing)
   * Purpose: Filter out test/internal tournaments from public view
   */
  publicTournaments: {
    includePatterns: parseEnvList(
      'TOURNAMENT_FILTER_PUBLIC_INCLUDE',
      PUBLIC_TOURNAMENTS_DEFAULT_INCLUDE
    ),
    excludePatterns: parseEnvList(
      'TOURNAMENT_FILTER_PUBLIC_EXCLUDE',
      PUBLIC_TOURNAMENTS_DEFAULT_EXCLUDE
    ),
    strictMatch: parseEnvBool('TOURNAMENT_FILTER_PUBLIC_STRICT', false),
    description: 'Filter for public tournament listing',
  },
};

// ============================================================================
// FILTER FUNCTIONS
// ============================================================================

/**
 * Check if a tournament name matches the filter configuration
 *
 * @param name - Tournament name to check
 * @param config - Filter configuration to apply
 * @returns true if tournament passes the filter
 */
export function matchesTournamentFilter(
  name: string,
  config: TournamentFilterConfig
): boolean {
  const normalizedName = name.toLowerCase().trim();

  // Check inclusion patterns (if any are specified, at least one must match)
  if (config.includePatterns.length > 0) {
    const matchesInclude = config.includePatterns.some((pattern) => {
      if (config.strictMatch) {
        // Strict: name must start with pattern
        return normalizedName.startsWith(pattern);
      }
      // Loose: name contains pattern
      return normalizedName.includes(pattern);
    });

    if (!matchesInclude) {
      return false;
    }
  }

  // Check exclusion patterns (none should match)
  const matchesExclude = config.excludePatterns.some((pattern) =>
    normalizedName.includes(pattern)
  );

  return !matchesExclude;
}

/**
 * Filter an array of tournaments by name
 *
 * @param tournaments - Array of objects with a name property
 * @param config - Filter configuration to apply
 * @param nameField - Field name containing the tournament name (default: 'name')
 * @returns Filtered array
 */
export function filterTournaments<T extends Record<string, unknown>>(
  tournaments: T[],
  config: TournamentFilterConfig,
  nameField: keyof T = 'name' as keyof T
): T[] {
  return tournaments.filter((tournament) => {
    const name = tournament[nameField];
    if (typeof name !== 'string') {
      return false;
    }
    return matchesTournamentFilter(name, config);
  });
}

/**
 * Get filter configuration for a specific context
 *
 * @param context - Filter context key
 * @returns Filter configuration or undefined if not found
 */
export function getFilterConfig(
  context: keyof TournamentFilters
): TournamentFilterConfig | undefined {
  return TOURNAMENT_FILTERS[context];
}

/**
 * Create a custom filter configuration at runtime
 *
 * @param options - Partial filter options
 * @returns Complete filter configuration
 */
export function createFilterConfig(
  options: Partial<TournamentFilterConfig>
): TournamentFilterConfig {
  return {
    includePatterns: options.includePatterns || [],
    excludePatterns: options.excludePatterns || [],
    strictMatch: options.strictMatch ?? false,
    description: options.description,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TOURNAMENT_FILTERS,
  matchesTournamentFilter,
  filterTournaments,
  getFilterConfig,
  createFilterConfig,
};
