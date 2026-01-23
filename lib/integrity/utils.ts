/**
 * Utility functions for integrity system
 */

/**
 * Normalize a user pair to consistent ordering (lexicographic)
 * Ensures userId1 < userId2 always
 */
export function normalizeUserPair(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

/**
 * Create a pair ID from two user IDs
 * Always uses consistent ordering
 */
export function createPairId(userIdA: string, userIdB: string): string {
  const [userId1, userId2] = normalizeUserPair(userIdA, userIdB);
  return `${userId1}_${userId2}`;
}

/**
 * Parse a pair ID back to user IDs
 */
export function parsePairId(pairId: string): { userId1: string; userId2: string } | null {
  const parts = pairId.split('_');
  if (parts.length !== 2) return null;
  return { userId1: parts[0], userId2: parts[1] };
}

/**
 * Truncate user ID for display (first 8 characters)
 */
export function truncateUserId(userId: string, length: number = 8): string {
  return userId.length > length ? userId.slice(0, length) : userId;
}

/**
 * Calculate average of numbers array
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
