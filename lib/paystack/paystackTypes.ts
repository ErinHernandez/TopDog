/**
 * Paystack Type Definitions
 * 
 * TypeScript types for Paystack API integration.
 * Covers transactions, transfers, webhooks, and bank codes.
 * 
 * @module lib/paystack/paystackTypes
 */

// ============================================================================
// PAYSTACK API RESPONSES
// ============================================================================

/**
 * Base Paystack API response structure
 */
export interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Paystack error response
 */
export interface PaystackErrorResponse {
  status: false;
  message: string;
  data?: null;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Paystack transaction initialization request
 */
export interface InitializeTransactionRequest {
  /** Amount in smallest unit (kobo, pesewas, cents) */
  amount: number;
  /** Customer email */
  email: string;
  /** Currency code */
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'KES';
  /** Unique transaction reference */
  reference?: string;
  /** Callback URL after payment */
  callback_url?: string;
  /** Payment channels to allow */
  channels?: PaystackChannel[];
  /** Metadata */
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
    [key: string]: unknown;
  };
  /** For mobile money: phone number */
  mobile_money?: {
    phone: string;
    provider: 'mtn' | 'vodafone' | 'tigo' | 'mpesa';
  };
  /** For USSD: bank to use */
  ussd?: {
    type: string;
  };
}

/**
 * Payment channels supported by Paystack
 */
export type PaystackChannel = 
  | 'card'
  | 'bank'
  | 'ussd'
  | 'qr'
  | 'mobile_money'
  | 'bank_transfer'
  | 'eft';

/**
 * Paystack transaction initialization response data
 */
export interface InitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/**
 * Paystack transaction status
 */
export type PaystackTransactionStatus = 
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'pending'
  | 'processing'
  | 'queued'
  | 'reversed';

/**
 * Paystack transaction verification response data
 */
export interface VerifyTransactionData {
  id: number;
  domain: string;
  status: PaystackTransactionStatus;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: PaystackChannel;
  currency: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  fees: number | null;
  fees_split: unknown | null;
  authorization?: PaystackAuthorization;
  customer: PaystackCustomer;
  plan?: unknown;
  order_id?: unknown;
  paidAt?: string;
  createdAt?: string;
  requested_amount?: number;
  pos_transaction_data?: unknown;
  source?: unknown;
  fees_breakdown?: unknown;
  transaction_date?: string;
  plan_object?: unknown;
  subaccount?: unknown;
}

/**
 * Paystack authorization (saved card) data
 */
export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
  receiver_bank_account_number?: string;
  receiver_bank?: string;
}

/**
 * Paystack customer data
 */
export interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  risk_action: string;
  international_format_phone: string | null;
}

// ============================================================================
// CHARGE TYPES (for mobile money, USSD)
// ============================================================================

/**
 * USSD charge request
 */
