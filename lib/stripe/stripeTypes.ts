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
  /** Amount in smallest unit of currency (cents for USD, etc.) */
  amountCents: number;
  /** Current status */
  status: TransactionStatus;
  
  // Currency tracking
  /** ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP') */
  currency: string;
  /** Original amount in smallest unit of the original currency */
  originalAmountSmallestUnit?: number;
  /** USD equivalent in cents (for reporting/accounting) */
  usdEquivalentCents?: number;
  /** Exchange rate at time of transaction (if converted) */
  exchangeRate?: number;
  
  // Payment method tracking
  /** Type of payment method used */
  paymentMethodType?: PaymentMethodType;
  /** Voucher URL for async payments (OXXO, Boleto) */
  voucherUrl?: string;
  /** Expiration time for voucher-based payments */
  expiresAt?: string;
  
  /** Stripe PaymentIntent ID (for deposits) */
  stripePaymentIntentId?: string;
  /** Stripe Payout ID (for withdrawals) */
  stripePayoutId?: string;
  /** Stripe Transfer ID (for Connect payouts) */
  stripeTransferId?: string;
  /** Stripe Refund ID (for refund deduplication) */
  stripeRefundId?: string;
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
  /** ISO 4217 currency code (defaults to 'USD') */
  currency?: string;
  /** Original amount in smallest unit of original currency */
  originalAmountSmallestUnit?: number;
  /** USD equivalent in cents (for reporting) */
  usdEquivalentCents?: number;
  /** Exchange rate at time of transaction */
  exchangeRate?: number;
  /** Type of payment method used */
  paymentMethodType?: PaymentMethodType;
  /** Voucher URL for async payments */
  voucherUrl?: string;
  /** Expiration time for voucher-based payments */
  expiresAt?: string;
  stripePaymentIntentId?: string;
  stripePayoutId?: string;
  stripeTransferId?: string;
  stripeRefundId?: string;
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
 * 
 * Categories:
 * - Global: card, paypal, link, apple_pay, google_pay
 * - Bank Debit: us_bank_account, sepa_debit, acss_debit
 * - Europe: ideal, bancontact, sofort, eps, p24, blik
 * - Scandinavia/Switzerland: swish, mobilepay, twint
 * - Portugal: multibanco, mb_way
 * - Asia-Pacific: paynow, fpx, promptpay, grabpay
 * - Latin America: oxxo, boleto, pix
 * - US: cashapp
 */
export type PaymentMethodType = 
  // Global
  | 'card'
  | 'paypal'
  | 'link'
  | 'apple_pay'
  | 'google_pay'
  // Bank Debit
  | 'us_bank_account'
  | 'sepa_debit'
  | 'acss_debit'
  // Europe
  | 'ideal'
  | 'bancontact'
  | 'sofort'
  | 'eps'
  | 'p24'
  | 'blik'
  // Scandinavia/Switzerland
  | 'swish'
  | 'mobilepay'
  | 'twint'
  // Portugal
  | 'multibanco'
  | 'mb_way'
  // Asia-Pacific
  | 'paynow'
  | 'fpx'
  | 'promptpay'
  | 'grabpay'
  // Latin America
  | 'oxxo'
  | 'boleto'
  | 'pix'
  // US
  | 'cashapp';

/**
 * Payment intent creation request
 */
export interface CreatePaymentIntentRequest {
  /** Amount in smallest unit of currency (cents for USD, etc.) */
  amountCents: number;
  /** ISO 4217 currency code (defaults to 'usd') */
  currency?: string;
  /** Firebase user ID */
  userId: string;
  /** User's country code for payment method filtering */
  userCountry?: string;
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
  /** Amount in smallest unit of currency */
  amountCents: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Next action details for async payments (voucher URL, etc.) */
  nextAction?: {
    type: string;
    redirectUrl?: string;
    voucherUrl?: string;
    expiresAt?: string;
  };
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
  /** Amount in smallest unit of currency */
  amountCents: number;
  /** ISO 4217 currency code (defaults to 'usd') */
  currency?: string;
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
  /** Amount in smallest unit of currency */
  amountCents: number;
  /** ISO 4217 currency code */
  currency: string;
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
  // Payment Intent lifecycle
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'payment_intent.requires_action'   // Async payments (OXXO, Boleto)
  | 'payment_intent.processing'        // Payment being processed
  // Setup Intent
  | 'setup_intent.succeeded'
  | 'setup_intent.setup_failed'
  // Payouts/Transfers
  | 'payout.paid'
  | 'payout.failed'
  | 'transfer.created'
  | 'transfer.failed'
  // Connect accounts
  | 'account.updated'
  // Disputes and refunds
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
  /** Whether this is a new device */
  newDevice?: boolean;
  /** Session ID */
  sessionId?: string;
}

