/**
 * Currency Module
 *
 * Central export for all currency-related utilities.
 * Includes:
 *   - currencyMath: Decimal.js-based financial math (precision-safe arithmetic)
 *   - providerCurrencyConfig: Unified access to all provider currency configs
 *     (Stripe, Paystack, PayMongo, Xendit) with shared types
 *
 * @module lib/currency
 */

export * from './currencyMath';
export { default as currencyMath } from './currencyMath';
export * from './providerCurrencyConfig';