export interface ChargeUssdRequest {
  /** Amount in smallest unit */
  amount: number;
  /** Customer email */
  email: string;
  /** Currency */
  currency?: string;
  /** Reference */
  reference?: string;
  /** USSD type/bank code */
  ussd: {
    type: string; // Bank code like '737' for GTBank
  };
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Mobile money charge request
 */
export interface ChargeMobileMoneyRequest {
  /** Amount in smallest unit */
  amount: number;
  /** Customer email */
  email: string;
  /** Currency (GHS for Ghana, KES for Kenya) */
  currency: 'GHS' | 'KES';
  /** Reference */
  reference?: string;
  /** Mobile money details */
  mobile_money: {
    phone: string;
    provider: 'mtn' | 'vodafone' | 'tigo' | 'mpesa';
  };
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Charge response data
 */
export interface ChargeResponseData {
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'send_otp' | 'send_pin' | 'send_phone' | 'send_birthday' | 'send_address';
  display_text?: string;
  ussd_code?: string;
  message?: string;
}

// ============================================================================
// TRANSFER (PAYOUT) TYPES
// ============================================================================

/**
 * Transfer recipient type
 */
export type TransferRecipientType = 
  | 'nuban'        // Nigerian bank account
  | 'mobile_money' // Ghana mobile money
  | 'basa'         // South Africa bank account
  | 'authorization'; // Existing card authorization

/**
 * Create transfer recipient request
 */
export interface CreateTransferRecipientRequest {
  /** Recipient type */
  type: TransferRecipientType;
  /** Recipient name */
  name: string;
  /** Account number (for bank) or phone (for mobile money) */
  account_number: string;
  /** Bank code (for bank transfers) */
  bank_code?: string;
  /** Currency */
  currency: 'NGN' | 'GHS' | 'ZAR' | 'KES';
  /** Description */
  description?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transfer recipient response data
 */
export interface TransferRecipientData {
  active: boolean;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: TransferRecipientType;
  updatedAt: string;
  is_deleted: boolean;
  isDeleted: boolean;
  details: {
    authorization_code?: string;
    account_number: string;
    account_name: string | null;
    bank_code: string;
    bank_name: string;
  };
}

/**
 * Initiate transfer request
 */
export interface InitiateTransferRequest {
  /** Transfer source (only 'balance' is supported) */
  source: 'balance';
  /** Amount in smallest unit */
  amount: number;
  /** Recipient code from create recipient */
  recipient: string;
  /** Transfer reason */
  reason?: string;
  /** Currency */
  currency?: string;
  /** Unique reference */
  reference?: string;
}

/**
 * Transfer status
 */
export type PaystackTransferStatus = 
  | 'pending'
  | 'success'
  | 'failed'
  | 'reversed'
  | 'queued'
  | 'processing';

/**
 * Transfer response data
 */
export interface TransferData {
  reference: string;
  integration: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;
  reason: string;
  recipient: number;
  status: PaystackTransferStatus;
  transfer_code: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BANK TYPES
// ============================================================================

/**
 * Bank information
 */
export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

/**
 * Account verification request
 */
export interface ResolveAccountRequest {
  account_number: string;
  bank_code: string;
}

/**
 * Account verification response data
 */
export interface ResolveAccountData {
  account_number: string;
  account_name: string;
  bank_id: number;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types
 */
export type PaystackWebhookEvent = 
  | 'charge.success'
  | 'charge.failed'
  | 'transfer.success'
  | 'transfer.failed'
  | 'transfer.reversed'
  | 'customeridentification.success'
  | 'customeridentification.failed'
  | 'subscription.create'
  | 'subscription.not_renew'
  | 'subscription.disable'
  | 'subscription.expiring_cards'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.payment_failed'
  | 'paymentrequest.pending'
  | 'paymentrequest.success'
  | 'refund.pending'
  | 'refund.processed'
  | 'refund.failed';

/**
 * Base webhook payload structure
 */
export interface PaystackWebhookPayload<T = unknown> {
  event: PaystackWebhookEvent;
  data: T;
}

/**
 * Charge success webhook data
 */
export interface ChargeSuccessWebhookData {
  id: number;
  domain: string;
  status: 'success';
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: PaystackChannel;
  currency: string;
  ip_address: string;
  metadata: {
    firebaseUserId?: string;
    custom_fields?: unknown[];
    [key: string]: unknown;
  };
  fees: number;
  customer: PaystackCustomer;
  authorization: PaystackAuthorization;
  plan?: unknown;
}

/**
 * Charge failed webhook data
 * Similar to success but with failed status and no paid_at
 */
export interface ChargeFailedWebhookData {
  id: number;
  domain: string;
  status: 'failed' | 'abandoned';
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  created_at: string;
  channel: PaystackChannel;
  currency: string;
  ip_address: string;
  metadata: {
    firebaseUserId?: string;
    custom_fields?: unknown[];
    [key: string]: unknown;
  };
  fees: number;
  customer: PaystackCustomer;
  authorization?: PaystackAuthorization; // May not exist for failed charges
}

/**
 * Transfer success/failed webhook data
 */
export interface TransferWebhookData {
  amount: number;
  currency: string;
  domain: string;
  failures: unknown | null;
  id: number;
  integration: {
    id: number;
    is_live: boolean;
    business_name: string;
  };
  reason: string;
  reference: string;
  source: string;
  source_details: unknown | null;
  status: PaystackTransferStatus;
  titan_code: unknown | null;
  transfer_code: string;
  transferred_at: string | null;
  recipient: {
    active: boolean;
    currency: string;
    description: string | null;
    domain: string;
    email: string | null;
    id: number;
    integration: number;
    metadata: {
      firebaseUserId?: string;
      [key: string]: unknown;
    };
    name: string;
    recipient_code: string;
    type: TransferRecipientType;
    is_deleted: boolean;
    details: {
      account_number: string;
      account_name: string | null;
      bank_code: string;
      bank_name: string;
    };
    created_at: string;
    updated_at: string;
  };
  session: {
    provider: string | null;
    id: string | null;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FIREBASE SCHEMA EXTENSIONS
// ============================================================================

/**
 * Paystack-specific user data stored in Firebase
 */
export interface UserPaystackData {
  /** Paystack customer code */
  paystackCustomerCode?: string;
  /** Saved transfer recipients */
  paystackTransferRecipients?: PaystackTransferRecipient[];
  /** Default recipient for withdrawals */
  defaultPaystackRecipient?: string;
}

/**
 * Saved transfer recipient
 */
export interface PaystackTransferRecipient {
  /** Paystack recipient code */
  code: string;
  /** Recipient type */
  type: TransferRecipientType;
  /** Bank code (for bank transfers) */
  bankCode?: string;
  /** Bank name */
  bankName?: string;
  /** Account number (masked for display) */
  accountNumber: string;
  /** Account holder name */
  accountName?: string;
  /** Currency */
  currency: string;
  /** Whether this is the default recipient */
  isDefault?: boolean;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Paystack-specific transaction data stored in Firebase
 */
export interface TransactionPaystackData {
  /** Paystack reference */
  paystackReference?: string;
  /** Paystack transfer code (for withdrawals) */
  paystackTransferCode?: string;
  /** Payment channel used */
  paystackChannel?: PaystackChannel;
  /** Authorization code (for saved cards) */
  paystackAuthorizationCode?: string;
  /** USSD code displayed to user */
  ussdCode?: string;
  /** Fees charged by Paystack (in smallest unit) */
  paystackFees?: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Paystack currency configuration
 */
export interface PaystackCurrencyConfig {
  /** Currency code */
  code: 'NGN' | 'GHS' | 'ZAR' | 'KES';
  /** Currency symbol */
  symbol: string;
  /** Currency name */
  name: string;
  /** Smallest unit name (kobo, pesewas, cents) */
  smallestUnit: string;
  /** Number of smallest units per main unit (usually 100) */
  factor: number;
  /** Minimum transaction amount in smallest unit */
  minAmountSmallest: number;
  /** Maximum transaction amount in smallest unit */
  maxAmountSmallest: number;
  /** Country code */
  country: string;
}

/**
 * Nigerian bank USSD code mapping
 */
export interface UssdBankCode {
  /** Bank name */
  name: string;
  /** Bank code for API */
  code: string;
  /** USSD type for charge API */
  ussdType: string;
  /** Example USSD format */
  exampleFormat: string;
}

/**
 * Nigerian bank USSD codes
 */
export const NIGERIAN_USSD_BANKS: UssdBankCode[] = [
  { name: 'GTBank', code: '058', ussdType: '737', exampleFormat: '*737*amount*50*ref#' },
  { name: 'Zenith Bank', code: '057', ussdType: '966', exampleFormat: '*966*amount*ref#' },
  { name: 'First Bank', code: '011', ussdType: '894', exampleFormat: '*894*amount*ref#' },
  { name: 'UBA', code: '033', ussdType: '919', exampleFormat: '*919*amount*ref#' },
  { name: 'Access Bank', code: '044', ussdType: '901', exampleFormat: '*901*amount*ref#' },
  { name: 'Stanbic IBTC', code: '221', ussdType: '909', exampleFormat: '*909*amount*ref#' },
  { name: 'Sterling Bank', code: '232', ussdType: '822', exampleFormat: '*822*amount*ref#' },
  { name: 'Unity Bank', code: '215', ussdType: '7799', exampleFormat: '*7799*amount*ref#' },
];

