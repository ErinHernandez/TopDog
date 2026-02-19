/**
 * Feature Flags
 * 
 * Centralized feature flag management for gradual rollouts.
 * 
 * Part of Phase 0: Safety Net
 */

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  /**
   * Use refactored draft room implementation
   * Set NEXT_PUBLIC_USE_NEW_DRAFT_ROOM=true to enable
   */
  USE_REFACTORED_DRAFT_ROOM: process.env.NEXT_PUBLIC_USE_NEW_DRAFT_ROOM === 'true',
} as const;

// ============================================================================
// ROLLOUT HELPERS
// ============================================================================

/**
 * Simple hash function for deterministic user-based rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if a user should use the new draft room based on rollout percentage
 * 
 * @param userId - User ID for deterministic rollout
 * @returns true if user should use new draft room
 */
export function shouldUseNewDraftRoom(userId: string): boolean {
  // Check explicit feature flag first
  if (FEATURE_FLAGS.USE_REFACTORED_DRAFT_ROOM) {
    return true;
  }

  // Check rollout percentage
  const rolloutPercentage = Number(process.env.NEXT_PUBLIC_NEW_DRAFT_ROOM_ROLLOUT || 0);
  if (rolloutPercentage <= 0) {
    return false;
  }

  // Deterministic rollout based on user ID hash
  const hash = simpleHash(userId);
  return hash % 100 < rolloutPercentage;
}
