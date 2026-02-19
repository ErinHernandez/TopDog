/**
 * Unified Payment Types
 * 
 * Provider-agnostic types for the payment abstraction layer.
 * Stripe, Paystack, PayMongo, and Xendit implement these interfaces.
 * 
 * @module lib/payments/types
 */

// ============================================================================
// PROVIDER IDENTIFICATION
// ============================================================================

/**
 * Supported payment providers
 */
export type PaymentProviderName = 'stripe' | 'paystack' | 'paymongo' | 'xendit' | 'paypal';

/**
 * Countries supported by Paystack
 */
export const PAYSTACK_COUNTRIES = ['NG', 'GH', 'ZA', 'KE'] as const;
export type PaystackCountry = typeof PAYSTACK_COUNTRIES[number];

/**
 * Countries supported by PayMongo
 */
export const PAYMONGO_COUNTRIES = ['PH'] as const;
export type PayMongoCountry = typeof PAYMONGO_COUNTRIES[number];

/**
 * Countries supported by Xendit
 */
export const XENDIT_COUNTRIES = ['ID'] as const;
export type XenditCountry = typeof XENDIT_COUNTRIES[number];

/**
 * Country to currency mapping
 */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Paystack countries
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  KE: 'KES',
  // PayMongo countries
  PH: 'PHP',
  // Xendit countries
  ID: 'IDR',
  // Common Stripe countries
  US: 'USD',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
  // Default
  DEFAULT: 'USD',
};

// ============================================================================
// PAYMENT METHOD TYPES
// ============================================================================

/**
 * Payment method categories
 */
export type PaymentMethodCategory = 
  | 'card'
  | 'bank_transfer'
  | 'mobile_money'
  | 'ussd'
  | 'wallet'
  | 'voucher'
  | 'virtual_account'
  | 'ewallet'
  | 'retail';

/**
 * Unified payment method representation
 */
export interface PaymentMethod {
  /** Unique identifier for this method type */
  id: string;
  /** Display name for the user */
  name: string;
  /** Category of payment method */
  category: PaymentMethodCategory;
  /** Provider that handles this method */
  provider: PaymentProviderName;
  /** Countries where this method is available */
  countries: string[];
  /** Currencies supported */
  currencies: string[];
  /** Whether this is an async payment (USSD, mobile money, vouchers) */
  isAsync: boolean;
  /** Icon identifier or URL */
  icon?: string;
  /** Additional display description */
  description?: string;
}

/**
 * Stripe payment methods
 */
export const STRIPE_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    category: 'card',
    provider: 'stripe',
    countries: ['*'], // Global
    currencies: ['*'], // Multi-currency
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard, American Express',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'wallet',
    provider: 'stripe',
    countries: ['*'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    isAsync: false,
    icon: 'paypal',
  },
  {
    id: 'link',
    name: 'Link',
    category: 'wallet',
    provider: 'stripe',
    countries: ['US'],
    currencies: ['USD'],
    isAsync: false,
    icon: 'link',
    description: 'Save your info for faster checkout',
  },
  {
    id: 'us_bank_account',
    name: 'Bank Account (ACH)',
    category: 'bank_transfer',
    provider: 'stripe',
    countries: ['US'],
    currencies: ['USD'],
    isAsync: true,
    icon: 'bank',
    description: 'Direct bank transfer',
  },
  {
    id: 'sepa_debit',
    name: 'SEPA Direct Debit',
    category: 'bank_transfer',
    provider: 'stripe',
    countries: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI'],
    currencies: ['EUR'],
    isAsync: true,
    icon: 'bank',
  },
];

/**
 * Paystack payment methods by country
 */
