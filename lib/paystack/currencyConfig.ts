/**
 * Paystack Currency Configuration
 * 
 * Handles African currency formatting, conversion, and validation.
 * Supports NGN, GHS, ZAR, KES with their respective smallest units.
 * 
 * Currency Units:
 * - NGN: 100 kobo = 1 Naira
 * - GHS: 100 pesewas = 1 Cedi
 * - ZAR: 100 cents = 1 Rand
 * - KES: 100 cents = 1 Shilling
 * 
 * @module lib/paystack/currencyConfig
 */

import type { PaystackCurrencyConfig } from './paystackTypes';

// ============================================================================
// CURRENCY CONFIGURATIONS
// ============================================================================

/**
 * Paystack currency configurations
 */
export const PAYSTACK_CURRENCIES: Record<string, PaystackCurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    smallestUnit: 'kobo',
    factor: 100,
    minAmountSmallest: 10000, // ₦100 minimum (10,000 kobo)
    maxAmountSmallest: 100000000, // ₦1,000,000 maximum
    country: 'NG',
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    smallestUnit: 'pesewas',
    factor: 100,
    minAmountSmallest: 100, // GH₵1 minimum
    maxAmountSmallest: 10000000, // GH₵100,000 maximum
    country: 'GH',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    smallestUnit: 'cents',
    factor: 100,
    minAmountSmallest: 500, // R5 minimum
    maxAmountSmallest: 50000000, // R500,000 maximum
    country: 'ZA',
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    smallestUnit: 'cents',
    factor: 100,
    minAmountSmallest: 1000, // KSh10 minimum (1,000 cents)
    maxAmountSmallest: 50000000, // KSh500,000 maximum
    country: 'KE',
  },
};

/**
 * Country to currency mapping
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  KE: 'KES',
};

/**
 * Currency to country mapping
 */
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  NGN: 'NG',
  GHS: 'GH',
  ZAR: 'ZA',
  KES: 'KE',
};

// ============================================================================
// CURRENCY FUNCTIONS
// ============================================================================

/**
 * Get currency configuration
 */
