/**
 * Payment Types & Helper Functions Tests
 *
 * Tests for the unified payment types module: country helpers,
 * currency mapping, payment method routing, and provider selection.
 */

import { describe, it, expect } from 'vitest';

import {
  PAYSTACK_COUNTRIES,
  PAYMONGO_COUNTRIES,
  XENDIT_COUNTRIES,
  COUNTRY_CURRENCY_MAP,
  STRIPE_PAYMENT_METHODS,
  PAYSTACK_PAYMENT_METHODS,
  PAYMONGO_PAYMENT_METHODS,
  XENDIT_PAYMENT_METHODS,
  isPaystackCountry,
  isPayMongoCountry,
  isXenditCountry,
  getCurrencyForCountry,
  getPaymentMethodsForCountry,
  getProviderForCountry,
} from '@/Documents/bestball-site/lib/payments/types';

// ============================================================================
// Country Detection Helpers
// ============================================================================

describe('isPaystackCountry', () => {
  it('should return true for supported Paystack countries', () => {
    expect(isPaystackCountry('NG')).toBe(true);
    expect(isPaystackCountry('GH')).toBe(true);
    expect(isPaystackCountry('ZA')).toBe(true);
    expect(isPaystackCountry('KE')).toBe(true);
  });

  it('should return false for non-Paystack countries', () => {
    expect(isPaystackCountry('US')).toBe(false);
    expect(isPaystackCountry('PH')).toBe(false);
    expect(isPaystackCountry('ID')).toBe(false);
    expect(isPaystackCountry('')).toBe(false);
    expect(isPaystackCountry('XX')).toBe(false);
  });
});

describe('isPayMongoCountry', () => {
  it('should return true for PH (Philippines)', () => {
    expect(isPayMongoCountry('PH')).toBe(true);
  });

  it('should return false for all other countries', () => {
    expect(isPayMongoCountry('US')).toBe(false);
    expect(isPayMongoCountry('NG')).toBe(false);
    expect(isPayMongoCountry('ID')).toBe(false);
  });
});

describe('isXenditCountry', () => {
  it('should return true for ID (Indonesia)', () => {
    expect(isXenditCountry('ID')).toBe(true);
  });

  it('should return false for all other countries', () => {
    expect(isXenditCountry('US')).toBe(false);
    expect(isXenditCountry('PH')).toBe(false);
    expect(isXenditCountry('NG')).toBe(false);
  });
});

// ============================================================================
// Currency Mapping
// ============================================================================

describe('getCurrencyForCountry', () => {
  it('should return correct currency for Paystack countries', () => {
    expect(getCurrencyForCountry('NG')).toBe('NGN');
    expect(getCurrencyForCountry('GH')).toBe('GHS');
    expect(getCurrencyForCountry('ZA')).toBe('ZAR');
    expect(getCurrencyForCountry('KE')).toBe('KES');
  });

  it('should return correct currency for PayMongo country', () => {
    expect(getCurrencyForCountry('PH')).toBe('PHP');
  });

  it('should return correct currency for Xendit country', () => {
    expect(getCurrencyForCountry('ID')).toBe('IDR');
  });

  it('should return correct currency for Stripe countries', () => {
    expect(getCurrencyForCountry('US')).toBe('USD');
    expect(getCurrencyForCountry('GB')).toBe('GBP');
    expect(getCurrencyForCountry('DE')).toBe('EUR');
    expect(getCurrencyForCountry('FR')).toBe('EUR');
    expect(getCurrencyForCountry('CA')).toBe('CAD');
    expect(getCurrencyForCountry('AU')).toBe('AUD');
  });

  it('should fall back to USD for unknown countries', () => {
    expect(getCurrencyForCountry('XX')).toBe('USD');
    expect(getCurrencyForCountry('ZZ')).toBe('USD');
    expect(getCurrencyForCountry('')).toBe('USD');
  });
});

// ============================================================================
// Provider Routing
// ============================================================================

describe('getProviderForCountry', () => {
  it('should route Paystack countries to paystack', () => {
    expect(getProviderForCountry('NG')).toBe('paystack');
    expect(getProviderForCountry('GH')).toBe('paystack');
    expect(getProviderForCountry('ZA')).toBe('paystack');
    expect(getProviderForCountry('KE')).toBe('paystack');
  });

  it('should route Philippines to paymongo', () => {
    expect(getProviderForCountry('PH')).toBe('paymongo');
  });

  it('should route Indonesia to xendit', () => {
    expect(getProviderForCountry('ID')).toBe('xendit');
  });

  it('should route all other countries to stripe', () => {
    expect(getProviderForCountry('US')).toBe('stripe');
    expect(getProviderForCountry('GB')).toBe('stripe');
    expect(getProviderForCountry('JP')).toBe('stripe');
    expect(getProviderForCountry('XX')).toBe('stripe');
  });
});

