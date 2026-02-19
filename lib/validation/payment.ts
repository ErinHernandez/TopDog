/**
 * Payment Validation Schemas
 *
 * Schemas for all payment-related API inputs including Stripe, PayPal,
 * Paystack, Paymongo, and Xendit integrations.
 *
 * @module lib/validation/payment
 */

import { z } from 'zod';

import {
  firebaseUserIdSchema,
  emailSchema,
  amountCentsSchema,
  currencyCodeSchema,
  countryCodeSchema,
  uuidSchema,
  urlSchema,
  optionalIpAddressSchema,
} from './primitives';

// ============================================================================
// COMMON PAYMENT TYPES
// ============================================================================

/**
 * Payment provider enum
 */
export const paymentProviderSchema = z.enum([
  'stripe',
  'paystack',
  'paymongo',
  'xendit',
  'paypal',
]);

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

/**
 * Risk context for fraud detection
 */
export const riskContextSchema = z.object({
  ipAddress: optionalIpAddressSchema,
  country: countryCodeSchema.optional(),
  deviceId: z.string().max(255).optional(),
  sessionId: z.string().max(255).optional(),
  userAgent: z.string().max(500).optional(),
}).optional();

export type RiskContext = z.infer<typeof riskContextSchema>;

// ============================================================================
// STRIPE SCHEMAS
// ============================================================================

/**
 * Stripe payment intent request
 */
export const stripePaymentIntentRequestSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('USD'),
  country: countryCodeSchema.optional(),
  userId: firebaseUserIdSchema,
  email: emailSchema.optional(),
  name: z.string().max(255).optional(),
  paymentMethodTypes: z.array(z.string().min(1).max(50)).optional(),
  savePaymentMethod: z.boolean().optional().default(false),
  paymentMethodId: z.string().max(255).optional(),
  idempotencyKey: uuidSchema.optional(),
  riskContext: riskContextSchema,
});

export type StripePaymentIntentRequest = z.infer<typeof stripePaymentIntentRequestSchema>;

/**
 * Stripe setup intent request
 */
export const stripeSetupIntentRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  email: emailSchema,
  name: z.string().max(200).optional(),
  paymentMethodTypes: z.array(z.enum(['card'])).optional(),
  idempotencyKey: uuidSchema.optional(),
});

export type StripeSetupIntentRequest = z.infer<typeof stripeSetupIntentRequestSchema>;

/**
 * Stripe cancel payment request
 */
export const stripeCancelPaymentRequestSchema = z.object({
  paymentIntentId: z.string().min(1).max(200),
  userId: firebaseUserIdSchema,
  reason: z.enum(['requested_by_customer', 'abandoned', 'fraudulent']).optional(),
});

export type StripeCancelPaymentRequest = z.infer<typeof stripeCancelPaymentRequestSchema>;

/**
 * Stripe webhook event
 */
export const stripeWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
  created: z.number().int().positive(),
});

// ============================================================================
// PAYPAL SCHEMAS
// ============================================================================

/**
 * PayPal withdrawal request
 *
 * Rate limit: 5 per hour (see rateLimitConfig.ts)
 * Rationale: Withdrawals are high-risk financial operations that should be
 * infrequent. 5/hour allows legitimate use while preventing abuse.
 */
export const paypalWithdrawRequestSchema = z.object({
  amountCents: z
    .number()
    .int('Amount must be a whole number in cents')
    .positive('Amount must be positive')
    .min(100, 'Minimum withdrawal is $1.00')
    .max(1_000_000, 'Maximum withdrawal is $10,000.00'),
  linkedAccountId: z
    .string()
    .min(1, 'Linked account ID is required')
    .max(200, 'Linked account ID too long'),
  confirmationMethod: z.enum(['email', 'sms']).optional(),
});

export type PayPalWithdrawRequest = z.infer<typeof paypalWithdrawRequestSchema>;

/**
 * PayPal create order request
 */
export const paypalCreateOrderSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  currency: currencyCodeSchema.default('USD'),
  riskContext: riskContextSchema,
});

