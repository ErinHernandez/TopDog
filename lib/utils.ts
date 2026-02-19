/**
 * Merge multiple className strings into a single space-separated string.
 * Filters out falsy values (undefined, null, false) for conditional class application.
 *
 * @param {...(string | undefined | null | false)[]} classes - Variable number of class strings
 * @returns {string} Merged className string with falsy values removed
 * @example
 * cn('px-2', isBold && 'font-bold', 'text-gray-500')
 * // Returns: 'px-2 font-bold text-gray-500' or 'px-2 text-gray-500'
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter((cls: string | undefined | null | false): cls is string => Boolean(cls)).join(' ');
}

/**
 * Assertion function for null/undefined checks with proper TypeScript narrowing
 *
 * Replaces repeated "if (!value)" checks with a single assertion at function start
 *
 * @example
 * ```ts
 * // Before: multiple checks scattered throughout
 * if (!db) return errorResponse();
 * // ... code
 * if (!db) throw new Error('db not initialized');
 *
 * // After: single check at function start
 * assertNonNull(db, 'Firebase database');
 * // TypeScript now knows db is non-null for the rest of the function
 * ```
 */
export function assertNonNull<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${message} is not initialized`);
  }
}
