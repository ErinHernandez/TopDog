/**
 * Draft Validation Schemas
 *
 * Schemas for draft room management, picks, and player queues.
 *
 * @module lib/validation/draft
 */

import { z } from 'zod';

import { firebaseUserIdSchema } from './primitives';

// ============================================================================
// DRAFT IDENTIFIERS
// ============================================================================

/**
 * Draft room ID
 */
export const draftRoomIdSchema = z
  .string()
  .min(10, 'Draft room ID too short')
  .max(64, 'Draft room ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid draft room ID format');

/**
 * Player ID
 */
export const playerIdSchema = z
  .string()
  .min(1, 'Player ID is required')
  .max(64, 'Player ID too long');

/**
 * Football position
 */
export const positionSchema = z.enum(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FLEX']);

export type Position = z.infer<typeof positionSchema>;

// ============================================================================
// DRAFT ROOM OPERATIONS
// ============================================================================

/**
 * Create draft room request
 */
export const createDraftRoomSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  teamCount: z.number().int().min(2).max(20),
  rosterSize: z.number().int().min(10).max(30),
  pickTimeSeconds: z.number().int().min(30).max(86400), // 30 sec to 24 hours
  scoringFormat: z.enum(['ppr', 'half-ppr', 'standard']).default('ppr'),
  tournamentId: z.string().optional(),
});

export type CreateDraftRoomInput = z.infer<typeof createDraftRoomSchema>;

/**
 * Draft pick request (minimal: roomId + playerId)
 */
export const draftPickRequestSchema = z.object({
  playerId: playerIdSchema,
  roomId: draftRoomIdSchema,
});

export type DraftPickRequestInput = z.infer<typeof draftPickRequestSchema>;

/**
 * Submit pick request (POST /api/draft/submit-pick)
 * Validates roomId, userId, playerId format and length.
 */
export const submitPickRequestSchema = z.object({
  roomId: draftRoomIdSchema,
  userId: firebaseUserIdSchema,
  playerId: playerIdSchema,
  isAutopick: z.boolean().optional(),
  source: z.enum(['manual', 'queue', 'custom_ranking', 'adp']).optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number(),
    })
    .optional(),
  deviceId: z.string().max(64).optional(),
});

export type SubmitPickRequestInput = z.infer<typeof submitPickRequestSchema>;

/**
 * Validate pick request (POST /api/draft/validate-pick)
 */
export const validatePickRequestSchema = z.object({
  roomId: draftRoomIdSchema,
  userId: firebaseUserIdSchema,
  playerId: playerIdSchema,
  pickNumber: z.number().int().positive('pickNumber must be positive'),
});

export type ValidatePickRequestInput = z.infer<typeof validatePickRequestSchema>;

/**
 * Quick pick request (POST /api/slow-drafts/[draftId]/quick-pick)
 * draftId comes from query; body has userId, playerId, optional location/deviceId.
 */
export const quickPickRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  playerId: playerIdSchema,
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number(),
    })
    .optional(),
  deviceId: z.string().max(64).optional(),
});

export type QuickPickRequestInput = z.infer<typeof quickPickRequestSchema>;

/**
 * Update player queue request
 */
export const updateQueueSchema = z.object({
  roomId: draftRoomIdSchema,
  playerIds: z.array(playerIdSchema).max(100),
});

export type UpdateQueueInput = z.infer<typeof updateQueueSchema>;

/**
 * Draft withdraw request
 */
export const draftWithdrawRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  draftId: z.string().min(1).max(200),
});

export type DraftWithdrawRequest = z.infer<typeof draftWithdrawRequestSchema>;

// ============================================================================
// FANTASY PLAYER DATA (External API)
// ============================================================================

/**
 * Fantasy player schema for external API responses
 * Handles both camelCase and PascalCase field names from external APIs
 */
export const fantasyPlayerSchema = z.object({
  // PascalCase (from some external APIs)
  Position: z.string().optional(),
  Name: z.string().optional(),
  Team: z.string().optional(),
  AverageDraftPositionPPR: z.number().optional(),
  AverageDraftPosition: z.number().optional(),
  ProjectedFantasyPointsPPR: z.number().optional(),
  ProjectedFantasyPoints: z.number().optional(),
  PositionRank: z.number().optional(),
  ByeWeek: z.number().optional(),
  AverageDraftPositionRank: z.number().optional(),
  // camelCase (normalized internal format)
  position: z.string().optional(),
  name: z.string().optional(),
  team: z.string().optional(),
  adpPPR: z.number().optional(),
  adp: z.number().optional(),
  projectedPointsPPR: z.number().optional(),
  projectedPoints: z.number().optional(),
  positionRank: z.number().optional(),
  byeWeek: z.number().optional(),
  overallRank: z.number().optional(),
}).passthrough(); // Allow additional fields from external APIs

/**
 * Array of fantasy players from external API
 */
export const fantasyPlayersResponseSchema = z.array(fantasyPlayerSchema);

export type FantasyPlayer = z.infer<typeof fantasyPlayerSchema>;