export type PayPalCreateOrderRequest = z.infer<typeof paypalCreateOrderSchema>;

// ============================================================================
// PAYSTACK SCHEMAS (Nigeria, Ghana, South Africa, Kenya)
// ============================================================================

/**
 * Paystack supported countries
 */
export const paystackCountrySchema = z.enum(['NG', 'GH', 'ZA', 'KE']);

/**
 * Paystack supported currencies
 */
export const paystackCurrencySchema = z.enum(['NGN', 'GHS', 'ZAR', 'KES']);

/**
 * Paystack create transfer recipient request
 */
export const paystackCreateRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  type: z.enum(['nuban', 'mobile_money', 'basa']),
  name: z.string().min(1).max(200),
  accountNumber: z.string().min(10).max(20),
  bankCode: z.string().min(3).max(10).optional(),
  country: paystackCountrySchema,
  setAsDefault: z.boolean().optional(),
});

export type PaystackCreateRecipientRequest = z.infer<typeof paystackCreateRecipientSchema>;

/**
 * Paystack delete transfer recipient request
 */
export const paystackDeleteRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  recipientCode: z.string().min(1).max(100),
});

export type PaystackDeleteRecipientRequest = z.infer<typeof paystackDeleteRecipientSchema>;

/**
 * Paystack initiate transfer request
 */
export const paystackInitiateTransferSchema = z.object({
  userId: firebaseUserIdSchema,
  amountSmallestUnit: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive')
    .min(100, 'Minimum transfer amount is 100 (smallest unit)'),
  currency: paystackCurrencySchema,
  recipientCode: z.string().min(1).max(100),
  reason: z.string().max(500).optional(),
  twoFactorToken: z.string().max(200).optional(),
  idempotencyKey: uuidSchema.optional(),
});

export type PaystackInitiateTransferRequest = z.infer<typeof paystackInitiateTransferSchema>;

/**
 * Paystack initialize payment request
 */
export const paystackInitializeSchema = z.object({
  amountSmallestUnit: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive')
    .min(100, 'Minimum amount is 100 (smallest unit)'),
  currency: paystackCurrencySchema.optional().default('NGN'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  country: countryCodeSchema.optional(),
  channel: z.enum(['card', 'ussd', 'mobile_money', 'bank_transfer']).optional().default('card'),
  ussdType: z.string().max(50).optional(),
  mobileMoneyPhone: z.string().max(20).optional(),
  mobileMoneyProvider: z.enum(['mtn', 'vodafone', 'tigo', 'mpesa']).optional(),
  callbackUrl: urlSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PayStackInitializeRequest = z.infer<typeof paystackInitializeSchema>;

/**
 * Paystack verify transaction request (GET query or POST body)
 */
export const paystackVerifySchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(128, 'Reference too long').trim(),
});

export type PaystackVerifyRequest = z.infer<typeof paystackVerifySchema>;

// ============================================================================
// PAYMONGO SCHEMAS (Philippines)
// ============================================================================

/**
 * Paymongo create payment request
 */
export const paymongoCreatePaymentSchema = z.object({
  sourceId: z.string().min(1).max(255),
  userId: firebaseUserIdSchema,
  description: z.string().max(500).optional(),
});

export type PayMongoCreatePaymentRequest = z.infer<typeof paymongoCreatePaymentSchema>;

/**
 * Paymongo create payout request
 */
export const paymongoCreatePayoutSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum amount is 0.01')
    .max(100000, 'Maximum amount is 100,000 PHP'),
  userId: firebaseUserIdSchema,
  bankAccountId: z.string().min(1).max(200),
  newBankAccount: z.object({
    bankCode: z.string().min(3).max(10),
    accountNumber: z.string().min(10).max(20),
    accountHolderName: z.string().min(1).max(200),
    saveForFuture: z.boolean().optional(),
  }).optional(),
});

export type PaymongoCreatePayoutRequest = z.infer<typeof paymongoCreatePayoutSchema>;

// ============================================================================
// XENDIT SCHEMAS (Indonesia, Philippines, Vietnam, Thailand)
// ============================================================================

