/**
 * Xendit TypeScript Definitions
 * 
 * Type definitions for Xendit API interactions.
 * Based on Xendit API documentation.
 * 
 * @module lib/xendit/xenditTypes
 */

// ============================================================================
// VIRTUAL ACCOUNT TYPES
// ============================================================================

/**
 * Supported bank codes for Virtual Accounts
 */
export type XenditBankCode = 
  | 'BCA'
  | 'BNI'
  | 'BRI'
  | 'MANDIRI'
  | 'PERMATA'
  | 'SAHABAT_SAMPOERNA'
  | 'BNC'
  | 'BJB'
  | 'BSI'
  | 'CIMB';

/**
 * Virtual Account status
 */
export type VirtualAccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

/**
 * Virtual Account object
 */
export interface XenditVirtualAccount {
  id: string;
  owner_id: string;
  external_id: string;
  bank_code: XenditBankCode;
  merchant_code: string;
  name: string;
  account_number: string;
  is_single_use: boolean;
  is_closed: boolean;
  expected_amount?: number;
  suggested_amount?: number;
  expiration_date?: string;
  status: VirtualAccountStatus;
  currency: string;
}

/**
 * Create Virtual Account request
 */
export interface CreateVirtualAccountRequest {
  external_id: string;
  bank_code: XenditBankCode;
  name: string;
  expected_amount?: number;
  suggested_amount?: number;
  is_single_use?: boolean;
  is_closed?: boolean;
  expiration_date?: string;
}

/**
 * Virtual Account payment callback
 */
export interface VirtualAccountPaymentCallback {
  id: string;
  payment_id: string;
  callback_virtual_account_id: string;
  external_id: string;
  merchant_code: string;
  account_number: string;
  bank_code: XenditBankCode;
  amount: number;
  transaction_timestamp: string;
  currency: string;
  owner_id: string;
}

// ============================================================================
// E-WALLET TYPES
// ============================================================================

/**
 * Supported e-wallet channel codes
 */
export type XenditEWalletChannel = 
  | 'ID_OVO'
  | 'ID_DANA'
  | 'ID_LINKAJA'
  | 'ID_SHOPEEPAY'
  | 'ID_GOPAY'
  | 'ID_ASTRAPAY'
  | 'ID_JENIUSPAY'
  | 'ID_SAKUKU';

/**
 * E-wallet charge status
 */
export type EWalletChargeStatus = 
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'VOIDED';

/**
 * E-wallet checkout method
 */
export type EWalletCheckoutMethod = 
  | 'ONE_TIME_PAYMENT'
  | 'TOKENIZED_PAYMENT';

/**
 * E-wallet channel properties
 */
export interface EWalletChannelProperties {
  /** Required for OVO */
  mobile_number?: string;
  /** Success redirect URL */
  success_redirect_url?: string;
  /** Failure redirect URL */
  failure_redirect_url?: string;
  /** Cancel redirect URL */
  cancel_redirect_url?: string;
}

/**
 * E-wallet charge actions (for redirect flows)
 */
export interface EWalletActions {
  desktop_web_checkout_url?: string;
  mobile_web_checkout_url?: string;
  mobile_deeplink_checkout_url?: string;
  qr_checkout_string?: string;
}

/**
 * E-wallet charge object
 */
export interface XenditEWalletCharge {
  id: string;
  business_id: string;
  reference_id: string;
  status: EWalletChargeStatus;
  currency: string;
  charge_amount: number;
  capture_amount?: number;
  checkout_method: EWalletCheckoutMethod;
  channel_code: XenditEWalletChannel;
  channel_properties: EWalletChannelProperties;
  actions?: EWalletActions;
  is_redirect_required: boolean;
  callback_url: string;
  created: string;
  updated: string;
  voided_at?: string;
  capture_now: boolean;
  metadata?: Record<string, string>;
}

/**
 * Create e-wallet charge request
 */
export interface CreateEWalletChargeRequest {
  reference_id: string;
  currency: string;
  amount: number;
  checkout_method: EWalletCheckoutMethod;
  channel_code: XenditEWalletChannel;
  channel_properties?: EWalletChannelProperties;
  metadata?: Record<string, string>;
}

// ============================================================================
// DISBURSEMENT TYPES
// ============================================================================

/**
 * Disbursement status
 */
