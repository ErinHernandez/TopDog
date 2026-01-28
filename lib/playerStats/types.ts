/**
 * Player Stats Types
 *
 * TypeScript interfaces for Firestore playerStats collection.
 * Used by API endpoints, hooks, and migration scripts.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// STAT INTERFACES
// ============================================================================

export interface PassingStats {
  attempts: number | null;
  completions: number | null;
  yards: number;
  touchdowns: number;
  interceptions: number | null;
  sacks: number | null;
}

export interface RushingStats {
  attempts: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerAttempt: number | null;
}

export interface ReceivingStats {
  targets: number | null;
  receptions: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerReception: number | null;
}

export interface ScrimmageStats {
  touches: number | null;
  yards: number;
  touchdowns: number;
}

export interface FantasyStats {
  points: number;
  ppr_points: number;
}

export interface SeasonStats {
  year: number;
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

export interface CareerStats {
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

// ============================================================================
// POSITION TYPE
// ============================================================================

export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE';

// ============================================================================
// FIRESTORE DOCUMENT INTERFACES
// ============================================================================

/**
 * Firestore document schema for /playerStats/{playerId}
 */
export interface PlayerStatsDocument {
  // Identity
  id: string;           // Normalized player name (e.g., 'josh_allen')
  name: string;         // Display name (e.g., 'Josh Allen')
  position: PlayerPosition;
  team: string;         // Team abbreviation (e.g., 'BUF')

  // Stats (embedded for single read)
  seasons: SeasonStats[];
  career: CareerStats;

  // Projections & Rankings
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  projectedPoints?: number;

  // Metadata
  updatedAt: Timestamp;
  databaseId?: string;
  clayLastUpdated?: string;
}

/**
 * Firestore document schema for /playerStatsMetadata/current
 */
export interface PlayerStatsMetadataDocument {
  version: string;
  totalPlayers: number;
  lastUpdated: Timestamp;
  source: string;
  successfulMigrations: number;
  failedMigrations: number;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * API response for player stats (serialized from Firestore)
 */
export interface PlayerStatsResponse {
  id: string;
  name: string;
  position: PlayerPosition;
  team: string;
  seasons: SeasonStats[];
  career: CareerStats;
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  projectedPoints?: number;
  updatedAt: string;  // ISO string (serialized from Timestamp)
  databaseId?: string;
  clayLastUpdated?: string;
}

/**
 * API response for all player stats
 */
export interface AllPlayerStatsResponse {
  metadata: {
    version: string;
    totalPlayers: number;
    lastUpdated: string;
    source: string;
    cacheHit?: boolean;
  };
  players: Record<string, PlayerStatsResponse>;
}

/**
 * API response for players by position
 */
export interface PlayersByPositionResponse {
  position: PlayerPosition;
  count: number;
  players: PlayerStatsResponse[];
}

// ============================================================================
// LEGACY COMPATIBILITY INTERFACES
// ============================================================================

/**
 * Legacy PlayerStats interface for backward compatibility
 * Maps to the original staticPlayerStats.ts format
 */
export interface LegacyPlayerStats {
  name: string;
  position: string;
  team: string;
  seasons: SeasonStats[];
  career: CareerStats;
  databaseId?: string;
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  clayLastUpdated?: string;
  [key: string]: unknown;
}

/**
 * Legacy StatsMetadata interface for backward compatibility
 */
export interface LegacyStatsMetadata {
  generatedAt: string;
  totalPlayers: number;
  successfulFetches: number;
  failedFetches: number;
  version: string;
  source: string;
}

/**
 * Legacy StaticPlayerStatsData interface for backward compatibility
 */
export interface LegacyStaticPlayerStatsData {
  metadata: LegacyStatsMetadata;
  players: Record<string, LegacyPlayerStats>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Position counts for stats summary
 */
export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  [key: string]: number;
}

/**
 * Normalize player name for use as Firestore document ID
 * e.g., 'Josh Allen' -> 'josh_allen'
 */
export function normalizePlayerId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Convert Firestore document to API response
 */
export function documentToResponse(doc: PlayerStatsDocument): PlayerStatsResponse {
  return {
    id: doc.id,
    name: doc.name,
    position: doc.position,
    team: doc.team,
    seasons: doc.seasons,
    career: doc.career,
    draftkingsRank: doc.draftkingsRank,
    draftkingsADP: doc.draftkingsADP,
    clayRank: doc.clayRank,
    projectedPoints: doc.projectedPoints,
    updatedAt: doc.updatedAt.toDate().toISOString(),
    databaseId: doc.databaseId,
    clayLastUpdated: doc.clayLastUpdated,
  };
}
