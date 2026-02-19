/**
 * Player Data Validation Schemas
 *
 * Zod schemas for validating player data from various sources (API, CSV, static pools).
 * These schemas ensure type safety and runtime validation of player data structures.
 */

import { z } from 'zod';

import type {
  FantasyPosition,
  NFLTeam,
  SportsDataProjections,
  PlayerPoolEntry,
} from '@/types/player';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/** Fantasy position enum */
export const fantasyPositionSchema = z.enum([
  'QB',
  'RB',
  'WR',
  'TE',
] as const);

/** NFL team enum */
export const nflTeamSchema = z.enum([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
] as const);

/** SportsData.io projections */
export const sportsDataProjectionsSchema = z.object({
  ppr: z.number().min(0).default(0),
  halfPpr: z.number().min(0).default(0),
  standard: z.number().min(0).default(0),
  passingYards: z.number().min(0).default(0),
  passingTDs: z.number().min(0).default(0),
  rushingYards: z.number().min(0).default(0),
  rushingTDs: z.number().min(0).default(0),
  receivingYards: z.number().min(0).default(0),
  receivingTDs: z.number().min(0).default(0),
  receptions: z.number().min(0).default(0),
}).strict();

// ============================================================================
// PLAYER POOL SCHEMA
// ============================================================================

/** Player pool entry validation schema */
export const playerPoolEntrySchema = z.object({
  name: z.string().min(1, 'Player name is required'),
  position: fantasyPositionSchema,
  team: z.string().min(1, 'Team is required'),
  bye: z.number().nullable().default(null),
  adp: z.number().nullable().default(null),
  proj: z.union([z.string(), z.number()]).default('0'),
  databaseId: z.string().optional(),
  draftkingsRank: z.number().nullable().optional(),
  draftkingsPositionRank: z.string().nullable().optional(),
  sportsDataProjections: sportsDataProjectionsSchema.optional(),
}).strict();

/** Array of player pool entries */
export const playerPoolArraySchema = z.array(playerPoolEntrySchema);

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/** Basic player info from API */
export const playerBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: fantasyPositionSchema,
  team: z.union([nflTeamSchema, z.string()]),
});

/** Player with headshot from API */
export const playerWithHeadshotSchema = playerBaseSchema.extend({
  playerId: z.number().optional(),
  headshotUrl: z.string().nullable().default(null),
  number: z.number().nullable().optional(),
});

/** Player list item */
export const playerListItemSchema = playerBaseSchema.extend({
  bye: z.number().nullable().default(null),
  adp: z.number().nullable().default(null),
  proj: z.union([z.string(), z.number()]).default('0'),
  headshotUrl: z.string().nullable().optional(),
});

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

/** Player database metadata */
export const playerDatabaseMetaSchema = z.object({
  lastUpdated: z.string().datetime().optional(),
  source: z.string().optional(),
  version: z.string().optional(),
  totalPlayers: z.number().default(0),
  note: z.string().optional(),
});

/** Player database by position */
export const playerDatabaseSchema = z.object({
  meta: playerDatabaseMetaSchema,
  players: z.object({
    QB: playerPoolArraySchema.default([]),
    RB: playerPoolArraySchema.default([]),
    WR: playerPoolArraySchema.default([]),
    TE: playerPoolArraySchema.default([]),
  }).default({ QB: [], RB: [], WR: [], TE: [] }),
}).strict();

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

/**
 * Validate and parse a player pool entry
 */
export function validatePlayerPoolEntry(data: unknown): PlayerPoolEntry {
  return playerPoolEntrySchema.parse(data) as PlayerPoolEntry;
}

/**
 * Validate an array of player pool entries
 */
export function validatePlayerPool(data: unknown): PlayerPoolEntry[] {
  return playerPoolArraySchema.parse(data) as PlayerPoolEntry[];
}

/**
 * Validate a player database JSON
 */
export function validatePlayerDatabase(data: unknown) {
  return playerDatabaseSchema.parse(data);
}

/**
 * Safely parse a player pool entry, returning null on validation error
 */
export function tryParsePlayerPoolEntry(data: unknown): PlayerPoolEntry | null {
  try {
    return playerPoolEntrySchema.parse(data) as PlayerPoolEntry;
  } catch {
    return null;
  }
}

/**
 * Safely parse a player pool array, returning empty array on validation error
 */
export function tryParsePlayerPool(data: unknown): PlayerPoolEntry[] {
  try {
    return playerPoolArraySchema.parse(data) as PlayerPoolEntry[];
  } catch {
    return [];
  }
}