export const PAYSTACK_PAYMENT_METHODS: PaymentMethod[] = [
  // Nigeria
  {
    id: 'paystack_card_ng',
    name: 'Card',
    category: 'card',
    provider: 'paystack',
    countries: ['NG'],
    currencies: ['NGN'],
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard, Verve',
  },
  {
    id: 'paystack_bank_transfer_ng',
    name: 'Bank Transfer',
    category: 'bank_transfer',
    provider: 'paystack',
    countries: ['NG'],
    currencies: ['NGN'],
    isAsync: true,
    icon: 'bank',
    description: 'Pay via bank transfer',
  },
  {
    id: 'paystack_ussd_ng',
    name: 'USSD',
    category: 'ussd',
    provider: 'paystack',
    countries: ['NG'],
    currencies: ['NGN'],
    isAsync: true,
    icon: 'phone',
    description: 'Pay with USSD code - no internet needed',
  },
  // Ghana
  {
    id: 'paystack_card_gh',
    name: 'Card',
    category: 'card',
    provider: 'paystack',
    countries: ['GH'],
    currencies: ['GHS'],
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard',
  },
  {
    id: 'paystack_mobile_money_gh',
    name: 'Mobile Money',
    category: 'mobile_money',
    provider: 'paystack',
    countries: ['GH'],
    currencies: ['GHS'],
    isAsync: true,
    icon: 'mobile',
    description: 'MTN, Vodafone Cash, AirtelTigo Money',
  },
  // South Africa
  {
    id: 'paystack_card_za',
    name: 'Card',
    category: 'card',
    provider: 'paystack',
    countries: ['ZA'],
    currencies: ['ZAR'],
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard, American Express',
  },
  {
    id: 'paystack_eft_za',
    name: 'Instant EFT',
    category: 'bank_transfer',
    provider: 'paystack',
    countries: ['ZA'],
    currencies: ['ZAR'],
    isAsync: true,
    icon: 'bank',
    description: 'Instant bank transfer',
  },
  // Kenya
  {
    id: 'paystack_card_ke',
    name: 'Card',
    category: 'card',
    provider: 'paystack',
    countries: ['KE'],
    currencies: ['KES'],
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard',
  },
  {
    id: 'paystack_mpesa_ke',
    name: 'M-Pesa',
    category: 'mobile_money',
    provider: 'paystack',
    countries: ['KE'],
    currencies: ['KES'],
    isAsync: true,
    icon: 'mpesa',
    description: 'Pay with M-Pesa',
  },
];

/**
 * PayMongo payment methods (Philippines)
 */
export const PAYMONGO_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'paymongo_gcash',
    name: 'GCash',
    category: 'ewallet',
    provider: 'paymongo',
    countries: ['PH'],
    currencies: ['PHP'],
    isAsync: true,
    icon: 'gcash',
    description: 'Pay with GCash - 75M+ users',
  },
  {
    id: 'paymongo_maya',
    name: 'Maya',
    category: 'ewallet',
    provider: 'paymongo',
    countries: ['PH'],
    currencies: ['PHP'],
    isAsync: true,
    icon: 'maya',
    description: 'Pay with Maya (PayMaya)',
  },
  {
    id: 'paymongo_grabpay',
    name: 'GrabPay',
    category: 'ewallet',
    provider: 'paymongo',
    countries: ['PH'],
    currencies: ['PHP'],
    isAsync: true,
    icon: 'grabpay',
    description: 'Pay with GrabPay',
  },
  {
    id: 'paymongo_card',
    name: 'Card',
    category: 'card',
    provider: 'paymongo',
    countries: ['PH'],
    currencies: ['PHP'],
    isAsync: false,
    icon: 'card',
    description: 'Visa, Mastercard',
  },
  {
    id: 'paymongo_bank_transfer',
    name: 'Bank Transfer',
    category: 'bank_transfer',
    provider: 'paymongo',
    countries: ['PH'],
    currencies: ['PHP'],
    isAsync: true,
    icon: 'bank',
    description: 'InstaPay / PESONet',
  },
];

/**
 * Xendit payment methods (Indonesia)
 */