export type DisbursementStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED';

/**
 * Disbursement channel category
 */
export type DisbursementChannelCategory = 
  | 'BANK'
  | 'EWALLET';

/**
 * Disbursement object
 */
export interface XenditDisbursement {
  id: string;
  external_id: string;
  user_id: string;
  amount: number;
  bank_code: string;
  account_holder_name: string;
  disbursement_description?: string;
  status: DisbursementStatus;
  email_to?: string[];
  email_cc?: string[];
  email_bcc?: string[];
  is_instant: boolean;
  failure_code?: string;
}

/**
 * Create disbursement request
 */
export interface CreateDisbursementRequest {
  external_id: string;
  amount: number;
  bank_code: string;
  account_holder_name: string;
  account_number: string;
  description?: string;
  email_to?: string[];
}

/**
 * Disbursement callback
 */
export interface DisbursementCallback {
  id: string;
  external_id: string;
  user_id: string;
  amount: number;
  bank_code: string;
  account_holder_name: string;
  disbursement_description?: string;
  status: DisbursementStatus;
  is_instant: boolean;
  failure_code?: string;
  updated: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types
 */
export type XenditWebhookEventType = 
  | 'fva_paid'
  | 'ewallet.capture'
  | 'disbursement';

/**
 * Generic webhook payload
 */
export interface XenditWebhookPayload<T = unknown> {
  event: XenditWebhookEventType;
  data: T;
}

// ============================================================================
// USER DATA TYPES
// ============================================================================

/**
 * Xendit-specific user data stored in Firebase
 */
export interface UserXenditData {
  /** Preferred bank for VA payments */
  preferredVABank?: XenditBankCode;
  /** Preferred e-wallet */
  preferredEWallet?: XenditEWalletChannel;
  /** Saved disbursement accounts */
  xenditDisbursementAccounts?: XenditSavedDisbursementAccount[];
}

/**
 * Saved disbursement account for withdrawals
 */
export interface XenditSavedDisbursementAccount {
  /** Unique identifier */
  id: string;
  /** Type: bank or e-wallet */
  type: 'bank' | 'ewallet';
  /** Bank code or e-wallet channel */
  channelCode: string;
  /** Bank/wallet name for display */
  channelName: string;
  /** Account number (masked for display) */
  accountNumberMasked: string;
  /** Full account number */
  accountNumber: string;
  /** Account holder name */
  accountHolderName: string;
  /** Whether this is the default account */
  isDefault: boolean;
  /** When the account was added */
  createdAt: string;
}

// ============================================================================
// BANK CODES
// ============================================================================

/**
 * Indonesian bank codes for disbursements
 */
export const ID_BANK_CODES: Record<string, string> = {
  'BCA': 'Bank Central Asia',
  'MANDIRI': 'Bank Mandiri',
  'BNI': 'Bank Negara Indonesia',
  'BRI': 'Bank Rakyat Indonesia',
  'PERMATA': 'Bank Permata',
  'CIMB': 'CIMB Niaga',
  'DANAMON': 'Bank Danamon',
  'PANIN': 'Panin Bank',
  'MAYBANK': 'Maybank Indonesia',
  'OCBC': 'OCBC NISP',
  'BSI': 'Bank Syariah Indonesia',
  'BTN': 'Bank Tabungan Negara',
  'BTPN': 'Bank BTPN',
  'MEGA': 'Bank Mega',
  'SINARMAS': 'Bank Sinarmas',
};

/**
 * E-wallet display names
 */
export const EWALLET_NAMES: Record<XenditEWalletChannel, string> = {
  'ID_OVO': 'OVO',
  'ID_DANA': 'DANA',
  'ID_LINKAJA': 'LinkAja',
  'ID_SHOPEEPAY': 'ShopeePay',
  'ID_GOPAY': 'GoPay',
  'ID_ASTRAPAY': 'AstraPay',
  'ID_JENIUSPAY': 'Jenius Pay',
  'ID_SAKUKU': 'Sakuku',
};

/**
 * Get bank name from code
 */
export function getBankName(bankCode: string): string {
  return ID_BANK_CODES[bankCode] || bankCode;
}

/**
 * Get e-wallet name from channel code
 */
export function getEWalletName(channelCode: XenditEWalletChannel): string {
  return EWALLET_NAMES[channelCode] || channelCode;
}


