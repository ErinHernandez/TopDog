/**
 * PayMongo Currency Configuration
 *
 * Handles PHP (Philippine Peso) currency formatting and validation.
 * PHP uses centavos (1/100 of a peso) as the smallest unit.
 *
 * @module lib/paymongo/currencyConfig
 */

import {
  toSmallestUnit as centralToSmallestUnit,
  toDisplayAmount as centralToDisplayAmount,
} from '../stripe/currencyConfig';

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

/**
 * PHP currency configuration
 */
export const PHP_CONFIG = {
  /** Currency code */
  code: 'PHP',
  /** Currency symbol */
  symbol: '₱',
  /** Currency name */
  name: 'Philippine Peso',
  /** Decimal places */
  decimals: 2,
  /** Smallest unit name */
  smallestUnitName: 'centavos',
  /** Minimum deposit in centavos (100 PHP = 10000 centavos) */
  minimumDepositCentavos: 10000,
  /** Maximum deposit in centavos (100,000 PHP = 10,000,000 centavos) */
  maximumDepositCentavos: 10000000,
  /** Minimum withdrawal in centavos (500 PHP = 50000 centavos) */
  minimumWithdrawalCentavos: 50000,
};

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert display amount to smallest unit
 *
 * @param amount - Amount in display format (e.g., PHP amount)
 * @param currency - Currency code (defaults to 'PHP' for backward compatibility)
 * @returns Amount in smallest unit (e.g., centavos)
 */
export function toSmallestUnit(amount: number, currency: string = 'PHP'): number {
  return centralToSmallestUnit(amount, currency);
}

/**
 * Convert smallest unit to display amount
 *
 * @param smallestUnit - Amount in smallest unit (e.g., centavos)
 * @param currency - Currency code (defaults to 'PHP' for backward compatibility)
 * @returns Amount in display format (e.g., PHP amount)
 */
export function toDisplayAmount(smallestUnit: number, currency: string = 'PHP'): number {
  return centralToDisplayAmount(smallestUnit, currency);
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format amount for display with currency symbol
 * 
 * @param centavos - Amount in centavos
 * @param options - Formatting options
 * @returns Formatted string (e.g., "₱1,234.56")
 */
export function formatPhpAmount(
  centavos: number,
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  } = {}
): string {
  const { showSymbol = true, showDecimals = true } = options;
  const amount = toDisplayAmount(centavos);
  
  const formatted = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  
  return showSymbol ? `${PHP_CONFIG.symbol}${formatted}` : formatted;
}

/**
 * Parse user input string to centavos
 * 
 * @param input - User input string (e.g., "1,234.56" or "1234")
 * @returns Amount in centavos, or null if invalid
 */
export function parsePhpInput(input: string): number | null {
  // Remove currency symbol and whitespace
  const cleaned = input.replace(/[₱,\s]/g, '');
  
  // Parse as float
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount) || amount < 0) {
    return null;
  }
  
  return toSmallestUnit(amount);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formattedMin?: string;
  formattedMax?: string;
}

/**
 * Validate deposit amount
 * 
 * @param centavos - Amount in centavos
 * @returns Validation result
 */
export function validateDepositAmount(centavos: number): ValidationResult {
  const min = PHP_CONFIG.minimumDepositCentavos;
  const max = PHP_CONFIG.maximumDepositCentavos;
  
  if (centavos < min) {
    return {
      isValid: false,
      error: `Minimum deposit is ${formatPhpAmount(min)}`,
      formattedMin: formatPhpAmount(min),
    };
  }
  
  if (centavos > max) {
    return {
      isValid: false,
      error: `Maximum deposit is ${formatPhpAmount(max)}`,
      formattedMax: formatPhpAmount(max),
    };
  }
  
  return { isValid: true };
}

/**
 * Validate withdrawal amount
 * 
 * @param centavos - Amount in centavos
 * @param balanceCentavos - User's current balance in centavos
 * @returns Validation result
 */
export function validateWithdrawalAmount(
  centavos: number,
  balanceCentavos: number
): ValidationResult {
  const min = PHP_CONFIG.minimumWithdrawalCentavos;
  
  if (centavos < min) {
    return {
      isValid: false,
      error: `Minimum withdrawal is ${formatPhpAmount(min)}`,
      formattedMin: formatPhpAmount(min),
    };
  }
  
  if (centavos > balanceCentavos) {
    return {
      isValid: false,
      error: `Insufficient balance. You have ${formatPhpAmount(balanceCentavos)}`,
    };
  }
  
  return { isValid: true };
}

// ============================================================================
// QUICK AMOUNTS
// ============================================================================

/**
 * Quick deposit amounts in PHP (display values)
 */
export const QUICK_DEPOSIT_AMOUNTS_PHP = [500, 1000, 2500, 5000, 10000, 25000];

/**
 * Get quick deposit amounts in centavos
 */
export function getQuickDepositAmounts(): { display: number; centavos: number }[] {
  return QUICK_DEPOSIT_AMOUNTS_PHP.map(amount => ({
    display: amount,
    centavos: toSmallestUnit(amount),
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PHP_CONFIG as PAYMONGO_CURRENCY_CONFIG,
};


