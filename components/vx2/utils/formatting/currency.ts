/**
 * Currency Formatting Utilities
 * 
 * Functions for formatting monetary values consistently.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FormatCurrencyOptions {
  /** Currency code (default: USD) */
  currency?: string;
  /** Show cents even for whole dollar amounts */
  showCents?: boolean;
  /** Use compact notation for large numbers (e.g., $1.5M) */
  compact?: boolean;
  /** Include plus sign for positive amounts */
  showPlusSign?: boolean;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Format cents to currency string
 * 
 * @param cents - Amount in cents
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCents(2500) // "$25.00"
 * formatCents(2500, { showCents: false }) // "$25"
 * formatCents(1500000, { compact: true }) // "$15K"
 */
export function formatCents(
  cents: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'USD',
    showCents = true,
    compact = false,
    showPlusSign = false,
  } = options;
  
  const dollars = cents / 100;
  const isNegative = dollars < 0;
  const absValue = Math.abs(dollars);
  
  // Compact formatting for large numbers
  if (compact && absValue >= 1000) {
    const formatted = formatCompactCurrency(absValue);
    const sign = isNegative ? '-' : (showPlusSign && dollars > 0 ? '+' : '');
    return `${sign}$${formatted}`;
  }
  
  // Standard formatting
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  
  let formatted = formatter.format(absValue);
  
  // Add signs
  if (isNegative) {
    formatted = `-${formatted}`;
  } else if (showPlusSign && dollars > 0) {
    formatted = `+${formatted}`;
  }
  
  return formatted;
}

/**
 * Format dollars to currency string
 * 
 * @param dollars - Amount in dollars
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatDollars(
  dollars: number,
  options: FormatCurrencyOptions = {}
): string {
  return formatCents(dollars * 100, options);
}

/**
 * Format large currency values in compact notation
 * 
 * @param value - Value in dollars
 * @returns Compact formatted string (without $ sign)
 * 
 * @example
 * formatCompactCurrency(1500000) // "1.5M"
 * formatCompactCurrency(2500) // "2.5K"
 */
export function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    const billions = absValue / 1_000_000_000;
    return `${billions.toFixed(billions < 10 ? 1 : 0)}B`;
  }
  
  if (absValue >= 1_000_000) {
    const millions = absValue / 1_000_000;
    return `${millions.toFixed(millions < 10 ? 1 : 0)}M`;
  }
  
  if (absValue >= 1_000) {
    const thousands = absValue / 1_000;
    return `${thousands.toFixed(thousands < 10 ? 1 : 0)}K`;
  }
  
  return absValue.toString();
}

/**
 * Parse a currency string to cents
 * 
 * @param value - Currency string (e.g., "$25.00", "25", "$2M")
 * @returns Amount in cents, or null if invalid
 */
export function parseCurrency(value: string): number | null {
  if (!value) return null;
  
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[$,\s]/g, '').trim();
  
  // Handle compact notation
  const multipliers: Record<string, number> = {
    'k': 1_000,
    'K': 1_000,
    'm': 1_000_000,
    'M': 1_000_000,
    'b': 1_000_000_000,
    'B': 1_000_000_000,
  };
  
  const lastChar = cleaned.slice(-1);
  if (multipliers[lastChar]) {
    const numPart = parseFloat(cleaned.slice(0, -1));
    if (isNaN(numPart)) return null;
    return Math.round(numPart * multipliers[lastChar] * 100);
  }
  
  // Standard parsing
  const numValue = parseFloat(cleaned);
  if (isNaN(numValue)) return null;
  
  return Math.round(numValue * 100);
}

