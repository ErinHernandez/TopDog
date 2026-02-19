/**
 * Stripe Integration Barrel Export
 * 
 * Centralized exports for the Stripe integration layer.
 * 
 * @example
 * ```ts
 * import { 
 *   getOrCreateCustomer, 
 *   createPaymentIntent,
 *   type PaymentIntentResponse 
 * } from '@/lib/stripe';
 * ```
 */

// Service functions
export {
  // Customer operations
  getOrCreateCustomer,
  getCustomerWithPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod,

  // Payment Intent operations
  createPaymentIntent,

  // Setup Intent operations
  createSetupIntent,

  // Connect operations
  getOrCreateConnectAccount,
  getConnectAccountStatus,
  createPayout,

  // Transaction operations
  createTransaction,
  updateTransactionStatus,
  findTransactionByPaymentIntent,
  findTransactionByTransfer,

  // Webhook event tracking
  findEventByStripeId,
  markEventAsProcessed,
  markEventAsFailed,
  createOrUpdateWebhookEvent,

  // Balance operations
  updateUserBalance,
  getUserBalance,

  // Risk scoring
  assessPaymentRisk,
} from './stripeService';

// Service types
export type { StripeWebhookEvent } from './stripeService';
export type { BalanceUpdateResult } from './stripeService';

// Types
export type {
  // User & Customer types
  UserPaymentData,
  CreateCustomerRequest,
  CustomerWithPaymentMethods,
  
  // Transaction types
  TransactionType,
  TransactionStatus,
  Transaction,
  CreateTransactionInput,
  
  // Payment Intent types
  PaymentMethodType,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  
  // Setup Intent types
  CreateSetupIntentRequest,
  SetupIntentResponse,
  
  // Connect types
  ConnectAccountType,
  CreateConnectAccountRequest,
  ConnectAccountStatus,
  CreatePayoutRequest,
  PayoutResponse,
  
  // Webhook types
  WebhookEventType,
  WebhookProcessingResult,
  
  // Error types
  StripeErrorCode,
  
  // Risk types
  RiskAssessment,
  RiskContext,
} from './stripeTypes';

// Error message helper
export { 
  STRIPE_ERROR_MESSAGES, 
  getStripeErrorMessage 
} from './stripeTypes';

// Firebase schema utilities
export {
  initializeUserPaymentData,
  getUserPaymentData,
  createAuditLog,
  logPaymentEvent,
} from './firebaseSchema';

export type {
  UserDocument,
  TransactionDocument,
  AuditLogDocument,
  AuditSeverity,
  AuditAction,
} from './firebaseSchema';

// Currency configuration
export {
  CURRENCY_CONFIG,
  COUNTRY_TO_CURRENCY,
  ZERO_DECIMAL_CURRENCIES,
  THREE_DECIMAL_CURRENCIES,
  SELECTABLE_CURRENCIES,
  NON_US_SELECTABLE_CURRENCIES,
  isZeroDecimalCurrency,
  isThreeDecimalCurrency,
  getDecimalMultiplier,
  getCurrencyConfig,
  getCurrencyForCountry,
  toSmallestUnit,
  toDisplayAmount,
  validateAmount,
  getCurrencyOptions,
} from './currencyConfig';

export type {
  CurrencyConfig,
} from './currencyConfig';

// Display currency resolution
export {
  getDisplayCurrency,
  resolveDisplayCurrency,
  setDisplayCurrencyPreference,
  resetDisplayCurrencyPreference,
  updateLastDepositCurrency,
  canChangeCurrency,
  getSourceLabel,
  getCurrencyDisplayData,
} from './displayCurrency';

export type {
  DisplayCurrencySource,
  DisplayCurrencyResult,
  UserCurrencyData,
} from './displayCurrency';

// Exchange rate service
export {
  getStripeExchangeRate,
  getCachedRate,
  convertFromUSD,
  convertToUSD,
  roundForDisplay,
  getUSD25Increments,
  isValid25Increment,
  getNearestIncrements,
} from './exchangeRates';

export type {
  StripeExchangeRate,
} from './exchangeRates';

