/**
 * draftValidationService
 * 
 * Service for validating draft picks and roster constraints.
 * Pure functions for validation logic.
 * 
 * Part of Phase 2: Extract Services
 */

import { PLAYER_POOL } from '@/lib/playerPool';
import { groupPicksByPosition } from '@/lib/playerPool';
import { DraftPick, Player } from '../types/draft';

export interface PositionLimits {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

export const DEFAULT_POSITION_LIMITS: PositionLimits = {
  QB: 5,
  RB: 11,
  WR: 11,
  TE: 6,
};

export interface CanDraftPlayerOptions {
  playerName: string;
  userPicks: Array<{ player: string }>;
  positionLimits?: PositionLimits;
}

/**
 * Check if a player can be drafted based on positional limits
 */
export function canDraftPlayer({
  playerName,
  userPicks,
  positionLimits = DEFAULT_POSITION_LIMITS,
}: CanDraftPlayerOptions): boolean {
  const playerData = PLAYER_POOL.find((p) => p.name === playerName);
  if (!playerData) {
    return false;
  }

  const userRoster = groupPicksByPosition(
    userPicks.map((p) => p.player),
    PLAYER_POOL
  );

  const currentCount = userRoster[playerData.position]?.length || 0;
  const limit = positionLimits[playerData.position];

  return currentCount < limit;
}

/**
 * Get position count for a user's roster
 */
export function getPositionCount(
  userPicks: Array<{ player: string }>,
  position: string
): number {
  const userRoster = groupPicksByPosition(
    userPicks.map((p) => p.player),
    PLAYER_POOL
  );
  return userRoster[position]?.length || 0;
}

/**
 * Get remaining slots for a position
 */
export function getRemainingSlots(
  userPicks: Array<{ player: string }>,
  position: string,
  positionLimits: PositionLimits = DEFAULT_POSITION_LIMITS
): number {
  const currentCount = getPositionCount(userPicks, position);
  const limit = positionLimits[position as keyof PositionLimits] || 0;
  return Math.max(0, limit - currentCount);
}