export const XENDIT_PAYMENT_METHODS: PaymentMethod[] = [
  // Virtual Accounts - Primary payment method in Indonesia
  {
    id: 'xendit_va_bca',
    name: 'BCA Virtual Account',
    category: 'virtual_account',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'bca',
    description: 'Pay via BCA mobile banking',
  },
  {
    id: 'xendit_va_mandiri',
    name: 'Mandiri Virtual Account',
    category: 'virtual_account',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'mandiri',
    description: 'Pay via Mandiri mobile banking',
  },
  {
    id: 'xendit_va_bni',
    name: 'BNI Virtual Account',
    category: 'virtual_account',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'bni',
    description: 'Pay via BNI mobile banking',
  },
  {
    id: 'xendit_va_bri',
    name: 'BRI Virtual Account',
    category: 'virtual_account',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'bri',
    description: 'Pay via BRI mobile banking',
  },
  {
    id: 'xendit_va_permata',
    name: 'Permata Virtual Account',
    category: 'virtual_account',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'permata',
    description: 'Pay via Permata mobile banking',
  },
  // E-Wallets
  {
    id: 'xendit_ovo',
    name: 'OVO',
    category: 'ewallet',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'ovo',
    description: 'Pay with OVO - push notification',
  },
  {
    id: 'xendit_gopay',
    name: 'GoPay',
    category: 'ewallet',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'gopay',
    description: 'Pay with GoPay (Gojek)',
  },
  {
    id: 'xendit_dana',
    name: 'DANA',
    category: 'ewallet',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'dana',
    description: 'Pay with DANA',
  },
  {
    id: 'xendit_shopeepay',
    name: 'ShopeePay',
    category: 'ewallet',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'shopeepay',
    description: 'Pay with ShopeePay',
  },
  // QRIS
  {
    id: 'xendit_qris',
    name: 'QRIS',
    category: 'ewallet',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'qris',
    description: 'Scan QR code to pay',
  },
  // Retail
  {
    id: 'xendit_alfamart',
    name: 'Alfamart',
    category: 'retail',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'alfamart',
    description: 'Pay cash at Alfamart',
  },
  {
    id: 'xendit_indomaret',
    name: 'Indomaret',
    category: 'retail',
    provider: 'xendit',
    countries: ['ID'],
    currencies: ['IDR'],
    isAsync: true,
    icon: 'indomaret',
    description: 'Pay cash at Indomaret',
  },
];

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Transaction type
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'entry' | 'winning' | 'refund';

/**
 * Transaction status
 */
export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Unified transaction record
 */
export interface UnifiedTransaction {
  /** Unique transaction ID */
  id: string;
  /** Firebase user ID */
  userId: string;
  /** Type of transaction */
  type: TransactionType;
  /** Provider that processed this transaction */
  provider: PaymentProviderName;
  /** Amount in smallest currency unit (cents, kobo, centavos, etc.) */
  amountSmallestUnit: number;
  /** Currency code (e.g., 'USD', 'NGN', 'PHP', 'IDR') */
  currency: string;
  /** USD equivalent in cents (for reporting) */
  usdEquivalentCents?: number;
  /** Exchange rate at time of transaction */
  exchangeRate?: number;
  /** Current status */
  status: TransactionStatus;
  /** Payment method used */
  paymentMethod?: string;
  /** Payment method type ID */
  paymentMethodType?: string;
  /** Provider-specific transaction ID */
  providerTransactionId?: string;
  /** Provider-specific reference */
  providerReference?: string;
  /** For async payments: URL or code to complete payment */
  actionUrl?: string;
  /** For async payments: expiration time */
  expiresAt?: string;
  /** Human-readable description */
  description?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

/**
 * Payment intent/transaction creation request
 */
export interface CreatePaymentRequest {
  /** Amount in smallest unit */
  amountSmallestUnit: number;
  /** Currency code */
  currency: string;
  /** Firebase user ID */
  userId: string;
  /** User's email */
  email?: string;
  /** User's country code */
  country?: string;
  /** User's phone number (required for some e-wallets) */
  phone?: string;
  /** Specific payment method to use */
  paymentMethodType?: string;
  /** Whether to save payment method for future use */
  savePaymentMethod?: boolean;
  /** Idempotency key */
  idempotencyKey?: string;
  /** Success redirect URL */
  successUrl?: string;
  /** Failure redirect URL */
  failureUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Payment intent/transaction creation response
 */
export interface CreatePaymentResponse {
  /** Success status */
  success: boolean;
  /** Transaction ID in our system */
  transactionId?: string;
  /** Provider's transaction/reference ID */
  providerReference?: string;
  /** For inline payments: client secret or access code */
  clientSecret?: string;
  /** For redirect payments: URL to redirect to */
  authorizationUrl?: string;
  /** For virtual accounts: account number to pay to */
  virtualAccountNumber?: string;
  /** For virtual accounts: bank name */
  virtualAccountBank?: string;
  /** For USSD: dial code */
  ussdCode?: string;
  /** For mobile money/e-wallets: instructions */
  mobileMoneyInstructions?: string;
  /** For QR payments: QR code string */
  qrCodeString?: string;
  /** Transaction status */
  status?: TransactionStatus;
  /** Expiration time for async payments */
  expiresAt?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Transfer/payout creation request
 */
export interface CreateTransferRequest {
  /** Amount in smallest unit */
  amountSmallestUnit: number;
  /** Currency code */
  currency: string;
  /** Firebase user ID */
  userId: string;
  /** Recipient identifier (account ID, recipient code, etc.) */
  recipientId: string;
  /** Transfer reason/description */
  reason?: string;
  /** Idempotency key */
  idempotencyKey?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Transfer/payout creation response
 */
export interface CreateTransferResponse {
  /** Success status */
  success: boolean;
  /** Transfer ID in our system */
  transactionId?: string;
  /** Provider's transfer ID */
  providerTransferId?: string;
  /** Transfer status */
  status?: TransactionStatus;
  /** Error message if failed */
  error?: string;
}

/**
 * Payment provider interface
 * 
 * All payment providers must implement this interface.
 */
export interface PaymentProvider {
  /** Provider name */
  readonly name: PaymentProviderName;
  