/**
 * Xendit create disbursement request
 *
 * Rate limit: 10 per hour (see rateLimitConfig.ts)
 * Rationale: Higher than PayPal (10 vs 5) because Xendit is used in regions
 * where smaller, more frequent transactions are common. Still limited to
 * prevent abuse.
 */
export const xenditCreateDisbursementSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(10000, 'Minimum amount is 10,000 IDR')
    .max(100000000, 'Maximum amount is 100,000,000 IDR'),
  userId: firebaseUserIdSchema,
  accountId: z.string().min(1).max(200),
  newAccount: z.object({
    bankCode: z.string().min(3).max(10),
    accountNumber: z.string().min(10).max(20),
    accountHolderName: z.string().min(1).max(200),
    saveForFuture: z.boolean().optional(),
  }).optional(),
});

export type XenditCreateDisbursementRequest = z.infer<typeof xenditCreateDisbursementSchema>;

/**
 * Xendit e-wallet payment request
 */
export const xenditEwalletSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('PHP'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  ewalletType: z.enum(['gcash', 'grabpay', 'paymaya']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type XenditEwalletRequest = z.infer<typeof xenditEwalletSchema>;

/**
 * Xendit virtual account request
 */
export const xenditVirtualAccountSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('IDR'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  bankCode: z.string().min(1).max(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type XenditVirtualAccountRequest = z.infer<typeof xenditVirtualAccountSchema>;

/**
 * Xendit create Virtual Account POST body (userId from auth, not body).
 * Used by POST /api/xendit/virtual-account.
 */
export const xenditCreateVABodySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  bankCode: z.enum(['BCA', 'MANDIRI', 'BNI', 'BRI', 'PERMATA'], {
    message: 'Invalid bank code. Must be one of: BCA, MANDIRI, BNI, BRI, PERMATA',
  }),
  name: z.string().min(2, 'Name is required'),
  expirationHours: z.number().int().positive().optional(),
});

export type XenditCreateVABody = z.infer<typeof xenditCreateVABodySchema>;

/**
 * Xendit create e-wallet charge POST body.
 * Used by POST /api/xendit/ewallet. OVO requires mobileNumber.
 */
export const xenditCreateEWalletChargeBodySchema = z
  .object({
    amount: z.number().positive('Amount must be positive'),
    channelCode: z.enum(['ID_OVO', 'ID_GOPAY', 'ID_DANA', 'ID_SHOPEEPAY', 'ID_LINKAJA'], {
      message: 'Invalid channel. Must be one of: ID_OVO, ID_GOPAY, ID_DANA, ID_SHOPEEPAY, ID_LINKAJA',
    }),
    userId: firebaseUserIdSchema,
    mobileNumber: z.string().max(20).optional(),
    successUrl: urlSchema.optional(),
    failureUrl: urlSchema.optional(),
  })
  .refine((data) => data.channelCode !== 'ID_OVO' || (data.mobileNumber && data.mobileNumber.length > 0), {
    message: 'Mobile number is required for OVO',
    path: ['mobileNumber'],
  });

export type XenditCreateEWalletChargeBody = z.infer<typeof xenditCreateEWalletChargeBodySchema>;

/**
 * PayMongo create source POST body (GCash, Maya, GrabPay).
 * Used by POST /api/paymongo/source.
 */
export const paymongoCreateSourceBodySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['gcash', 'grab_pay', 'paymaya'], {
    message: 'Invalid type. Must be one of: gcash, grab_pay, paymaya',
  }),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  successUrl: urlSchema.optional(),
  failureUrl: urlSchema.optional(),
});

export type PaymongoCreateSourceBody = z.infer<typeof paymongoCreateSourceBodySchema>;

// ============================================================================
// GENERIC PAYMENT SCHEMAS
// ============================================================================

/**
 * Generic create payment intent request
 */
export const createPaymentIntentSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.default('USD'),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

/**
 * Generic withdrawal request
 */
export const withdrawalRequestSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.default('USD'),
  description: z.string().max(255).optional(),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
