/**
 * Payment Provider Implementation Tests
 *
 * Tests for all 5 provider implementations (Stripe, PayPal, Paystack, PayMongo, Xendit).
 * Covers: country/currency support, payment method routing, payment creation,
 * transfer creation, webhook verification, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS
// ============================================================================

const { mockLoggerObj } = vi.hoisted(() => ({
  mockLoggerObj: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/Documents/bestball-site/lib/logger/serverLogger', () => ({
  serverLogger: mockLoggerObj,
}));

vi.mock('@/Documents/bestball-site/lib/clientLogger', () => ({
  createScopedLogger: vi.fn(() => mockLoggerObj),
  logger: mockLoggerObj,
}));

// Mock Stripe dependencies
const mockCreatePaymentIntent = vi.fn();
const mockCreatePayout = vi.fn();
const mockCreateTransaction = vi.fn();
const mockValidateAmount = vi.fn();

vi.mock('@/Documents/bestball-site/lib/stripe/stripeService', () => ({
  createPaymentIntent: mockCreatePaymentIntent,
  createPayout: mockCreatePayout,
  createTransaction: mockCreateTransaction,
}));

vi.mock('@/Documents/bestball-site/lib/stripe/currencyConfig', () => ({
  getCurrencyConfig: vi.fn(),
  validateAmount: mockValidateAmount,
}));

// Mock PayPal dependencies
const mockCreatePayPalOrder = vi.fn();
const mockCapturePayPalOrder = vi.fn();
const mockIsPayPalEnabled = vi.fn();
const mockGetPayPalOrder = vi.fn();

vi.mock('@/Documents/bestball-site/lib/paypal', () => ({
  createPayPalOrder: mockCreatePayPalOrder,
  capturePayPalOrder: mockCapturePayPalOrder,
  isPayPalEnabled: mockIsPayPalEnabled,
  verifyPayPalWebhookSignature: vi.fn(),
  getPayPalOrder: mockGetPayPalOrder,
  PAYPAL_DEPOSIT_LIMITS: { minAmountCents: 500, maxAmountCents: 1000000 },
}));

// Mock Paystack dependencies
const mockInitializeTransaction = vi.fn();
const mockVerifyTransaction = vi.fn();
const mockInitiateTransfer = vi.fn();
const mockCreatePaystackTransaction = vi.fn();
const mockVerifyPaystackWebhookSignature = vi.fn();
const mockGeneratePaystackReference = vi.fn();

vi.mock('@/Documents/bestball-site/lib/paystack/paystackService', () => ({
  initializeTransaction: mockInitializeTransaction,
  verifyTransaction: mockVerifyTransaction,
  initiateTransfer: mockInitiateTransfer,
  createPaystackTransaction: mockCreatePaystackTransaction,
  verifyWebhookSignature: mockVerifyPaystackWebhookSignature,
  generateReference: mockGeneratePaystackReference,
}));

vi.mock('@/Documents/bestball-site/lib/paystack/currencyConfig', () => ({
  isPaystackCurrency: vi.fn((c: string) => ['NGN', 'GHS', 'ZAR', 'KES'].includes(c)),
  validatePaystackAmount: vi.fn(() => ({ isValid: true })),
}));

vi.mock('@/Documents/bestball-site/lib/envHelpers', () => ({
  requireAppUrl: vi.fn(() => 'https://topdog.studio'),
  requireBaseUrl: vi.fn(() => 'https://topdog.studio'),
}));

// Mock PayMongo dependencies
const mockCreateSource = vi.fn();
const mockCreatePayMongoPayment = vi.fn();
const mockCreatePayMongoPayout = vi.fn();
const mockVerifyPayMongoPayment = vi.fn();
const mockVerifyPayMongoWebhook = vi.fn();
const mockCreatePayMongoTx = vi.fn();
const mockGetSavedBankAccounts = vi.fn();
const mockGeneratePayMongoRef = vi.fn();

vi.mock('@/Documents/bestball-site/lib/paymongo', () => ({
  createSource: mockCreateSource,
  createPayment: mockCreatePayMongoPayment,
  createPayout: mockCreatePayMongoPayout,
  verifyPayment: mockVerifyPayMongoPayment,
  verifyWebhookSignature: mockVerifyPayMongoWebhook,
  createPayMongoTransaction: mockCreatePayMongoTx,
  getSavedBankAccounts: mockGetSavedBankAccounts,
  generateReference: mockGeneratePayMongoRef,
}));

vi.mock('@/Documents/bestball-site/lib/paymongo/currencyConfig', () => ({
  toDisplayAmount: vi.fn((a: number) => a / 100),
}));

// Mock Xendit dependencies
const mockCreateVA = vi.fn();
const mockCreateEWallet = vi.fn();
const mockCreateDisbursement = vi.fn();
const mockVerifyWebhookToken = vi.fn();
const mockCreateXenditTx = vi.fn();
const mockGetSavedDisbursementAccounts = vi.fn();
const mockGenerateXenditRef = vi.fn();
const mockMapXenditStatus = vi.fn();
const mockGetEWalletCharge = vi.fn();

vi.mock('@/Documents/bestball-site/lib/xendit', () => ({
  createVirtualAccount: mockCreateVA,
  createEWalletCharge: mockCreateEWallet,
  createDisbursement: mockCreateDisbursement,
  verifyWebhookToken: mockVerifyWebhookToken,
  createXenditTransaction: mockCreateXenditTx,
  getSavedDisbursementAccounts: mockGetSavedDisbursementAccounts,
  generateReference: mockGenerateXenditRef,
  mapXenditStatus: mockMapXenditStatus,
  getEWalletCharge: mockGetEWalletCharge,
}));

// Mock Stripe constructor
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: { retrieve: vi.fn() },
      webhooks: { constructEvent: vi.fn() },
    })),
  };
});

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import { stripeProvider } from '@/Documents/bestball-site/lib/payments/providers/stripe';
import { paypalProvider } from '@/Documents/bestball-site/lib/payments/providers/paypal';
import { paystackProvider } from '@/Documents/bestball-site/lib/payments/providers/paystack';
import { paymongoProvider } from '@/Documents/bestball-site/lib/payments/providers/paymongo';
import { xenditProvider } from '@/Documents/bestball-site/lib/payments/providers/xendit';

// ============================================================================
// STRIPE PROVIDER
// ============================================================================

describe('Stripe Provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should have name "stripe"', () => {
    expect(stripeProvider.name).toBe('stripe');
  });

  it('should support global countries via wildcard', () => {
    expect(stripeProvider.getSupportedCountries()).toContain('*');
  });

  it('should support 25 currencies', () => {
    const currencies = stripeProvider.getSupportedCurrencies();
    expect(currencies.length).toBe(25);
    expect(currencies).toContain('USD');
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('GBP');
  });

  it('should return card method for any country', () => {
    const methods = stripeProvider.getPaymentMethodsForCountry('JP');
    expect(methods.some(m => m.id === 'card')).toBe(true);
  });

  it('should return Link for US only', () => {
    const usMethods = stripeProvider.getPaymentMethodsForCountry('US');
    const jpMethods = stripeProvider.getPaymentMethodsForCountry('JP');
    expect(usMethods.some(m => m.id === 'link')).toBe(true);
    expect(jpMethods.some(m => m.id === 'link')).toBe(false);
  });

  it('should create payment successfully', async () => {
    mockValidateAmount.mockReturnValue({ isValid: true });
    mockCreatePaymentIntent.mockResolvedValue({
      paymentIntentId: 'pi_123',
      clientSecret: 'cs_123',
      status: 'requires_payment_method',
    });
    mockCreateTransaction.mockResolvedValue({ id: 'tx_123' });

    const result = await stripeProvider.createPayment({
      amountSmallestUnit: 5000,
      currency: 'USD',
      userId: 'user_123',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('tx_123');
    expect(result.clientSecret).toBe('cs_123');
    expect(result.providerReference).toBe('pi_123');
  });

  it('should reject invalid amounts', async () => {
    mockValidateAmount.mockReturnValue({ isValid: false, error: 'Amount too low' });

    const result = await stripeProvider.createPayment({
      amountSmallestUnit: 10,
      currency: 'USD',
      userId: 'user_123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Amount too low');
  });

  it('should handle payment creation errors gracefully', async () => {
    mockValidateAmount.mockReturnValue({ isValid: true });
    mockCreatePaymentIntent.mockRejectedValue(new Error('Stripe API error'));

    const result = await stripeProvider.createPayment({
      amountSmallestUnit: 5000,
      currency: 'USD',
      userId: 'user_123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Stripe API error');
  });

  it('should create transfer and record negative amount for withdrawal', async () => {
    mockCreatePayout.mockResolvedValue({ payoutId: 'po_123', status: 'pending' });
    mockCreateTransaction.mockResolvedValue({ id: 'tx_456' });

    const result = await stripeProvider.createTransfer({
      amountSmallestUnit: 10000,
      currency: 'USD',
      userId: 'user_123',
      recipientId: 'acct_123',
    });

    expect(result.success).toBe(true);
    expect(result.providerTransferId).toBe('po_123');
    expect(mockCreateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: -10000, type: 'withdrawal' }),
    );
  });
});

// ============================================================================
// PAYPAL PROVIDER
// ============================================================================

describe('PayPal Provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should have name "paypal"', () => {
    expect(paypalProvider.name).toBe('paypal');
  });

  it('should support US only', () => {
    expect(paypalProvider.getSupportedCountries()).toEqual(['US']);
  });

  it('should support USD only', () => {
    expect(paypalProvider.getSupportedCurrencies()).toEqual(['USD']);
  });

  it('should return PayPal method for US when enabled', () => {
    mockIsPayPalEnabled.mockReturnValue(true);
    const methods = paypalProvider.getPaymentMethodsForCountry('US');
    expect(methods.length).toBe(1);
    expect(methods[0].id).toBe('paypal');
  });

  it('should return empty methods for US when PayPal disabled', () => {
    mockIsPayPalEnabled.mockReturnValue(false);
    const methods = paypalProvider.getPaymentMethodsForCountry('US');
    expect(methods.length).toBe(0);
  });

  it('should return empty methods for non-US countries', () => {
    mockIsPayPalEnabled.mockReturnValue(true);
    const methods = paypalProvider.getPaymentMethodsForCountry('GB');
    expect(methods.length).toBe(0);
  });

  it('should reject non-USD currency', async () => {
    const result = await paypalProvider.createPayment({
      amountSmallestUnit: 5000,
      currency: 'EUR',
      userId: 'user_123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('USD');
  });

  it('should reject amounts below minimum ($5)', async () => {
    const result = await paypalProvider.createPayment({
      amountSmallestUnit: 100, // $1 < $5 min
      currency: 'USD',
      userId: 'user_123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Minimum');
  });

  it('should reject amounts above maximum ($10,000)', async () => {
    const result = await paypalProvider.createPayment({
      amountSmallestUnit: 2000000, // $20,000 > $10,000 max
      currency: 'USD',
      userId: 'user_123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum');
  });

  it('should create PayPal order successfully', async () => {
    mockCreatePayPalOrder.mockResolvedValue({
      orderId: 'order_123',
      approvalUrl: 'https://paypal.com/approve/order_123',
    });

    const result = await paypalProvider.createPayment({
      amountSmallestUnit: 5000,
      currency: 'USD',
      userId: 'user_123',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('order_123');
    expect(result.authorizationUrl).toContain('paypal.com');
    expect(result.status).toBe('pending');
  });

  it('should verify payment status mapping', async () => {
    mockGetPayPalOrder.mockResolvedValue({ status: 'COMPLETED' });
    const result = await paypalProvider.verifyPayment('order_123');
    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
  });

  it('should map APPROVED status to requires_action', async () => {
    mockGetPayPalOrder.mockResolvedValue({ status: 'APPROVED' });
    const result = await paypalProvider.verifyPayment('order_123');
    expect(result.success).toBe(false);
    expect(result.status).toBe('requires_action');
  });

  it('should map VOIDED status to cancelled', async () => {
    mockGetPayPalOrder.mockResolvedValue({ status: 'VOIDED' });
    const result = await paypalProvider.verifyPayment('order_123');
    expect(result.status).toBe('cancelled');
  });

  it('should return error for createTransfer (use withdrawal API)', async () => {
    const result = await paypalProvider.createTransfer({
      amountSmallestUnit: 5000,
      currency: 'USD',
      userId: 'user_123',
      recipientId: 'rcpt_123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('withdrawal API');
  });
});

// ============================================================================
// PAYSTACK PROVIDER
// ============================================================================

describe('Paystack Provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should have name "paystack"', () => {
    expect(paystackProvider.name).toBe('paystack');
  });

  it('should support NG, GH, ZA, KE', () => {
    const countries = paystackProvider.getSupportedCountries();
    expect(countries).toContain('NG');
    expect(countries).toContain('GH');
    expect(countries).toContain('ZA');
    expect(countries).toContain('KE');
  });

  it('should support 4 African currencies', () => {
    expect(paystackProvider.getSupportedCurrencies()).toEqual(['NGN', 'GHS', 'ZAR', 'KES']);
  });

  it('should filter payment methods by country', () => {
    const ngMethods = paystackProvider.getPaymentMethodsForCountry('NG');
    const ghMethods = paystackProvider.getPaymentMethodsForCountry('GH');
    expect(ngMethods.every(m => m.countries.includes('NG'))).toBe(true);
    expect(ghMethods.every(m => m.countries.includes('GH'))).toBe(true);
    expect(ngMethods.length).toBeGreaterThan(ghMethods.length); // NG has more methods
  });

  it('should create payment with authorization URL', async () => {
    mockGeneratePaystackReference.mockReturnValue('TD_REF_123');
    mockInitializeTransaction.mockResolvedValue({
      accessCode: 'access_123',
      authorizationUrl: 'https://checkout.paystack.com/access_123',
    });
    mockCreatePaystackTransaction.mockResolvedValue({ id: 'tx_ps_123' });

    const result = await paystackProvider.createPayment({
      amountSmallestUnit: 100000, // 1000 NGN
      currency: 'NGN',
      userId: 'user_123',
      email: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('tx_ps_123');
    expect(result.authorizationUrl).toContain('paystack.com');
    expect(result.clientSecret).toBe('access_123');
  });

  it('should select correct channel for USSD payment', async () => {
    mockGeneratePaystackReference.mockReturnValue('TD_REF_456');
    mockInitializeTransaction.mockResolvedValue({
      accessCode: 'access_456',
      authorizationUrl: 'https://checkout.paystack.com/access_456',
    });
    mockCreatePaystackTransaction.mockResolvedValue({ id: 'tx_ps_456' });

    await paystackProvider.createPayment({
      amountSmallestUnit: 50000,
      currency: 'NGN',
      userId: 'user_123',
      email: 'test@example.com',
      paymentMethodType: 'paystack_ussd_ng',
    });

    expect(mockInitializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ channels: ['ussd'] }),
    );
  });

  it('should delegate webhook verification', () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    expect(paystackProvider.verifyWebhookSignature('payload', 'sig')).toBe(true);
    expect(mockVerifyPaystackWebhookSignature).toHaveBeenCalledWith('payload', 'sig');
  });

  it('should create transfer with status mapping', async () => {
    mockCreatePaystackTransaction.mockResolvedValue({ id: 'tx_trf_123' });
    mockGeneratePaystackReference.mockReturnValue('TRF_REF_123');
    mockInitiateTransfer.mockResolvedValue({
      transferCode: 'TRF_abc',
      status: 'success',
    });

    const result = await paystackProvider.createTransfer({
      amountSmallestUnit: 50000,
      currency: 'NGN',
      userId: 'user_123',
      recipientId: 'RCP_abc',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.providerTransferId).toBe('TRF_abc');
  });

  it('should map failed transfer status', async () => {
    mockCreatePaystackTransaction.mockResolvedValue({ id: 'tx_trf_fail' });
    mockGeneratePaystackReference.mockReturnValue('TRF_FAIL');
    mockInitiateTransfer.mockResolvedValue({ transferCode: 'TRF_fail', status: 'failed' });

    const result = await paystackProvider.createTransfer({
      amountSmallestUnit: 50000,
      currency: 'NGN',
      userId: 'user_123',
      recipientId: 'RCP_abc',
    });

    expect(result.status).toBe('failed');
  });
});

// ============================================================================
// PAYMONGO PROVIDER
// ============================================================================

describe('PayMongo Provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should have name "paymongo"', () => {
    expect(paymongoProvider.name).toBe('paymongo');
  });

  it('should support PH only', () => {
    expect(paymongoProvider.getSupportedCountries()).toEqual(['PH']);
  });

  it('should support PHP only', () => {
    expect(paymongoProvider.getSupportedCurrencies()).toEqual(['PHP']);
  });

  it('should return methods for PH', () => {
    const methods = paymongoProvider.getPaymentMethodsForCountry('PH');
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.some(m => m.id === 'paymongo_gcash')).toBe(true);
  });

  it('should return empty for non-PH', () => {
    expect(paymongoProvider.getPaymentMethodsForCountry('US')).toEqual([]);
  });

  it('should create GCash payment with redirect URL', async () => {
    mockGeneratePayMongoRef.mockReturnValue('DEP_123');
    mockCreateSource.mockResolvedValue({
      sourceId: 'src_123',
      checkoutUrl: 'https://paymongo.com/checkout/src_123',
    });
    mockCreatePayMongoTx.mockResolvedValue({ id: 'tx_pm_123' });

    const result = await paymongoProvider.createPayment({
      amountSmallestUnit: 500000, // 5000 PHP
      currency: 'PHP',
      userId: 'user_123',
      paymentMethodType: 'gcash',
    });

    expect(result.success).toBe(true);
    expect(result.authorizationUrl).toContain('paymongo.com');
    expect(result.status).toBe('pending');
  });

  it('should reject unsupported payment method', async () => {
    const result = await paymongoProvider.createPayment({
      amountSmallestUnit: 100000,
      currency: 'PHP',
      userId: 'user_123',
      paymentMethodType: 'bitcoin', // not supported
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported');
  });

  it('should create transfer with saved bank account', async () => {
    mockGetSavedBankAccounts.mockResolvedValue([
      {
        id: 'ba_123',
        bankCode: 'BDO',
        accountNumber: '1234567890',
        accountHolderName: 'Test',
        accountNumberMasked: '****7890',
      },
    ]);
    mockGeneratePayMongoRef.mockReturnValue('WTH_123');
    mockCreatePayMongoPayout.mockResolvedValue({ payoutId: 'pay_123' });
    mockCreatePayMongoTx.mockResolvedValue({ id: 'tx_pm_w123' });

    const result = await paymongoProvider.createTransfer({
      amountSmallestUnit: 200000,
      currency: 'PHP',
      userId: 'user_123',
      recipientId: 'ba_123',
    });

    expect(result.success).toBe(true);
    expect(result.providerTransferId).toBe('pay_123');
  });

  it('should reject transfer with unknown bank account', async () => {
    mockGetSavedBankAccounts.mockResolvedValue([]);

    const result = await paymongoProvider.createTransfer({
      amountSmallestUnit: 200000,
      currency: 'PHP',
      userId: 'user_123',
      recipientId: 'ba_nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should delegate webhook verification', () => {
    mockVerifyPayMongoWebhook.mockReturnValue(true);
    expect(paymongoProvider.verifyWebhookSignature('payload', 'sig')).toBe(true);
  });
});

// ============================================================================
// XENDIT PROVIDER
// ============================================================================

describe('Xendit Provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should have name "xendit"', () => {
    expect(xenditProvider.name).toBe('xendit');
  });

  it('should support ID only', () => {
    expect(xenditProvider.getSupportedCountries()).toEqual(['ID']);
  });

  it('should support IDR only', () => {
    expect(xenditProvider.getSupportedCurrencies()).toEqual(['IDR']);
  });

  it('should return methods for Indonesia', () => {
    const methods = xenditProvider.getPaymentMethodsForCountry('ID');
    expect(methods.length).toBe(12); // 5 VA + 5 e-wallets + 2 retail
  });

  it('should return empty for non-ID', () => {
    expect(xenditProvider.getPaymentMethodsForCountry('US')).toEqual([]);
  });

  it('should create Virtual Account payment for BCA', async () => {
    mockGenerateXenditRef.mockReturnValue('DEP_XEN_123');
    mockCreateVA.mockResolvedValue({
      virtualAccountId: 'va_123',
      accountNumber: '8800123456789',
      bankCode: 'BCA',
    });
    mockCreateXenditTx.mockResolvedValue({ id: 'tx_xen_123' });

    const result = await xenditProvider.createPayment({
      amountSmallestUnit: 500000,
      currency: 'IDR',
      userId: 'user_123',
      paymentMethodType: 'xendit_va_bca',
    });

    expect(result.success).toBe(true);
    expect(result.virtualAccountNumber).toBe('8800123456789');
    expect(result.virtualAccountBank).toBe('BCA');
    expect(result.status).toBe('pending');
  });

  it('should create E-Wallet payment for OVO', async () => {
    mockGenerateXenditRef.mockReturnValue('DEP_XEN_456');
    mockCreateEWallet.mockResolvedValue({
      chargeId: 'ewc_123',
      checkoutUrl: 'https://xendit.co/ewallet/ewc_123',
    });
    mockCreateXenditTx.mockResolvedValue({ id: 'tx_xen_456' });

    const result = await xenditProvider.createPayment({
      amountSmallestUnit: 100000,
      currency: 'IDR',
      userId: 'user_123',
      paymentMethodType: 'xendit_ovo',
      phone: '081234567890',
    });

    expect(result.success).toBe(true);
    expect(result.authorizationUrl).toContain('xendit.co');
  });

  it('should reject unsupported payment method', async () => {
    const result = await xenditProvider.createPayment({
      amountSmallestUnit: 100000,
      currency: 'IDR',
      userId: 'user_123',
      paymentMethodType: 'credit_card', // not supported by Xendit
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported');
  });

  it('should verify e-wallet charge via API', async () => {
    mockGetEWalletCharge.mockResolvedValue({ status: 'SUCCEEDED' });
    mockMapXenditStatus.mockReturnValue('completed');

    const result = await xenditProvider.verifyPayment('ewc_123');
    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
  });

  it('should create disbursement for withdrawal', async () => {
    mockGetSavedDisbursementAccounts.mockResolvedValue([
      {
        id: 'da_123',
        channelCode: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Test',
        accountNumberMasked: '****7890',
      },
    ]);
    mockGenerateXenditRef.mockReturnValue('DIS_123');
    mockCreateDisbursement.mockResolvedValue({ disbursementId: 'disb_123' });
    mockCreateXenditTx.mockResolvedValue({ id: 'tx_xen_w123' });

    const result = await xenditProvider.createTransfer({
      amountSmallestUnit: 500000,
      currency: 'IDR',
      userId: 'user_123',
      recipientId: 'da_123',
    });

    expect(result.success).toBe(true);
    expect(result.providerTransferId).toBe('disb_123');
  });

  it('should reject disbursement with unknown account', async () => {
    mockGetSavedDisbursementAccounts.mockResolvedValue([]);

    const result = await xenditProvider.createTransfer({
      amountSmallestUnit: 500000,
      currency: 'IDR',
      userId: 'user_123',
      recipientId: 'da_nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should delegate webhook verification to token check', () => {
    mockVerifyWebhookToken.mockReturnValue(true);
    expect(xenditProvider.verifyWebhookSignature('payload', 'token_123')).toBe(true);
    expect(mockVerifyWebhookToken).toHaveBeenCalledWith('token_123');
  });
});