// ============================================================================
// Payment Method Routing
// ============================================================================

describe('getPaymentMethodsForCountry', () => {
  it('should return Paystack methods for Nigeria', () => {
    const methods = getPaymentMethodsForCountry('NG');
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every(m => m.provider === 'paystack')).toBe(true);
    expect(methods.every(m => m.countries.includes('NG'))).toBe(true);
    // Nigeria should have card, bank_transfer, USSD
    const categories = methods.map(m => m.category);
    expect(categories).toContain('card');
    expect(categories).toContain('ussd');
  });

  it('should return Paystack methods for Ghana with mobile money', () => {
    const methods = getPaymentMethodsForCountry('GH');
    expect(methods.length).toBeGreaterThan(0);
    const categories = methods.map(m => m.category);
    expect(categories).toContain('mobile_money');
  });

  it('should return Paystack methods for Kenya with M-Pesa', () => {
    const methods = getPaymentMethodsForCountry('KE');
    const mpesa = methods.find(m => m.id.includes('mpesa'));
    expect(mpesa).toBeDefined();
    expect(mpesa?.category).toBe('mobile_money');
  });

  it('should return PayMongo methods for Philippines', () => {
    const methods = getPaymentMethodsForCountry('PH');
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every(m => m.provider === 'paymongo')).toBe(true);
    // Should include GCash, Maya, GrabPay
    const ids = methods.map(m => m.id);
    expect(ids).toContain('paymongo_gcash');
    expect(ids).toContain('paymongo_maya');
    expect(ids).toContain('paymongo_grabpay');
  });

  it('should return Xendit methods for Indonesia', () => {
    const methods = getPaymentMethodsForCountry('ID');
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every(m => m.provider === 'xendit')).toBe(true);
    // Should include virtual accounts and e-wallets
    const categories = methods.map(m => m.category);
    expect(categories).toContain('virtual_account');
    expect(categories).toContain('ewallet');
  });

  it('should return Stripe methods for US', () => {
    const methods = getPaymentMethodsForCountry('US');
    expect(methods.length).toBeGreaterThan(0);
    // Stripe has global ('*') methods
    expect(methods.some(m => m.provider === 'stripe')).toBe(true);
    // US should have card and Link
    const ids = methods.map(m => m.id);
    expect(ids).toContain('card');
    expect(ids).toContain('link');
  });

  it('should return Stripe global methods for unknown countries', () => {
    const methods = getPaymentMethodsForCountry('XX');
    expect(methods.length).toBeGreaterThan(0);
    // Should have card (global)
    expect(methods.some(m => m.id === 'card')).toBe(true);
  });
});

// ============================================================================
// Payment Method Data Integrity
// ============================================================================

describe('Payment method data integrity', () => {
  const allMethods = [
    ...STRIPE_PAYMENT_METHODS,
    ...PAYSTACK_PAYMENT_METHODS,
    ...PAYMONGO_PAYMENT_METHODS,
    ...XENDIT_PAYMENT_METHODS,
  ];

  it('every payment method should have a non-empty id', () => {
    allMethods.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(typeof m.id).toBe('string');
    });
  });

  it('every payment method should have a valid provider', () => {
    const validProviders = ['stripe', 'paystack', 'paymongo', 'xendit', 'paypal'];
    allMethods.forEach(m => {
      expect(validProviders).toContain(m.provider);
    });
  });

  it('every payment method should have at least one country', () => {
    allMethods.forEach(m => {
      expect(m.countries.length).toBeGreaterThan(0);
    });
  });

  it('every payment method should have at least one currency', () => {
    allMethods.forEach(m => {
      expect(m.currencies.length).toBeGreaterThan(0);
    });
  });

  it('async methods should include non-card categories', () => {
    const asyncMethods = allMethods.filter(m => m.isAsync);
    asyncMethods.forEach(m => {
      expect(m.category).not.toBe('card'); // Cards are never async
    });
  });

  it('Xendit should have 12 payment methods (5 VA + 5 e-wallets + 2 retail)', () => {
    expect(XENDIT_PAYMENT_METHODS.length).toBe(12);
  });
});

// ============================================================================
// Constants Validation
// ============================================================================

describe('Country constants', () => {
  it('PAYSTACK_COUNTRIES should contain exactly 4 countries', () => {
    expect(PAYSTACK_COUNTRIES).toEqual(['NG', 'GH', 'ZA', 'KE']);
  });

  it('PAYMONGO_COUNTRIES should contain only PH', () => {
    expect(PAYMONGO_COUNTRIES).toEqual(['PH']);
  });

  it('XENDIT_COUNTRIES should contain only ID', () => {
    expect(XENDIT_COUNTRIES).toEqual(['ID']);
  });

  it('COUNTRY_CURRENCY_MAP should have a DEFAULT fallback', () => {
    expect(COUNTRY_CURRENCY_MAP['DEFAULT']).toBe('USD');
  });
});
