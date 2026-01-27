/**
 * PayPal Type Definitions
 *
 * Centralized TypeScript types for PayPal integration.
 * These types mirror the Stripe integration patterns but are PayPal-specific.
 */

// ============================================================================
// DEPOSIT & WITHDRAWAL LIMITS
// ============================================================================

/**
 * PayPal deposit limits
 * - Minimum: $25 (cost of one draft entry)
 * - Maximum: $3,750 (150 drafts × $25)
 */
export const PAYPAL_DEPOSIT_LIMITS = {
  minAmountCents: 2500,  // $25.00
  maxAmountCents: 375000, // $3,750.00
  currency: 'USD',
} as const;

/**
 * PayPal withdrawal limits and security tiers
 * - No minimum or maximum withdrawal amount
 * - Maximum 3 withdrawals per 24-hour period
 * - Security tiers for larger amounts
 */
export const PAYPAL_WITHDRAWAL_LIMITS = {
  minAmountCents: 0, // No minimum
  maxAmountCents: null, // No maximum
  maxPerDay: 3,
  securityTiers: {
    confirmationRequired: 100000, // $1,000+ requires email/SMS confirmation
    holdRequired: 1000000, // $10,000+ requires 24-hour hold
    supportRequired: 5000000, // $50,000+ requires support outreach
  },
} as const;

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * PayPal order status
 */
export type PayPalOrderStatus =
  | 'CREATED'
  | 'SAVED'
  | 'APPROVED'
  | 'VOIDED'
  | 'COMPLETED'
  | 'PAYER_ACTION_REQUIRED';

/**
 * Create PayPal order request
 */
