/**
 * Provider Currency Configuration — Shared Interface & Utilities
 *
 * Defines the common contract that all payment provider currency configs
 * implement. Each provider (Stripe, Paystack, PayMongo, Xendit) has its own
 * currency-specific logic, but they all follow this interface for:
 *   - Amount formatting & parsing
 *   - Deposit/withdrawal validation
 *   - Quick-amount presets
 *
 * Provider-specific configs are re-exported from this module so consumers
 * can import everything from `lib/currency` instead of reaching into
 * individual provider directories.
 *
 * @module lib/currency/providerCurrencyConfig
 */

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Result of a currency amount validation operation.
 * Used consistently across all providers.
 */
export interface CurrencyValidationResult {
  isValid: boolean;
  error?: string;
  formattedMin?: string;
  formattedMax?: string;
}

/**
 * Base currency configuration that every provider must supply.
 */
export interface BaseCurrencyConfig {
  /** ISO 4217 currency code (e.g. "USD", "NGN", "PHP", "IDR") */
  code: string;
  /** Display symbol (e.g. "$", "₦", "₱", "Rp") */
  symbol: string;
  /** Human-readable name */
  name: string;
  /** Number of decimal places (0 for IDR/JPY, 2 for most, 3 for BHD) */
  decimals: number;
}

/**
 * Provider-specific currency configuration with deposit/withdrawal limits.
 */
export interface ProviderCurrencyLimits {
  /** Minimum deposit in smallest unit */
  minimumDepositSmallestUnit: number;
  /** Maximum deposit in smallest unit */
  maximumDepositSmallestUnit: number;
  /** Minimum withdrawal in smallest unit */
  minimumWithdrawalSmallestUnit: number;
}

/**
 * Supported payment provider identifiers.
 */
export type PaymentProviderName = 'stripe' | 'paystack' | 'paymongo' | 'xendit' | 'paypal';

// ============================================================================
// RE-EXPORTS — Provider-specific configs
// ============================================================================

// Stripe (master currency database — 60+ currencies)
export {
  getCurrencyConfig,
  getCurrencyForCountry,
  getDecimalMultiplier,
  toSmallestUnit,
  toDisplayAmount,
  validateAmount,
  getCurrencyOptions,
  ZERO_DECIMAL_CURRENCIES,
  THREE_DECIMAL_CURRENCIES,
  COUNTRY_TO_CURRENCY,
  type CurrencyConfig,
} from '../stripe/currencyConfig';

// Paystack (NGN, GHS, ZAR, KES)
export {
  PAYSTACK_CURRENCIES,
  getPaystackCurrencyConfig,
  getCurrencyForPaystackCountry,
  isPaystackCurrency,
  toSmallestUnit as paystackToSmallestUnit,
  toDisplayAmount as paystackToDisplayAmount,
  formatPaystackAmount,
  formatSmallestUnit as formatPaystackSmallestUnit,
  calculateTransferFee,
  calculateTransactionFee,
  getQuickDepositAmounts as getPaystackQuickDepositAmounts,
  getQuickWithdrawalAmounts as getPaystackQuickWithdrawalAmounts,
  type PaystackCurrencyConfig,
} from '../paystack/currencyConfig';

// PayMongo (PHP)
export {
  PHP_CONFIG,
  PAYMONGO_CURRENCY_CONFIG,
  toSmallestUnit as paymongoToSmallestUnit,
  toDisplayAmount as paymongoToDisplayAmount,
  formatPhpAmount,
  parsePhpInput,
  validateDepositAmount as validatePaymongoDeposit,
  validateWithdrawalAmount as validatePaymongoWithdrawal,
  getQuickDepositAmounts as getPaymongoQuickDepositAmounts,
} from '../paymongo/currencyConfig';

// Xendit (IDR)
export {
  IDR_CONFIG,
  XENDIT_CURRENCY_CONFIG,
  formatIdrAmount,
  parseIdrInput,
  validateDepositAmount as validateXenditDeposit,
  validateWithdrawalAmount as validateXenditWithdrawal,
  getQuickDepositAmounts as getXenditQuickDepositAmounts,
} from '../xendit/currencyConfig';

// ============================================================================
// PROVIDER LOOKUP
// ============================================================================

/**
 * Get the primary currency config for a payment provider.
 * Useful when you need the default currency for a provider's region.
 */
export function getPrimaryCurrencyForProvider(provider: PaymentProviderName): string {
  switch (provider) {
    case 'paystack':
      return 'NGN'; // Default to Nigeria (largest market)
    case 'paymongo':
      return 'PHP';
    case 'xendit':
      return 'IDR';
    case 'stripe':
    case 'paypal':
    default:
      return 'USD';
  }
}
