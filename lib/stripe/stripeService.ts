/**
 * Stripe Service Facade
 *
 * This is a facade that re-exports all functions from the decomposed stripe services.
 * This maintains backward compatibility - all existing imports continue to work.
 *
 * The actual implementation has been split into focused service modules:
 * - stripeCustomerService: Customer management operations
 * - stripePaymentService: Payment intents and setup intents
 * - stripeConnectService: Stripe Connect accounts and payouts
 * - stripeTransactionService: Transaction records and webhook tracking
 * - stripeBalanceService: User balance operations and risk assessment
 */

// Re-export from stripeCustomerService
export {
  getOrCreateCustomer,
  getCustomerWithPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod,
} from './stripeCustomerService';

// Re-export from stripePaymentService
export {
  createPaymentIntent,
  createSetupIntent,
} from './stripePaymentService';

// Re-export from stripeConnectService
export {
  getOrCreateConnectAccount,
  getConnectAccountStatus,
  createPayout,
} from './stripeConnectService';

// Re-export from stripeTransactionService
export {
  createTransaction,
  updateTransactionStatus,
  findTransactionByPaymentIntent,
  findTransactionByTransfer,
  findEventByStripeId,
  markEventAsProcessed,
  markEventAsFailed,
  createOrUpdateWebhookEvent,
  type StripeWebhookEvent,
} from './stripeTransactionService';

// Re-export from stripeBalanceService
export {
  updateUserBalance,
  getUserBalance,
  assessPaymentRisk,
  type BalanceUpdateResult,
} from './stripeBalanceService';

// Re-export the Stripe instance for internal use
export { getStripeInstance } from './stripeInstance';
