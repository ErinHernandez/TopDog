/**
 * Xendit Currency Configuration
 * 
 * Handles IDR (Indonesian Rupiah) currency formatting and validation.
 * IDR has NO decimal places - all amounts are whole numbers.
 * 
 * @module lib/xendit/currencyConfig
 */

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

/**
 * IDR currency configuration
 */
export const IDR_CONFIG = {
  /** Currency code */
  code: 'IDR',
  /** Currency symbol */
  symbol: 'Rp',
  /** Currency name */
  name: 'Indonesian Rupiah',
  /** Decimal places (IDR has none) */
  decimals: 0,
  /** Minimum deposit (IDR 50,000) */
  minimumDeposit: 50000,
  /** Maximum deposit (IDR 100,000,000) */
  maximumDeposit: 100000000,
  /** Minimum withdrawal (IDR 100,000) */
  minimumWithdrawal: 100000,
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format IDR amount for display
 * 
 * @param amount - Amount in IDR (whole number)
 * @param options - Formatting options
 * @returns Formatted string (e.g., "Rp 1.234.567")
 */
export function formatIdrAmount(
  amount: number,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, compact = false } = options;
  
  if (compact && amount >= 1000000) {
    // Format as millions (jt = juta = million)
    const millions = amount / 1000000;
    const formatted = millions % 1 === 0 
      ? millions.toString() 
      : millions.toFixed(1);
    return showSymbol ? `Rp ${formatted}jt` : `${formatted}jt`;
  }
  
  if (compact && amount >= 1000) {
    // Format as thousands (rb = ribu = thousand)
    const thousands = amount / 1000;
    const formatted = thousands % 1 === 0 
      ? thousands.toString() 
      : thousands.toFixed(1);
    return showSymbol ? `Rp ${formatted}rb` : `${formatted}rb`;
  }
  
  // Use Indonesian locale (dot as thousand separator)
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return showSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Parse user input string to IDR amount
 * 
 * @param input - User input string (e.g., "1.234.567" or "1234567")
 * @returns Amount in IDR, or null if invalid
 */
export function parseIdrInput(input: string): number | null {
  // Remove currency symbol, dots, and whitespace
  const cleaned = input.replace(/[Rp.\s]/gi, '');
  
  // Parse as integer (no decimals in IDR)
  const amount = parseInt(cleaned, 10);
  
  if (isNaN(amount) || amount < 0) {
    return null;
  }
  
  return amount;
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
 * @param amount - Amount in IDR
 * @returns Validation result
 */
export function validateDepositAmount(amount: number): ValidationResult {
  const min = IDR_CONFIG.minimumDeposit;
  const max = IDR_CONFIG.maximumDeposit;
  
  if (amount < min) {
    return {
      isValid: false,
      error: `Minimum deposit is ${formatIdrAmount(min)}`,
      formattedMin: formatIdrAmount(min),
    };
  }
  
  if (amount > max) {
    return {
      isValid: false,
      error: `Maximum deposit is ${formatIdrAmount(max)}`,
      formattedMax: formatIdrAmount(max),
    };
  }
  
  return { isValid: true };
}

/**
 * Validate withdrawal amount
 * 
 * @param amount - Amount in IDR
 * @param balance - User's current balance in IDR
 * @returns Validation result
 */
export function validateWithdrawalAmount(
  amount: number,
  balance: number
): ValidationResult {
  const min = IDR_CONFIG.minimumWithdrawal;
  
  if (amount < min) {
    return {
      isValid: false,
      error: `Minimum withdrawal is ${formatIdrAmount(min)}`,
      formattedMin: formatIdrAmount(min),
    };
  }
  
  if (amount > balance) {
    return {
      isValid: false,
      error: `Insufficient balance. You have ${formatIdrAmount(balance)}`,
    };
  }
  
  return { isValid: true };
}

// ============================================================================
// QUICK AMOUNTS
// ============================================================================

/**
 * Quick deposit amounts in IDR
 */
export const QUICK_DEPOSIT_AMOUNTS_IDR = [
  50000,
  100000,
  250000,
  500000,
  1000000,
  2500000,
];

/**
 * Get quick deposit amounts with formatted display
 */
export function getQuickDepositAmounts(): { amount: number; display: string }[] {
  return QUICK_DEPOSIT_AMOUNTS_IDR.map(amount => ({
    amount,
    display: formatIdrAmount(amount, { compact: true }),
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  IDR_CONFIG as XENDIT_CURRENCY_CONFIG,
};