export interface CreatePayPalOrderRequest {
  /** Amount in cents */
  amountCents: number;
  /** Currency code (USD only for PayPal) */
  currency: 'USD';
  /** Firebase user ID */
  userId: string;
  /** Idempotency key */
  idempotencyKey?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * PayPal order response
 */
export interface PayPalOrderResponse {
  /** PayPal order ID */
  orderId: string;
  /** Current status */
  status: PayPalOrderStatus;
  /** URL for user to approve the order */
  approvalUrl: string;
  /** Client token for advanced integration */
  clientToken?: string;
}

/**
 * PayPal order capture result
 */
export interface PayPalCaptureResult {
  /** Whether capture was successful */
  success: boolean;
  /** Capture ID */
  captureId?: string;
  /** Amount captured in cents */
  amountCents?: number;
  /** Currency */
  currency?: string;
  /** Order ID */
  orderId?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Full PayPal order details
 */
export interface PayPalOrder {
  /** Order ID */
  id: string;
  /** Order status */
  status: PayPalOrderStatus;
  /** Create time */
  createTime: string;
  /** Update time */
  updateTime: string;
  /** Amount in cents */
  amountCents: number;
  /** Currency code */
  currency: string;
  /** Payer information */
  payer?: {
    payerId: string;
    email: string;
    name?: {
      givenName: string;
      surname: string;
    };
  };
  /** Purchase units */
  purchaseUnits?: Array<{
    referenceId: string;
    amount: {
      currencyCode: string;
      value: string;
    };
  }>;
}

// ============================================================================
// PAYOUT/WITHDRAWAL TYPES
// ============================================================================

/**
 * Security tier for withdrawals
 */
export type WithdrawalSecurityTier =
  | 'standard'           // Under $1,000 - process immediately
  | 'confirmation_required' // $1,000 - $9,999 - require email/SMS
  | 'hold_required'      // $10,000 - $49,999 - 24-hour hold
  | 'support_required';  // $50,000+ - support outreach

/**
 * Withdrawal request
 */
export interface WithdrawalRequest {
  /** Firebase user ID */
  userId: string;
  /** Amount in cents */
  amountCents: number;
  /** Linked PayPal account ID */
  linkedAccountId: string;
  /** Confirmation method (required for $1,000+) */
  confirmationMethod?: 'email' | 'sms';
}

/**
 * Withdrawal response
 */
export interface WithdrawalResponse {
  /** Whether withdrawal was initiated */
  success: boolean;
  /** Withdrawal ID */
  withdrawalId?: string;
  /** Security tier applied */
  securityTier?: WithdrawalSecurityTier;
  /** Status */
  status?: WithdrawalStatus;
  /** For confirmation required: pending ID */
  pendingId?: string;
  /** For held withdrawals: release date */
  releaseAt?: string;
  /** Message to display */
  message?: string;
  /** Warning about daily limit */
  warning?: string | null;
  /** Error message */
  error?: string;
}

/**
 * Withdrawal status
 */
export type WithdrawalStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'held'
  | 'pending_support_review'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

/**
 * Pending withdrawal (for confirmation flow)
 */
export interface PendingWithdrawal {
  /** Pending withdrawal ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Amount in cents */
  amountCents: number;
  /** Linked PayPal account ID */
  linkedAccountId: string;
  /** Confirmation code (hashed) */
  confirmationCodeHash: string;
  /** Confirmation method */
  confirmationMethod: 'email' | 'sms';
  /** Expiration time */
  expiresAt: string;
  /** Status */
  status: WithdrawalStatus;
  /** Created timestamp */
  createdAt: string;
}

/**
 * Held withdrawal (for $10K+ flow)
 */
export interface HeldWithdrawal {
  /** Held withdrawal ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Amount in cents */
  amountCents: number;
  /** Linked PayPal account ID */
  linkedAccountId: string;
  /** Status */
  status: WithdrawalStatus;
  /** Release date/time */
  releaseAt: string;
  /** Created timestamp */
  createdAt: string;
  /** PayPal payout batch ID (after processing) */
  payoutBatchId?: string;
}

/**
 * Support review withdrawal (for $50K+ flow)
 */
export interface SupportReviewWithdrawal {
  /** Support review withdrawal ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Amount in cents */
  amountCents: number;
  /** Linked PayPal account ID */
  linkedAccountId: string;
  /** Status */
  status: WithdrawalStatus;
  /** Created timestamp */
  createdAt: string;
  /** Support ticket ID */
  supportTicketId?: string;
  /** Reviewed by (support user ID) */
  reviewedBy?: string;
  /** Reviewed at timestamp */
  reviewedAt?: string;
  /** Review notes */
  reviewNotes?: string;
}

/**
 * PayPal payout request (for actual PayPal API)
 */
export interface PayPalPayoutRequest {
  /** Firebase user ID */
  userId: string;
  /** PayPal email to send to */
  paypalEmail: string;
  /** Amount in cents */
  amountCents: number;
  /** Currency code */
  currency: 'USD';
  /** Note to recipient */
  note?: string;
  /** Idempotency key */
  idempotencyKey?: string;
}

/**
 * PayPal payout response
 */
export interface PayPalPayoutResponse {
  /** Whether payout was initiated */
  success: boolean;
  /** Payout batch ID */
  payoutBatchId?: string;
  /** Payout item ID */
  payoutItemId?: string;
  /** Status */
  status?: string;
  /** Error message */
  error?: string;
}

// ============================================================================
// OAUTH & LINKED ACCOUNTS
// ============================================================================

/**
 * Linked PayPal account (via OAuth)
 * Users must link via OAuth - no manual email entry allowed
 */
export interface LinkedPayPalAccount {
  /** Internal account link ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** PayPal account ID (payer_id from OAuth) */
  paypalAccountId: string;
  /** PayPal email address */
  paypalEmail: string;
  /** When the account was linked */
  linkedAt: string;
  /** Whether the account is verified */
  verified: boolean;
  /** Whether this is the primary withdrawal account */
  isPrimary: boolean;
  /** Last used for withdrawal */
  lastUsedAt?: string;
}

/**
 * OAuth state for CSRF protection
 */
export interface PayPalOAuthState {
  /** Firebase user ID */
  userId: string;
  /** Random state value */
  state: string;
  /** Expiration time */
  expiresAt: string;
  /** Redirect URI after completion */
  redirectUri: string;
}

/**
 * PayPal user info from OAuth
 */
export interface PayPalUserInfo {
  /** PayPal user ID (payer_id) */
  user_id: string;
  /** Payer ID */
  payer_id: string;
  /** Email address */
  email: string;
  /** Whether email is verified */
  email_verified?: boolean;
  /** Full name */
  name?: string;
  /** Given name */
  given_name?: string;
  /** Family name */
  family_name?: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * PayPal webhook event types we handle
 */
export type PayPalWebhookEventType =
  // Order lifecycle
  | 'CHECKOUT.ORDER.APPROVED'
  | 'CHECKOUT.ORDER.COMPLETED'
  | 'CHECKOUT.ORDER.VOIDED'
  // Payment capture
  | 'PAYMENT.CAPTURE.COMPLETED'
  | 'PAYMENT.CAPTURE.DENIED'
  | 'PAYMENT.CAPTURE.PENDING'
  | 'PAYMENT.CAPTURE.REFUNDED'
  | 'PAYMENT.CAPTURE.REVERSED'
  // Payouts
  | 'PAYMENT.PAYOUTSBATCH.SUCCESS'
  | 'PAYMENT.PAYOUTSBATCH.DENIED'
  | 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED'
  | 'PAYMENT.PAYOUTS-ITEM.FAILED'
  | 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED';

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

/**
 * PayPal webhook event structure
 */
export interface PayPalWebhookEvent {
  /** Event ID */
  id: string;
  /** Event type */
  event_type: PayPalWebhookEventType;
  /** Resource type */
  resource_type: string;
  /** Resource data */
  resource: Record<string, unknown>;
  /** Event creation time */
  create_time: string;
  /** Summary */
  summary?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * PayPal error codes and user-friendly messages
 */
export const PAYPAL_ERROR_MESSAGES: Record<string, string> = {
  'INSTRUMENT_DECLINED': 'Your payment method was declined. Please try another.',
  'PAYER_CANNOT_PAY': 'Unable to process payment with this PayPal account.',
  'INSUFFICIENT_FUNDS': 'Insufficient funds in your PayPal account.',
  'TRANSACTION_REFUSED': 'Transaction was refused. Please contact PayPal.',
  'PAYEE_ACCOUNT_RESTRICTED': 'Merchant account is restricted. Please try again later.',
  'PAYER_ACCOUNT_RESTRICTED': 'Your PayPal account is restricted. Please contact PayPal.',
  'PAYER_ACCOUNT_LOCKED_OR_CLOSED': 'Your PayPal account is locked or closed.',
  'CARD_EXPIRED': 'The card linked to your PayPal account has expired.',
  'ORDER_NOT_APPROVED': 'Order was not approved. Please try again.',
  'ORDER_ALREADY_CAPTURED': 'This order has already been processed.',
  'ORDER_CANNOT_BE_CAPTURED': 'This order cannot be captured at this time.',
  'INVALID_RESOURCE_ID': 'Invalid order reference. Please start a new transaction.',
  'PERMISSION_DENIED': 'Permission denied for this operation.',
  'RATE_LIMIT_REACHED': 'Too many requests. Please wait and try again.',
};

/**
 * Get user-friendly error message from PayPal error
 */
export function getPayPalErrorMessage(code: string | undefined): string {
  if (code && code in PAYPAL_ERROR_MESSAGES) {
    return PAYPAL_ERROR_MESSAGES[code];
  }
  return 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// TRANSACTION TYPES (for Firebase storage)
// ============================================================================

/**
 * PayPal transaction record
 */
export interface PayPalTransaction {
  /** Transaction ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Transaction type */
  type: 'deposit' | 'withdrawal';
  /** Amount in cents */
  amountCents: number;
  /** Currency */
  currency: 'USD';
  /** Transaction status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  /** PayPal order ID (for deposits) */
  paypalOrderId?: string;
  /** PayPal capture ID (for deposits) */
  paypalCaptureId?: string;
  /** PayPal payout batch ID (for withdrawals) */
  paypalPayoutBatchId?: string;
  /** PayPal payout item ID (for withdrawals) */
  paypalPayoutItemId?: string;
  /** Linked PayPal account ID (for withdrawals) */
  linkedAccountId?: string;
  /** Description */
  description?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// RISK & COMPLIANCE
// ============================================================================

/**
 * PayPal risk assessment context
 */
export interface PayPalRiskContext {
  /** User's country */
  country?: string;
  /** IP address */
  ipAddress?: string;
  /** Device ID */
  deviceId?: string;
  /** Whether this is a new device */
  newDevice?: boolean;
  /** Number of transactions in last 24 hours */
  recentTransactionCount?: number;
  /** Total amount in last 24 hours */
  recentTransactionTotal?: number;
}

/**
 * Risk assessment result
 */
export interface PayPalRiskAssessment {
  /** Risk score (0-100) */
  score: number;
  /** Risk factors */
  factors: string[];
  /** Recommended action */
  recommendation: 'approve' | 'review' | 'decline';
}
