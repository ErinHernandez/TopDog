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
  
  // Balance operations
  updateUserBalance,
  
  // Risk scoring
  assessPaymentRisk,
} from './stripeService';

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