  /** 
   * Get countries supported by this provider 
   */
  getSupportedCountries(): string[];
  
  /**
   * Get currencies supported by this provider
   */
  getSupportedCurrencies(): string[];
  
  /**
   * Get available payment methods for a country
   */
  getPaymentMethodsForCountry(country: string): PaymentMethod[];
  
  /**
   * Create a payment intent/transaction
   */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  
  /**
   * Verify a payment (for callback verification)
   */
  verifyPayment(reference: string): Promise<{ success: boolean; status: TransactionStatus; error?: string }>;
  
  /**
   * Create a transfer/payout
   */
  createTransfer(request: CreateTransferRequest): Promise<CreateTransferResponse>;
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a country is supported by Paystack
 */
export function isPaystackCountry(country: string): country is PaystackCountry {
  return PAYSTACK_COUNTRIES.includes(country as PaystackCountry);
}

/**
 * Check if a country is supported by PayMongo
 */
export function isPayMongoCountry(country: string): country is PayMongoCountry {
  return PAYMONGO_COUNTRIES.includes(country as PayMongoCountry);
}

/**
 * Check if a country is supported by Xendit
 */
export function isXenditCountry(country: string): country is XenditCountry {
  return XENDIT_COUNTRIES.includes(country as XenditCountry);
}

/**
 * Get the currency for a country
 */
export function getCurrencyForCountry(country: string): string {
  const currency = COUNTRY_CURRENCY_MAP[country];
  if (currency) {
    return currency;
  }
  const defaultCurrency = COUNTRY_CURRENCY_MAP['DEFAULT'];
  if (!defaultCurrency) {
    throw new Error('COUNTRY_CURRENCY_MAP missing DEFAULT currency fallback');
  }
  return defaultCurrency;
}

/**
 * Get all payment methods available for a country
 */
export function getPaymentMethodsForCountry(country: string): PaymentMethod[] {
  if (isPaystackCountry(country)) {
    return PAYSTACK_PAYMENT_METHODS.filter(m => m.countries.includes(country));
  }
  if (isPayMongoCountry(country)) {
    return PAYMONGO_PAYMENT_METHODS.filter(m => m.countries.includes(country));
  }
  if (isXenditCountry(country)) {
    return XENDIT_PAYMENT_METHODS.filter(m => m.countries.includes(country));
  }
  return STRIPE_PAYMENT_METHODS.filter(
    m => m.countries.includes('*') || m.countries.includes(country)
  );
}

/**
 * Get the provider for a country
 */
export function getProviderForCountry(country: string): PaymentProviderName {
  if (isPaystackCountry(country)) return 'paystack';
  if (isPayMongoCountry(country)) return 'paymongo';
  if (isXenditCountry(country)) return 'xendit';
  return 'stripe';
}

