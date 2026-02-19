/**
 * PayMongo TypeScript Definitions
 * 
 * Type definitions for PayMongo API interactions.
 * Based on PayMongo API v1.
 * 
 * @module lib/paymongo/paymongoTypes
 */

// ============================================================================
// SOURCE TYPES
// ============================================================================

/**
 * PayMongo source types
 */
export type PayMongoSourceType = 
  | 'gcash'
  | 'grab_pay'
  | 'paymaya';

/**
 * PayMongo source status
 */
export type PayMongoSourceStatus = 
  | 'pending'
  | 'chargeable'
  | 'cancelled'
  | 'expired'
  | 'paid'
  | 'failed';

/**
 * Source redirect URLs
 */
export interface PayMongoRedirect {
  checkout_url?: string;
  success: string;
  failed: string;
}

/**
 * Source billing information
 */
export interface PayMongoBilling {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

/**
 * Source attributes
 */
export interface PayMongoSourceAttributes {
  type: PayMongoSourceType;
  amount: number;
  currency: string;
  status: PayMongoSourceStatus;
  redirect: PayMongoRedirect;
  billing?: PayMongoBilling;
  livemode: boolean;
  created_at: number;
  updated_at: number;
  metadata?: Record<string, string>;
}

/**
 * PayMongo Source object
 */
export interface PayMongoSource {
  id: string;
  type: 'source';
  attributes: PayMongoSourceAttributes;
}

/**
 * Create source request
 */
export interface CreateSourceRequest {
  amount: number;
  currency: string;
  type: PayMongoSourceType;
  redirect: {
    success: string;
    failed: string;
  };
  billing?: PayMongoBilling;
  metadata?: Record<string, string>;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

/**
 * PayMongo payment status
 */
export type PayMongoPaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed';

/**
 * Payment source reference
 */
export interface PayMongoPaymentSource {
  id: string;
  type: 'source';
}

/**
 * Payment attributes
 */
export interface PayMongoPaymentAttributes {
  amount: number;
  currency: string;
  description?: string;
  status: PayMongoPaymentStatus;
  source: PayMongoPaymentSource;
  billing?: PayMongoBilling;
  fee: number;
  net_amount: number;
  livemode: boolean;
  created_at: number;
  updated_at: number;
  paid_at?: number;
  payout?: string | null;
  statement_descriptor?: string;
  metadata?: Record<string, string>;
}

/**
 * PayMongo Payment object
 */
export interface PayMongoPayment {
  id: string;
  type: 'payment';
  attributes: PayMongoPaymentAttributes;
}

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  source: {
    id: string;
    type: 'source';
  };
  description?: string;
  statement_descriptor?: string;
  metadata?: Record<string, string>;
}

// ============================================================================
// PAYOUT TYPES
// ============================================================================

/**
 * Payout status
 */
export type PayMongoPayoutStatus = 
  | 'pending'
  | 'in_transit'
  | 'paid'
  | 'failed'
  | 'cancelled';

/**
 * Bank account details
 */
export interface PayMongoBankAccount {
  bank_code: string;
  account_number: string;
  account_holder_name: string;
}

/**
 * Payout attributes
 */
export interface PayMongoPayoutAttributes {
  amount: number;
  currency: string;
  status: PayMongoPayoutStatus;
  bank_account: PayMongoBankAccount;
  livemode: boolean;
  created_at: number;
  updated_at: number;
  paid_at?: number;
  metadata?: Record<string, string>;
}

/**
 * PayMongo Payout object
 */
export interface PayMongoPayout {
  id: string;
  type: 'payout';
  attributes: PayMongoPayoutAttributes;
}

/**
 * Create payout request
 */
export interface CreatePayoutRequest {
  amount: number;
  currency: string;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  description?: string;
  metadata?: Record<string, string>;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types
 */
export type PayMongoWebhookEventType = 
  | 'source.chargeable'
  | 'source.expired'
  | 'source.failed'
  | 'source.cancelled'
  | 'payment.paid'
  | 'payment.failed'
  | 'payout.paid'
  | 'payout.failed';

/**
 * Webhook event data
 */
export interface PayMongoWebhookEventData {
  id: string;
  type: 'source' | 'payment' | 'payout';
  attributes: PayMongoSourceAttributes | PayMongoPaymentAttributes | PayMongoPayoutAttributes;
}

/**
 * Webhook event
 */
export interface PayMongoWebhookEvent {
  id: string;
  type: 'event';
  attributes: {
    type: PayMongoWebhookEventType;
    livemode: boolean;
    data: PayMongoWebhookEventData;
    created_at: number;
    updated_at: number;
  };
}

/**
 * Webhook payload
 */
export interface PayMongoWebhookPayload {
  data: PayMongoWebhookEvent;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface PayMongoApiResponse<T> {
  data: T;
}

/**
 * API error response
 */
export interface PayMongoApiError {
  errors: Array<{
    code: string;
    detail: string;
    source?: {
      pointer?: string;
      attribute?: string;
    };
  }>;
}

// ============================================================================
// USER DATA TYPES
// ============================================================================

/**
 * PayMongo-specific user data stored in Firebase
 */
export interface UserPayMongoData {
  /** PayMongo customer identifier (if applicable) */
  paymongoCustomerId?: string;
  /** Saved payout bank accounts */
  paymongoBankAccounts?: PayMongoSavedBankAccount[];
  /** Preferred payment method */
  preferredPaymentMethod?: PayMongoSourceType;
}

/**
 * Saved bank account for payouts
 */
export interface PayMongoSavedBankAccount {
  /** Unique identifier */
  id: string;
  /** Bank code (e.g., 'BPI', 'BDO', 'UNIONBANK') */
  bankCode: string;
  /** Bank name for display */
  bankName: string;
  /** Account number (masked for display) */
  accountNumberMasked: string;
  /** Full account number (encrypted) */
  accountNumber: string;
  /** Account holder name */
  accountHolderName: string;
  /** Whether this is the default payout account */
  isDefault: boolean;
  /** When the account was added */
  createdAt: string;
}

// ============================================================================
// BANK CODES
// ============================================================================

/**
 * Philippine bank codes for payouts
 */
export const PH_BANK_CODES: Record<string, string> = {
  'BDO': 'BDO Unibank',
  'BPI': 'Bank of the Philippine Islands',
  'MBTC': 'Metrobank',
  'PNB': 'Philippine National Bank',
  'LANDBANK': 'Land Bank of the Philippines',
  'UNIONBANK': 'UnionBank of the Philippines',
  'RCBC': 'Rizal Commercial Banking Corporation',
  'CHINABANK': 'China Bank',
  'SECURITYBANK': 'Security Bank',
  'EASTWEST': 'EastWest Bank',
  'AUB': 'Asia United Bank',
  'PBCOM': 'Philippine Bank of Communications',
  'PSB': 'Philippine Savings Bank',
  'ROBINSONSBANK': 'Robinsons Bank',
  'CTBC': 'CTBC Bank Philippines',
};

/**
 * Get bank name from code
 */
export function getBankName(bankCode: string): string {
  return PH_BANK_CODES[bankCode] || bankCode;
}


