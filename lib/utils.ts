/**
 * Utility function to merge className strings
 * Simple concatenation with space separation
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
