/**
 * Currency Math Utilities
 *
 * Provides precise decimal arithmetic for financial calculations using Decimal.js.
 * Avoids floating-point precision errors that can lead to incorrect balances.
 *
 * SECURITY: All financial calculations should use these utilities to prevent
 * rounding errors that could lead to balance discrepancies or fraud.
 *
 * @module lib/currency/currencyMath
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20, // Maximum significant digits
  rounding: Decimal.ROUND_HALF_UP, // Standard financial rounding
  toExpNeg: -7, // Minimum exponent for exponential notation
  toExpPos: 21, // Maximum exponent for exponential notation
});

// ============================================================================
// TYPES
// ============================================================================

/**
 * Currency amount with cents and display values
 */
export interface CurrencyAmount {
  /** Amount in smallest unit (e.g., cents for USD) */
  cents: number;
  /** Amount in display format (e.g., dollars for USD) */
  dollars: number;
  /** Original Decimal value for further calculations */
  decimal: Decimal;
}

/**
 * Currency operation result
 */
export interface OperationResult extends CurrencyAmount {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert cents to dollars with precise decimal handling
 */
export function centsToDollars(cents: number): number {
  const decimal = new Decimal(cents).dividedBy(100);
  return decimal.toNumber();
}

/**
 * Convert dollars to cents with precise decimal handling
 * Rounds to nearest cent to avoid floating point issues
 */
export function dollarsToCents(dollars: number): number {
  const decimal = new Decimal(dollars).times(100);
  return decimal.round().toNumber();
}

/**
 * Create a CurrencyAmount from cents
 */
export function fromCents(cents: number): CurrencyAmount {
  const decimal = new Decimal(cents);
  return {
    cents: decimal.round().toNumber(),
    dollars: decimal.dividedBy(100).toNumber(),
    decimal: decimal.dividedBy(100),
  };
}

/**
 * Create a CurrencyAmount from dollars
 */
export function fromDollars(dollars: number): CurrencyAmount {
  const decimal = new Decimal(dollars);
  return {
    cents: decimal.times(100).round().toNumber(),
    dollars: decimal.toNumber(),
    decimal,
  };
}

// ============================================================================
// ARITHMETIC OPERATIONS
// ============================================================================

/**
 * Add two amounts (in dollars)
 */
export function add(a: number, b: number): CurrencyAmount {
  const result = new Decimal(a).plus(b);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Subtract b from a (in dollars)
 */
export function subtract(a: number, b: number): CurrencyAmount {
  const result = new Decimal(a).minus(b);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Multiply amount by a factor (in dollars)
 */
export function multiply(amount: number, factor: number): CurrencyAmount {
  const result = new Decimal(amount).times(factor);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Divide amount by a divisor (in dollars)
 */
export function divide(amount: number, divisor: number): CurrencyAmount {
  if (divisor === 0) {
    throw new Error('Division by zero');
  }
  const result = new Decimal(amount).dividedBy(divisor);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Add multiple amounts (in dollars)
 */
export function sum(...amounts: number[]): CurrencyAmount {
  const result = amounts.reduce(
    (acc, amt) => acc.plus(amt),
    new Decimal(0)
  );
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

// ============================================================================
// BALANCE OPERATIONS
// ============================================================================

/**
 * Calculate balance after deposit (in dollars)
 * Returns operation result with success/failure status
 */
export function addToBalance(
  currentBalance: number,
  depositAmount: number
): OperationResult {
  if (depositAmount < 0) {
    return {
      success: false,
      error: 'Deposit amount cannot be negative',
      cents: 0,
      dollars: 0,
      decimal: new Decimal(0),
    };
  }

  const result = new Decimal(currentBalance).plus(depositAmount);
  return {
    success: true,
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Calculate balance after withdrawal (in dollars)
 * Returns operation result with success/failure status
 */
export function subtractFromBalance(
  currentBalance: number,
  withdrawalAmount: number
): OperationResult {
  if (withdrawalAmount < 0) {
    return {
      success: false,
      error: 'Withdrawal amount cannot be negative',
      cents: 0,
      dollars: 0,
      decimal: new Decimal(0),
    };
  }

  const balanceDecimal = new Decimal(currentBalance);
  const withdrawalDecimal = new Decimal(withdrawalAmount);

  if (withdrawalDecimal.greaterThan(balanceDecimal)) {
    return {
      success: false,
      error: `Insufficient balance. Current: ${currentBalance.toFixed(2)}, Requested: ${withdrawalAmount.toFixed(2)}`,
      cents: 0,
      dollars: 0,
      decimal: new Decimal(0),
    };
  }

  const result = balanceDecimal.minus(withdrawalDecimal);
  return {
    success: true,
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Check if withdrawal is allowed
 */
export function canWithdraw(balance: number, amount: number): boolean {
  const balanceDecimal = new Decimal(balance);
  const amountDecimal = new Decimal(amount);
  return amountDecimal.lessThanOrEqualTo(balanceDecimal) && amount > 0;
}

// ============================================================================
// COMPARISON OPERATIONS
// ============================================================================

/**
 * Check if two amounts are equal (with precision handling)
 */
export function equals(a: number, b: number): boolean {
  return new Decimal(a).equals(b);
}

/**
 * Check if a is greater than b
 */
export function greaterThan(a: number, b: number): boolean {
  return new Decimal(a).greaterThan(b);
}

/**
 * Check if a is less than b
 */
export function lessThan(a: number, b: number): boolean {
  return new Decimal(a).lessThan(b);
}

/**
 * Check if a is greater than or equal to b
 */
export function greaterThanOrEqual(a: number, b: number): boolean {
  return new Decimal(a).greaterThanOrEqualTo(b);
}

/**
 * Check if a is less than or equal to b
 */
export function lessThanOrEqual(a: number, b: number): boolean {
  return new Decimal(a).lessThanOrEqualTo(b);
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format amount as currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cents as currency string
 */
export function formatCentsAsCurrency(
  cents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const dollars = centsToDollars(cents);
  return formatCurrency(dollars, currency, locale);
}

/**
 * Round to specified decimal places
 */
export function roundTo(amount: number, decimalPlaces: number = 2): number {
  return new Decimal(amount)
    .toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
    .toNumber();
}

// ============================================================================
// PERCENTAGE OPERATIONS
// ============================================================================

/**
 * Calculate percentage of an amount
 */
export function percentage(amount: number, percent: number): CurrencyAmount {
  const result = new Decimal(amount).times(percent).dividedBy(100);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Apply percentage discount to amount
 */
export function applyDiscount(
  amount: number,
  discountPercent: number
): CurrencyAmount {
  const discount = new Decimal(amount).times(discountPercent).dividedBy(100);
  const result = new Decimal(amount).minus(discount);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Calculate fee amount and remaining after fee
 */
export function calculateFee(
  amount: number,
  feePercent: number,
  minimumFee: number = 0
): {
  fee: CurrencyAmount;
  netAmount: CurrencyAmount;
} {
  let feeDecimal = new Decimal(amount).times(feePercent).dividedBy(100);

  // Apply minimum fee if calculated fee is less
  if (minimumFee > 0 && feeDecimal.lessThan(minimumFee)) {
    feeDecimal = new Decimal(minimumFee);
  }

  const netDecimal = new Decimal(amount).minus(feeDecimal);

  return {
    fee: {
      cents: feeDecimal.times(100).round().toNumber(),
      dollars: feeDecimal.toNumber(),
      decimal: feeDecimal,
    },
    netAmount: {
      cents: netDecimal.times(100).round().toNumber(),
      dollars: netDecimal.toNumber(),
      decimal: netDecimal,
    },
  };
}

// ============================================================================
// EXCHANGE RATE OPERATIONS
// ============================================================================

/**
 * Convert amount using exchange rate
 * @param amount - Amount in source currency
 * @param rate - Exchange rate (source to target)
 * @returns Amount in target currency
 */
export function convertCurrency(
  amount: number,
  rate: number
): CurrencyAmount {
  const result = new Decimal(amount).times(rate);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Convert amount from foreign currency to USD
 * @param amount - Amount in foreign currency
 * @param rateToUSD - Exchange rate (foreign currency per 1 USD)
 * @returns Amount in USD
 */
export function toUSD(amount: number, rateToUSD: number): CurrencyAmount {
  // If rate is "X foreign = 1 USD", then USD = foreign / rate
  const result = new Decimal(amount).dividedBy(rateToUSD);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

/**
 * Convert amount from USD to foreign currency
 * @param usdAmount - Amount in USD
 * @param rateFromUSD - Exchange rate (foreign currency per 1 USD)
 * @returns Amount in foreign currency
 */
export function fromUSD(
  usdAmount: number,
  rateFromUSD: number
): CurrencyAmount {
  // If rate is "X foreign = 1 USD", then foreign = USD * rate
  const result = new Decimal(usdAmount).times(rateFromUSD);
  return {
    cents: result.times(100).round().toNumber(),
    dollars: result.toNumber(),
    decimal: result,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Conversion
  centsToDollars,
  dollarsToCents,
  fromCents,
  fromDollars,

  // Arithmetic
  add,
  subtract,
  multiply,
  divide,
  sum,

  // Balance operations
  addToBalance,
  subtractFromBalance,
  canWithdraw,

  // Comparison
  equals,
  greaterThan,
  lessThan,
  greaterThanOrEqual,
  lessThanOrEqual,

  // Formatting
  formatCurrency,
  formatCentsAsCurrency,
  roundTo,

  // Percentage
  percentage,
  applyDiscount,
  calculateFee,

  // Exchange
  convertCurrency,
  toUSD,
  fromUSD,
};