export function getPaystackCurrencyConfig(currency: string): PaystackCurrencyConfig {
  const config = PAYSTACK_CURRENCIES[currency.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported Paystack currency: ${currency}`);
  }
  return config;
}

/**
 * Get currency for a country
 */
export function getCurrencyForPaystackCountry(country: string): string {
  const currency = COUNTRY_TO_CURRENCY[country.toUpperCase()];
  if (!currency) {
    throw new Error(`No Paystack currency for country: ${country}`);
  }
  return currency;
}

/**
 * Check if a currency is supported by Paystack
 */
export function isPaystackCurrency(currency: string): boolean {
  return currency.toUpperCase() in PAYSTACK_CURRENCIES;
}

// ============================================================================
// AMOUNT CONVERSION
// ============================================================================

/**
 * Convert display amount to smallest unit
 * 
 * @param displayAmount - Amount in main currency unit (e.g., 100.50)
 * @param currency - Currency code
 * @returns Amount in smallest unit (e.g., 10050 kobo)
 */
export function toSmallestUnit(displayAmount: number, currency: string): number {
  const config = getPaystackCurrencyConfig(currency);
  return Math.round(displayAmount * config.factor);
}

/**
 * Convert smallest unit to display amount
 * 
 * @param smallestUnit - Amount in smallest unit (e.g., 10050 kobo)
 * @param currency - Currency code
 * @returns Amount in main currency unit (e.g., 100.50)
 */
export function toDisplayAmount(smallestUnit: number, currency: string): number {
  const config = getPaystackCurrencyConfig(currency);
  return smallestUnit / config.factor;
}

/**
 * Format amount for display with currency symbol
 * 
 * @param smallestUnit - Amount in smallest unit
 * @param currency - Currency code
 * @param options - Formatting options
 * @returns Formatted string (e.g., "₦100.50")
 */
export function formatPaystackAmount(
  smallestUnit: number,
  currency: string,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
  } = {}
): string {
  const { showSymbol = true, showCode = false, decimals = 2 } = options;
  const config = getPaystackCurrencyConfig(currency);
  const displayAmount = toDisplayAmount(smallestUnit, currency);
  
  let formatted = displayAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  if (showSymbol) {
    formatted = `${config.symbol}${formatted}`;
  }
  
  if (showCode) {
    formatted = `${formatted} ${config.code}`;
  }
  
  return formatted;
}

/**
 * Format amount in smallest unit name
 * 
 * @param smallestUnit - Amount in smallest unit
 * @param currency - Currency code
 * @returns Formatted string (e.g., "10,050 kobo")
 */
export function formatSmallestUnit(smallestUnit: number, currency: string): string {
  const config = getPaystackCurrencyConfig(currency);
  const formatted = smallestUnit.toLocaleString('en-US');
  return `${formatted} ${config.smallestUnit}`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate transaction amount
 * 
 * @param smallestUnit - Amount in smallest unit
 * @param currency - Currency code
 * @returns Validation result
 */
export function validatePaystackAmount(
  smallestUnit: number,
  currency: string
): { isValid: boolean; error?: string } {
  try {
    const config = getPaystackCurrencyConfig(currency);
    
    if (!Number.isInteger(smallestUnit)) {
      return {
        isValid: false,
        error: `Amount must be a whole number in ${config.smallestUnit}`,
      };
    }
    
    if (smallestUnit < config.minAmountSmallest) {
      const minDisplay = formatPaystackAmount(config.minAmountSmallest, currency);
      return {
        isValid: false,
        error: `Minimum amount is ${minDisplay}`,
      };
    }
    
    if (smallestUnit > config.maxAmountSmallest) {
      const maxDisplay = formatPaystackAmount(config.maxAmountSmallest, currency);
      return {
        isValid: false,
        error: `Maximum amount is ${maxDisplay}`,
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid currency',
    };
  }
}

// ============================================================================
// TRANSFER FEE CALCULATIONS
// ============================================================================

/**
 * Paystack transfer fee structure (as of 2024)
 * 
 * Nigeria:
 * - ₦10 for amounts ≤ ₦5,000
 * - ₦25 for amounts ₦5,001 - ₦50,000
 * - ₦50 for amounts > ₦50,000
 * 
 * Ghana:
 * - GH₵1 for mobile money
 * - GH₵8 for bank accounts
 * 
 * South Africa:
 * - R3 per transfer
 * 
 * Kenya:
 * - KSh20 for ≤ KSh1,500
 * - KSh40 for KSh1,501 - KSh20,000
 * - KSh60 for > KSh20,000
 */
export function calculateTransferFee(
  smallestUnit: number,
  currency: string,
  recipientType?: 'bank' | 'mobile_money'
): number {
  const config = getPaystackCurrencyConfig(currency);
  const displayAmount = toDisplayAmount(smallestUnit, currency);
  
  switch (currency.toUpperCase()) {
    case 'NGN':
      if (displayAmount <= 5000) return 1000; // ₦10
      if (displayAmount <= 50000) return 2500; // ₦25
      return 5000; // ₦50
      
    case 'GHS':
      return recipientType === 'mobile_money' ? 100 : 800; // GH₵1 or GH₵8
      
    case 'ZAR':
      return 300; // R3
      
    case 'KES':
      if (displayAmount <= 1500) return 2000; // KSh20
      if (displayAmount <= 20000) return 4000; // KSh40
      return 6000; // KSh60
      
    default:
      return 0;
  }
}

/**
 * Validate transfer fee against expected ranges
 * 
 * Validates that the calculated fee is within expected ranges for the currency
 * and recipient type. Allows 10% tolerance for future fee changes.
 * 
 * @param feeSmallestUnit - Calculated fee in smallest unit
 * @param amountSmallestUnit - Transfer amount in smallest unit
 * @param currency - Currency code (NGN, GHS, ZAR, KES)
 * @param recipientType - Recipient type (bank or mobile_money)
 * @returns Validation result with expected range
 */
export function validateTransferFee(
  feeSmallestUnit: number,
  amountSmallestUnit: number,
  currency: string,
  recipientType?: 'bank' | 'mobile_money'
): { isValid: boolean; expectedRange?: { min: number; max: number }; error?: string } {
  const config = getPaystackCurrencyConfig(currency);
  const displayAmount = toDisplayAmount(amountSmallestUnit, currency);
  const feeDisplay = toDisplayAmount(feeSmallestUnit, currency);
  
  let expectedMin: number;
  let expectedMax: number;
  
  switch (currency.toUpperCase()) {
    case 'NGN':
      // ₦10-₦50 based on amount
      if (displayAmount <= 5000) {
        expectedMin = 1000; // ₦10
        expectedMax = 1000;
      } else if (displayAmount <= 50000) {
        expectedMin = 2500; // ₦25
        expectedMax = 2500;
      } else {
        expectedMin = 5000; // ₦50
        expectedMax = 5000;
      }
      break;
      
    case 'GHS':
      // GH₵1 for mobile money, GH₵8 for bank accounts
      expectedMin = recipientType === 'mobile_money' ? 100 : 800;
      expectedMax = recipientType === 'mobile_money' ? 100 : 800;
      break;
      
    case 'ZAR':
      // R3 flat
      expectedMin = 300; // R3
      expectedMax = 300;
      break;
      
    case 'KES':
      // KSh20-KSh60 based on amount
      if (displayAmount <= 1500) {
        expectedMin = 2000; // KSh20
        expectedMax = 2000;
      } else if (displayAmount <= 20000) {
        expectedMin = 4000; // KSh40
        expectedMax = 4000;
      } else {
        expectedMin = 6000; // KSh60
        expectedMax = 6000;
      }
      break;
      
    default:
      return {
        isValid: false,
        error: `Unsupported currency for fee validation: ${currency}`,
      };
  }
  
  // Allow 10% tolerance for fee changes
  const tolerance = expectedMax * 0.1;
  const minAllowed = Math.max(0, expectedMin - tolerance);
  const maxAllowed = expectedMax + tolerance;
  
  if (feeSmallestUnit < minAllowed || feeSmallestUnit > maxAllowed) {
    return {
      isValid: false,
      expectedRange: { min: expectedMin, max: expectedMax },
      error: `Fee ${feeDisplay} ${config.symbol} is outside expected range ${toDisplayAmount(expectedMin, currency)}-${toDisplayAmount(expectedMax, currency)} ${config.symbol}`,
    };
  }
  
  return {
    isValid: true,
    expectedRange: { min: expectedMin, max: expectedMax },
  };
}

/**
 * Calculate transaction fee (for deposits)
 * 
 * Nigeria:
 * - 1.5% + ₦100 (waived for < ₦2,500, capped at ₦2,000)
 * 
 * Ghana:
 * - 1.95% flat
 * 
 * South Africa:
 * - 2.9% + R1 (excluding VAT)
 * 
 * Kenya:
 * - M-Pesa: 1.5%
 * - Cards: 2.9% local, 3.8% international
 */
export function calculateTransactionFee(
  smallestUnit: number,
  currency: string,
  channel?: 'card' | 'mobile_money' | 'ussd' | 'bank_transfer'
): number {
  const config = getPaystackCurrencyConfig(currency);
  const displayAmount = toDisplayAmount(smallestUnit, currency);
  
  switch (currency.toUpperCase()) {
    case 'NGN': {
      const percentage = smallestUnit * 0.015; // 1.5%
      const flatFee = displayAmount >= 2500 ? 10000 : 0; // ₦100 in kobo
      const totalFee = percentage + flatFee;
      return Math.min(Math.round(totalFee), 200000); // Cap at ₦2,000
    }
      
    case 'GHS':
      return Math.round(smallestUnit * 0.0195); // 1.95%
      
    case 'ZAR': {
      const percentage = smallestUnit * 0.029; // 2.9%
      const flatFee = 100; // R1 in cents
      return Math.round(percentage + flatFee);
    }
      
    case 'KES':
      if (channel === 'mobile_money') {
        return Math.round(smallestUnit * 0.015); // 1.5%
      }
      return Math.round(smallestUnit * 0.029); // 2.9% for cards
      
    default:
      return 0;
  }
}

// ============================================================================
// QUICK AMOUNT SUGGESTIONS
// ============================================================================

/**
 * Get suggested deposit amounts for a currency
 */
export function getQuickDepositAmounts(currency: string): number[] {
  switch (currency.toUpperCase()) {
    case 'NGN':
      // ₦1,000, ₦2,500, ₦5,000, ₦10,000, ₦25,000, ₦50,000
      return [100000, 250000, 500000, 1000000, 2500000, 5000000];
      
    case 'GHS':
      // GH₵10, GH₵25, GH₵50, GH₵100, GH₵250, GH₵500
      return [1000, 2500, 5000, 10000, 25000, 50000];
      
    case 'ZAR':
      // R50, R100, R250, R500, R1,000, R2,500
      return [5000, 10000, 25000, 50000, 100000, 250000];
      
    case 'KES':
      // KSh100, KSh250, KSh500, KSh1,000, KSh2,500, KSh5,000
      return [10000, 25000, 50000, 100000, 250000, 500000];
      
    default:
      return [];
  }
}

/**
 * Get suggested withdrawal amounts for a currency
 */
export function getQuickWithdrawalAmounts(currency: string): number[] {
  // Same as deposit amounts for simplicity
  return getQuickDepositAmounts(currency);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type PaystackCurrencyConfig,
};

