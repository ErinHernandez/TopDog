/**
 * Firebase Timestamp Utilities
 *
 * Provides consistent timestamp conversion across the codebase.
 * Eliminates duplicated toMillis() patterns and centralizes timestamp handling.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Convert various timestamp formats to milliseconds (Unix epoch time)
 *
 * Handles:
 * - Firebase Timestamp objects
 * - JavaScript Date objects
 * - Numbers (already in milliseconds, passed through)
 * - null/undefined (returns 0)
 *
 * @param ts - Timestamp, Date, number, or null
 * @returns Unix milliseconds timestamp, or 0 if input is null/undefined
 *
 * @example
 * // Firebase Timestamp
 * const millis = toMillis(firebaseTimestamp);
 *
 * // JavaScript Date
 * const millis = toMillis(new Date());
 *
 * // Already a number
 * const millis = toMillis(Date.now());
 *
 * // Null safe
 * const millis = toMillis(null); // returns 0
 */
export function toMillis(ts: Timestamp | Date | number | null | undefined): number {
  if (ts === null || ts === undefined) {
    return 0;
  }

  // Firebase Timestamp
  if (ts instanceof Timestamp) {
    return ts.toMillis();
  }

  // JavaScript Date
  if (ts instanceof Date) {
    return ts.getTime();
  }

  // Already a number
  if (typeof ts === 'number') {
    return ts;
  }

  // Fallback - should not happen if types are correct
  return 0;
}

/**
 * Convert Firebase Timestamp to JavaScript Date
 *
 * @param ts - Firebase Timestamp or Date
 * @returns JavaScript Date object, or null if input is null/undefined
 *
 * @example
 * const date = toDate(firebaseTimestamp);
 */
export function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (ts === null || ts === undefined) {
    return null;
  }

  if (ts instanceof Date) {
    return ts;
  }

  if (ts instanceof Timestamp) {
    return ts.toDate();
  }

  return null;
}

/**
 * Check if a value is a Firebase Timestamp
 *
 * @param value - Value to check
 * @returns true if value is a Timestamp instance
 *
 * @example
 * if (isTimestamp(data.createdAt)) {
 *   const millis = data.createdAt.toMillis();
 * }
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

/**
 * Check if a value is a Date object
 *
 * @param value - Value to check
 * @returns true if value is a Date instance
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Format timestamp as ISO string (e.g., "2025-02-07T12:34:56.789Z")
 *
 * @param ts - Timestamp, Date, or number (milliseconds)
 * @returns ISO string, or "Invalid Date" if conversion fails
 *
 * @example
 * const isoString = formatTimestamp(firebaseTimestamp);
 */
export function formatTimestamp(ts: Timestamp | Date | number | null | undefined): string {
  const millis = toMillis(ts);
  if (millis === 0 && ts === null) {
    return 'Invalid Date';
  }
  return new Date(millis).toISOString();
}

/**
 * Get time difference in milliseconds between two timestamps
 *
 * @param ts1 - First timestamp
 * @param ts2 - Second timestamp (defaults to now)
 * @returns Difference in milliseconds (ts2 - ts1)
 *
 * @example
 * const diff = getTimeDiff(startTime, endTime);
 * console.log(`Elapsed: ${diff}ms`);
 */
export function getTimeDiff(
  ts1: Timestamp | Date | number | null | undefined,
  ts2: Timestamp | Date | number | null | undefined = Date.now()
): number {
  return toMillis(ts2) - toMillis(ts1);
}

/**
 * Check if timestamp is older than a certain duration
 *
 * @param ts - Timestamp to check
 * @param durationMs - Duration in milliseconds (e.g., 60 * 1000 for 1 minute)
 * @returns true if timestamp is older than the duration
 *
 * @example
 * if (isOlderThan(lastUpdate, 5 * 60 * 1000)) {
 *   console.log('Last update was more than 5 minutes ago');
 * }
 */
export function isOlderThan(
  ts: Timestamp | Date | number | null | undefined,
  durationMs: number
): boolean {
  return getTimeDiff(ts, Date.now()) > durationMs;
}
