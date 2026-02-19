/**
 * Unified Payment System
 * 
 * Provider-agnostic payment abstraction layer.
 * Routes payments to Stripe, Paystack, PayMongo, or Xendit based on user country.
 * 
 * Usage:
 * ```typescript
 * import { createPayment, getAvailablePaymentMethods, usesPaystack } from '@/lib/payments';
 * 
 * // Check which provider to use
 * if (usesPaystack(userCountry)) {
 *   // Show Paystack-specific UI
 * } else if (usesPayMongo(userCountry)) {
 *   // Show PayMongo-specific UI (Philippines)
 * } else if (usesXendit(userCountry)) {
 *   // Show Xendit-specific UI (Indonesia)
 * }
 * 
 * // Get available payment methods
 * const methods = getAvailablePaymentMethods(userCountry);
 * 
 * // Create payment through appropriate provider
 * const result = await createPayment({
 *   amountSmallestUnit: 10000,
 *   currency: 'NGN',
 *   userId: user.id,
 *   country: 'NG',
 * });
 * ```
 * 
 * @module lib/payments
 */

// Import and register providers
import { paymongoProvider } from './providers/paymongo';
import { paystackProvider } from './providers/paystack';
import { stripeProvider } from './providers/stripe';
import { xenditProvider } from './providers/xendit';
import { registerProvider } from './router';

// Register providers at module load time
registerProvider(stripeProvider);
registerProvider(paystackProvider);
registerProvider(paymongoProvider);
registerProvider(xenditProvider);

// Export types
export * from './types';

// Export router functions
export {
  getProviderForUser,
  getAvailablePaymentMethods,
  getDefaultCurrency,
  usesPaystack,
  usesPayMongo,
  usesXendit,
  getPaystackCountries,
  getPayMongoCountries,
  getXenditCountries,
  createPayment,
  verifyPayment,
  createTransfer,
  getProvider,
  isProviderRegistered,
  isPaystackCountry,
  isPayMongoCountry,
  isXenditCountry,
  getProviderForCountry,
  getCurrencyForCountry,
} from './router';

// Export individual providers for direct access if needed
export { stripeProvider } from './providers/stripe';
export { paystackProvider } from './providers/paystack';
export { paymongoProvider } from './providers/paymongo';
export { xenditProvider } from './providers/xendit';

