/**
 * Stripe Type Definitions
 * 
 * Centralized TypeScript types for Stripe integration.
 * These types extend/wrap Stripe's types with our domain-specific needs.
 */

import type Stripe from 'stripe';

// ============================================================================
// USER & CUSTOMER TYPES
// ============================================================================

/**
 * Extended user payment data stored in Firebase
 */
export interface UserPaymentData {
  /** Stripe Customer ID */
  stripeCustomerId?: string;
  /** Stripe Connect account ID for payouts */
  stripeConnectAccountId?: string;
  /** Whether Connect onboarding is complete */
  stripeConnectOnboarded?: boolean;
  /** User's preferred payment method ID */
  defaultPaymentMethodId?: string;
}

/**
 * Customer creation request
 */
export interface CreateCustomerRequest {
  /** Firebase user ID */
  userId: string;
  /** User's email (optional for anonymous users) */
  email?: string;
  /** User's display name */
  name?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Customer with payment methods response
 */
export interface CustomerWithPaymentMethods {
  customer: Stripe.Customer;
  paymentMethods: Stripe.PaymentMethod[];
  defaultPaymentMethodId?: string;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Transaction types in the system
 */
export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'entry' 
  | 'winning' 
  | 'refund';

/**
 * Transaction status
 */
export type TransactionStatus = 
  | 'pending' 
  | 'processing'
  | 'completed' 
  | 'failed' 
  | 'cancelled';

/**
 * Transaction record stored in Firebase
 */
export interface Transaction {
  /** Unique transaction ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Type of transaction */
  type: TransactionType;
  /** Amount in cents (positive for credits, negative for debits) */
  amountCents: number;
  /** Current status */
  status: TransactionStatus;
  /** Stripe PaymentIntent ID (for deposits) */
  stripePaymentIntentId?: string;
  /** Stripe Payout ID (for withdrawals) */
  stripePayoutId?: string;
  /** Stripe Transfer ID (for Connect payouts) */
  stripeTransferId?: string;
  /** Payment method description (e.g., "Visa ****4242") */
  paymentMethod?: string;
  /** Human-readable description */
  description?: string;
  /** Reference to related entity (tournament ID, etc.) */
  referenceId?: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Transaction creation input
 */
export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amountCents: number;
  stripePaymentIntentId?: string;
  stripePayoutId?: string;
  stripeTransferId?: string;
  paymentMethod?: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PAYMENT INTENT TYPES
// ============================================================================

/**
 * Supported payment method types
 */
export type PaymentMethodType = 
  | 'card'
  | 'us_bank_account'
  | 'paypal'
  | 'link'
  | 'apple_pay'
  | 'google_pay';

/**
 * Payment intent creation request
 */
export interface CreatePaymentIntentRequest {
  /** Amount in cents */
  amountCents: number;
  /** Firebase user ID */
  userId: string;
  /** Stripe Customer ID (optional, will be created if missing) */
  customerId?: string;
  /** Payment method types to allow */
  paymentMethodTypes?: PaymentMethodType[];
  /** Whether to save the payment method for future use */
  savePaymentMethod?: boolean;
  /** Existing payment method ID to use */
  paymentMethodId?: string;
  /** Idempotency key */
  idempotencyKey?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Payment intent response
 */
export interface PaymentIntentResponse {
  /** Client secret for Stripe.js */
  clientSecret: string;
  /** PaymentIntent ID */
  paymentIntentId: string;
  /** Current status */
  status: Stripe.PaymentIntent.Status;
  /** Amount in cents */
  amountCents: number;
}

// ============================================================================
// SETUP INTENT TYPES
// ============================================================================

/**
 * Setup intent creation request (for saving cards without charging)
 */
export interface CreateSetupIntentRequest {
  /** Firebase user ID */
  userId: string;
  /** Stripe Customer ID */
  customerId: string;
  /** Payment method types to allow */
  paymentMethodTypes?: PaymentMethodType[];
  /** Idempotency key */
  idempotencyKey?: string;
}

/**
 * Setup intent response
 */
export interface SetupIntentResponse {
  /** Client secret for Stripe.js */
  clientSecret: string;
  /** SetupIntent ID */
  setupIntentId: string;
}

// ============================================================================
// CONNECT TYPES
// ============================================================================

/**
 * Connect account type
 */
export type ConnectAccountType = 'express' | 'standard' | 'custom';

/**
 * Connect account creation request
 */
export interface CreateConnectAccountRequest {
  /** Firebase user ID */
  userId: string;
  /** User's email */
  email: string;
  /** Account type */
  type?: ConnectAccountType;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Business type */
  businessType?: 'individual' | 'company';
}

/**
 * Connect account status
 */
export interface ConnectAccountStatus {
  /** Connect account ID */
  accountId: string;
  /** Whether charges are enabled */
  chargesEnabled: boolean;
  /** Whether payouts are enabled */
  payoutsEnabled: boolean;
  /** Whether onboarding is complete */
  detailsSubmitted: boolean;
  /** Requirements that need to be fulfilled */
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  /** Onboarding link (if needed) */
  onboardingUrl?: string;
}

/**
 * Payout creation request
 */
export interface CreatePayoutRequest {
  /** Firebase user ID */
  userId: string;
  /** Amount in cents */
  amountCents: number;
  /** Description */
  description?: string;
  /** Idempotency key */
  idempotencyKey?: string;
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Payout response
 */
export interface PayoutResponse {
  /** Payout/Transfer ID */
  payoutId: string;
  /** Amount in cents */
  amountCents: number;
  /** Current status */
  status: string;
  /** Estimated arrival date */
  arrivalDate?: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types we handle
 */
export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'setup_intent.succeeded'
  | 'setup_intent.setup_failed'
  | 'payout.paid'
  | 'payout.failed'
  | 'transfer.created'
  | 'transfer.failed'
  | 'account.updated'
  | 'charge.dispute.created'
  | 'charge.dispute.closed'
  | 'charge.refunded';

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  /** Whether the event was handled successfully */
  success: boolean;
  /** Event type that was processed */
  eventType: string;
  /** Event ID */
  eventId: string;
  /** Any error message */
  error?: string;
  /** Actions taken */
  actions?: string[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Stripe error codes we handle specially
 */
export type StripeErrorCode =
  | 'card_declined'
  | 'expired_card'
  | 'incorrect_cvc'
  | 'processing_error'
  | 'incorrect_number'
  | 'insufficient_funds'
  | 'invalid_expiry_month'
  | 'invalid_expiry_year'
  | 'rate_limit';

/**
 * User-friendly error messages
 */
export const STRIPE_ERROR_MESSAGES: Record<StripeErrorCode, string> = {
  card_declined: 'Your card was declined. Please try a different payment method.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'The security code is incorrect. Please check and try again.',
  processing_error: 'A processing error occurred. Please try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  insufficient_funds: 'Insufficient funds. Please try a different payment method.',
  invalid_expiry_month: 'The expiration month is invalid.',
  invalid_expiry_year: 'The expiration year is invalid.',
  rate_limit: 'Too many requests. Please wait a moment and try again.',
};

/**
 * Get user-friendly error message from Stripe error
 */
export function getStripeErrorMessage(code: string | undefined): string {
  if (code && code in STRIPE_ERROR_MESSAGES) {
    return STRIPE_ERROR_MESSAGES[code as StripeErrorCode];
  }
  return 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// RISK SCORING TYPES
// ============================================================================

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  /** Risk score (0-100) */
  score: number;
  /** Risk factors that contributed to the score */
  factors: string[];
  /** Recommended action */
  recommendation: 'approve' | 'review' | 'challenge' | 'manual_review' | 'decline';
}

/**
 * Risk context for scoring
 */
export interface RiskContext {
  /** User's country from request */
  country?: string;
  /** IP address */
  ipAddress?: string;
  /** Device ID */
  deviceId?: string;
  /** Whether VPN was detected */
  vpnDetected?: boolean;
  /** Whether this is a new device */
  newDevice?: boolean;
  /** Session ID */
  sessionId?: string;
}

