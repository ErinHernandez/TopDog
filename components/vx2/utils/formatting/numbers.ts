/**
 * Number Formatting Utilities
 * 
 * Functions for formatting numbers consistently.
 */

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Format a number with thousands separators
 * 
 * @param value - Number to format
 * @param decimals - Decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.5678, 2) // "1,234.57"
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage
 * 
 * @param value - Percentage value (0-100)
 * @param decimals - Decimal places
 * @param includeSign - Include % sign
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(75.5) // "76%"
 * formatPercentage(75.5, 1) // "75.5%"
 */
export function formatPercentage(
  value: number,
  decimals = 0,
  includeSign = true
): string {
  const formatted = formatNumber(value, decimals);
  return includeSign ? `${formatted}%` : formatted;
}

/**
 * Format a number in compact notation
 * 
 * @param value - Number to format
 * @param decimals - Decimal places for large numbers
 * @returns Compact formatted string
 * 
 * @example
 * formatCompact(1500) // "1.5K"
 * formatCompact(1500000) // "1.5M"
 */
export function formatCompact(value: number, decimals = 1): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }
  return `${sign}${absValue}`;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 * 
 * @param value - Number to format
 * @returns Ordinal string
 * 
 * @example
 * formatOrdinal(1) // "1st"
 * formatOrdinal(22) // "22nd"
 */
export function formatOrdinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const remainder = value % 100;
  
  // Special cases for 11, 12, 13
  if (remainder >= 11 && remainder <= 13) {
    return `${value}th`;
  }
  
  const suffix = suffixes[value % 10] || suffixes[0];
  return `${value}${suffix}`;
}

/**
 * Clamp a number between min and max
 * 
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to specified decimal places
 * 
 * @param value - Number to round
 * @param decimals - Decimal places
 * @returns Rounded number
 */
export function round(value: number, decimals = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format a rank with suffix
 * 
 * @param rank - Rank number
 * @param total - Total number (optional, for "X of Y" format)
 * @returns Formatted rank string
 * 
 * @example
 * formatRank(1) // "#1"
 * formatRank(1245, 571480) // "#1,245 of 571,480"
 */
export function formatRank(rank: number, total?: number): string {
  const formattedRank = `#${formatNumber(rank)}`;
  
  if (total !== undefined) {
    return `${formattedRank} of ${formatNumber(total)}`;
  }
  
  return formattedRank;
}

