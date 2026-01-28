/**
 * Paystack Currency Configuration Unit Tests
 *
 * Tests for currency formatting, conversion, validation, and fee calculations.
 * Critical for payment processing accuracy.
 *
 * @module __tests__/lib/paystack/currencyConfig
 */

import { describe, it, expect } from '@jest/globals';
import {
  PAYSTACK_CURRENCIES,
  COUNTRY_TO_CURRENCY,
  CURRENCY_TO_COUNTRY,
  getPaystackCurrencyConfig,
  getCurrencyForPaystackCountry,
  isPaystackCurrency,
  toSmallestUnit,
  toDisplayAmount,
  formatPaystackAmount,
  formatSmallestUnit,
  validatePaystackAmount,
  calculateTransferFee,
  validateTransferFee,
  calculateTransactionFee,
  getQuickDepositAmounts,
  getQuickWithdrawalAmounts,
} from '../../../lib/paystack/currencyConfig';

describe('Paystack Currency Configuration', () => {
  // ===========================================================================
  // CURRENCY CONFIGURATIONS
  // ===========================================================================

  describe('PAYSTACK_CURRENCIES', () => {
    it('should have NGN configuration', () => {
      const ngn = PAYSTACK_CURRENCIES['NGN'];
      expect(ngn).toBeDefined();
      expect(ngn.code).toBe('NGN');
      expect(ngn.symbol).toBe('₦');
      expect(ngn.factor).toBe(100);
      expect(ngn.smallestUnit).toBe('kobo');
    });

    it('should have GHS configuration', () => {
      const ghs = PAYSTACK_CURRENCIES['GHS'];
      expect(ghs).toBeDefined();
      expect(ghs.code).toBe('GHS');
      expect(ghs.symbol).toBe('GH₵');
      expect(ghs.factor).toBe(100);
      expect(ghs.smallestUnit).toBe('pesewas');
    });

    it('should have ZAR configuration', () => {
      const zar = PAYSTACK_CURRENCIES['ZAR'];
      expect(zar).toBeDefined();
      expect(zar.code).toBe('ZAR');
      expect(zar.symbol).toBe('R');
      expect(zar.factor).toBe(100);
      expect(zar.smallestUnit).toBe('cents');
    });

    it('should have KES configuration', () => {
      const kes = PAYSTACK_CURRENCIES['KES'];
      expect(kes).toBeDefined();
      expect(kes.code).toBe('KES');
      expect(kes.symbol).toBe('KSh');
      expect(kes.factor).toBe(100);
      expect(kes.smallestUnit).toBe('cents');
    });
  });

  // ===========================================================================
  // CURRENCY LOOKUP
  // ===========================================================================

  describe('getPaystackCurrencyConfig', () => {
    it('should return config for valid currency', () => {
      const config = getPaystackCurrencyConfig('NGN');
      expect(config.code).toBe('NGN');
    });

    it('should be case-insensitive', () => {
      const config1 = getPaystackCurrencyConfig('ngn');
      const config2 = getPaystackCurrencyConfig('NGN');
      expect(config1.code).toBe(config2.code);
    });

    it('should throw for unsupported currency', () => {
      expect(() => getPaystackCurrencyConfig('USD')).toThrow('Unsupported Paystack currency');
      expect(() => getPaystackCurrencyConfig('EUR')).toThrow('Unsupported Paystack currency');
    });
  });

  describe('getCurrencyForPaystackCountry', () => {
    it('should return NGN for Nigeria', () => {
      expect(getCurrencyForPaystackCountry('NG')).toBe('NGN');
    });

    it('should return GHS for Ghana', () => {
      expect(getCurrencyForPaystackCountry('GH')).toBe('GHS');
    });

    it('should return ZAR for South Africa', () => {
      expect(getCurrencyForPaystackCountry('ZA')).toBe('ZAR');
    });

    it('should return KES for Kenya', () => {
      expect(getCurrencyForPaystackCountry('KE')).toBe('KES');
    });

    it('should be case-insensitive', () => {
      expect(getCurrencyForPaystackCountry('ng')).toBe('NGN');
    });

    it('should throw for unsupported country', () => {
      expect(() => getCurrencyForPaystackCountry('US')).toThrow('No Paystack currency for country');
    });
  });

  describe('isPaystackCurrency', () => {
    it('should return true for supported currencies', () => {
      expect(isPaystackCurrency('NGN')).toBe(true);
      expect(isPaystackCurrency('GHS')).toBe(true);
      expect(isPaystackCurrency('ZAR')).toBe(true);
      expect(isPaystackCurrency('KES')).toBe(true);
    });

    it('should return false for unsupported currencies', () => {
      expect(isPaystackCurrency('USD')).toBe(false);
      expect(isPaystackCurrency('EUR')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isPaystackCurrency('ngn')).toBe(true);
    });
  });

  // ===========================================================================
  // AMOUNT CONVERSION
  // ===========================================================================

  describe('toSmallestUnit', () => {
    it('should convert NGN display amount to kobo', () => {
      expect(toSmallestUnit(100, 'NGN')).toBe(10000);
      expect(toSmallestUnit(100.50, 'NGN')).toBe(10050);
      expect(toSmallestUnit(1, 'NGN')).toBe(100);
    });

    it('should convert GHS display amount to pesewas', () => {
      expect(toSmallestUnit(10, 'GHS')).toBe(1000);
      expect(toSmallestUnit(10.50, 'GHS')).toBe(1050);
    });

    it('should convert ZAR display amount to cents', () => {
      expect(toSmallestUnit(50, 'ZAR')).toBe(5000);
      expect(toSmallestUnit(50.99, 'ZAR')).toBe(5099);
    });

    it('should convert KES display amount to cents', () => {
      expect(toSmallestUnit(100, 'KES')).toBe(10000);
    });

    it('should handle decimal precision correctly', () => {
      // 100.005 should round to 10001 (banker's rounding)
      expect(toSmallestUnit(100.005, 'NGN')).toBe(10001);
    });
  });

  describe('toDisplayAmount', () => {
    it('should convert kobo to NGN display amount', () => {
      expect(toDisplayAmount(10000, 'NGN')).toBe(100);
      expect(toDisplayAmount(10050, 'NGN')).toBe(100.50);
      expect(toDisplayAmount(100, 'NGN')).toBe(1);
    });

    it('should convert pesewas to GHS display amount', () => {
      expect(toDisplayAmount(1000, 'GHS')).toBe(10);
    });

    it('should convert cents to ZAR display amount', () => {
      expect(toDisplayAmount(5000, 'ZAR')).toBe(50);
    });

    it('should convert cents to KES display amount', () => {
      expect(toDisplayAmount(10000, 'KES')).toBe(100);
    });
  });

  describe('formatPaystackAmount', () => {
    it('should format NGN with symbol', () => {
      expect(formatPaystackAmount(10050, 'NGN')).toBe('₦100.50');
    });

    it('should format GHS with symbol', () => {
      expect(formatPaystackAmount(1050, 'GHS')).toBe('GH₵10.50');
    });

    it('should format ZAR with symbol', () => {
      expect(formatPaystackAmount(5099, 'ZAR')).toBe('R50.99');
    });

    it('should format KES with symbol', () => {
      expect(formatPaystackAmount(10000, 'KES')).toBe('KSh100.00');
    });

    it('should format without symbol when specified', () => {
      expect(formatPaystackAmount(10000, 'NGN', { showSymbol: false })).toBe('100.00');
    });

    it('should add currency code when specified', () => {
      expect(formatPaystackAmount(10000, 'NGN', { showCode: true })).toBe('₦100.00 NGN');
    });

    it('should handle custom decimal places', () => {
      expect(formatPaystackAmount(10000, 'NGN', { decimals: 0 })).toBe('₦100');
    });

    it('should format large amounts with thousands separators', () => {
      expect(formatPaystackAmount(100000000, 'NGN')).toBe('₦1,000,000.00');
    });
  });

  describe('formatSmallestUnit', () => {
    it('should format NGN in kobo', () => {
      expect(formatSmallestUnit(10000, 'NGN')).toBe('10,000 kobo');
    });

    it('should format GHS in pesewas', () => {
      expect(formatSmallestUnit(1000, 'GHS')).toBe('1,000 pesewas');
    });

    it('should format ZAR in cents', () => {
      expect(formatSmallestUnit(5000, 'ZAR')).toBe('5,000 cents');
    });
  });

  // ===========================================================================
  // AMOUNT VALIDATION
  // ===========================================================================

  describe('validatePaystackAmount', () => {
    describe('NGN validation', () => {
      it('should accept valid NGN amounts', () => {
        const result = validatePaystackAmount(50000, 'NGN'); // ₦500
        expect(result.isValid).toBe(true);
      });

      it('should reject amounts below minimum', () => {
        const result = validatePaystackAmount(5000, 'NGN'); // ₦50 (min is ₦100)
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Minimum');
      });

      it('should reject amounts above maximum', () => {
        const result = validatePaystackAmount(200000000, 'NGN'); // ₦2,000,000 (max is ₦1,000,000)
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Maximum');
      });

      it('should reject non-integer amounts', () => {
        const result = validatePaystackAmount(10000.5, 'NGN');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('whole number');
      });
    });

    describe('GHS validation', () => {
      it('should accept valid GHS amounts', () => {
        const result = validatePaystackAmount(500, 'GHS'); // GH₵5
        expect(result.isValid).toBe(true);
      });

      it('should reject amounts below minimum', () => {
        const result = validatePaystackAmount(50, 'GHS'); // GH₵0.50 (min is GH₵1)
        expect(result.isValid).toBe(false);
      });
    });

    describe('ZAR validation', () => {
      it('should accept valid ZAR amounts', () => {
        const result = validatePaystackAmount(1000, 'ZAR'); // R10
        expect(result.isValid).toBe(true);
      });

      it('should reject amounts below minimum', () => {
        const result = validatePaystackAmount(100, 'ZAR'); // R1 (min is R5)
        expect(result.isValid).toBe(false);
      });
    });

    describe('KES validation', () => {
      it('should accept valid KES amounts', () => {
        const result = validatePaystackAmount(5000, 'KES'); // KSh50
        expect(result.isValid).toBe(true);
      });

      it('should reject amounts below minimum', () => {
        const result = validatePaystackAmount(500, 'KES'); // KSh5 (min is KSh10)
        expect(result.isValid).toBe(false);
      });
    });

    it('should handle unsupported currency', () => {
      const result = validatePaystackAmount(10000, 'USD');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });
  });

  // ===========================================================================
  // TRANSFER FEE CALCULATIONS
  // ===========================================================================

  describe('calculateTransferFee', () => {
    describe('NGN transfer fees', () => {
      it('should calculate ₦10 for amounts ≤ ₦5,000', () => {
        expect(calculateTransferFee(500000, 'NGN')).toBe(1000); // ₦5,000 → ₦10 (1000 kobo)
        expect(calculateTransferFee(100000, 'NGN')).toBe(1000); // ₦1,000 → ₦10
      });

      it('should calculate ₦25 for amounts ₦5,001 - ₦50,000', () => {
        expect(calculateTransferFee(500100, 'NGN')).toBe(2500); // ₦5,001 → ₦25
        expect(calculateTransferFee(5000000, 'NGN')).toBe(2500); // ₦50,000 → ₦25
      });

      it('should calculate ₦50 for amounts > ₦50,000', () => {
        expect(calculateTransferFee(5000100, 'NGN')).toBe(5000); // ₦50,001 → ₦50
        expect(calculateTransferFee(10000000, 'NGN')).toBe(5000); // ₦100,000 → ₦50
      });
    });

    describe('GHS transfer fees', () => {
      it('should calculate GH₵1 for mobile money', () => {
        expect(calculateTransferFee(10000, 'GHS', 'mobile_money')).toBe(100);
      });

      it('should calculate GH₵8 for bank accounts', () => {
        expect(calculateTransferFee(10000, 'GHS', 'bank')).toBe(800);
      });
    });

    describe('ZAR transfer fees', () => {
      it('should calculate R3 flat fee', () => {
        expect(calculateTransferFee(5000, 'ZAR')).toBe(300);
        expect(calculateTransferFee(100000, 'ZAR')).toBe(300);
      });
    });

    describe('KES transfer fees', () => {
      it('should calculate KSh20 for ≤ KSh1,500', () => {
        expect(calculateTransferFee(150000, 'KES')).toBe(2000);
      });

      it('should calculate KSh40 for KSh1,501 - KSh20,000', () => {
        expect(calculateTransferFee(150100, 'KES')).toBe(4000);
        expect(calculateTransferFee(2000000, 'KES')).toBe(4000);
      });

      it('should calculate KSh60 for > KSh20,000', () => {
        expect(calculateTransferFee(2000100, 'KES')).toBe(6000);
      });
    });
  });

  describe('validateTransferFee', () => {
    it('should validate correct NGN fee', () => {
      const result = validateTransferFee(1000, 100000, 'NGN'); // ₦10 fee for ₦1,000 transfer
      expect(result.isValid).toBe(true);
    });

    it('should reject incorrect NGN fee', () => {
      const result = validateTransferFee(5000, 100000, 'NGN'); // ₦50 fee for ₦1,000 (should be ₦10)
      expect(result.isValid).toBe(false);
      expect(result.expectedRange).toEqual({ min: 1000, max: 1000 });
    });

    it('should allow 10% tolerance', () => {
      const result = validateTransferFee(1100, 100000, 'NGN'); // ₦11 for ₦1,000 (10% over ₦10)
      expect(result.isValid).toBe(true);
    });

    it('should validate GHS mobile money fee', () => {
      const result = validateTransferFee(100, 10000, 'GHS', 'mobile_money');
      expect(result.isValid).toBe(true);
    });

    it('should validate GHS bank fee', () => {
      const result = validateTransferFee(800, 10000, 'GHS', 'bank');
      expect(result.isValid).toBe(true);
    });
  });

  // ===========================================================================
  // TRANSACTION FEE CALCULATIONS
  // ===========================================================================

  describe('calculateTransactionFee', () => {
    describe('NGN transaction fees', () => {
      it('should calculate 1.5% for amounts < ₦2,500', () => {
        const fee = calculateTransactionFee(200000, 'NGN'); // ₦2,000
        expect(fee).toBe(3000); // 1.5% = ₦30 (3000 kobo)
      });

      it('should calculate 1.5% + ₦100 for amounts ≥ ₦2,500', () => {
        const fee = calculateTransactionFee(500000, 'NGN'); // ₦5,000
        // 1.5% of 500000 = 7500 + 10000 (₦100) = 17500
        expect(fee).toBe(17500);
      });

      it('should cap at ₦2,000', () => {
        const fee = calculateTransactionFee(50000000, 'NGN'); // ₦500,000
        // Would be 1.5% (750000) + 10000 = 760000, but capped at 200000
        expect(fee).toBe(200000);
      });
    });

    describe('GHS transaction fees', () => {
      it('should calculate 1.95% flat fee', () => {
        const fee = calculateTransactionFee(10000, 'GHS'); // GH₵100
        expect(fee).toBe(195); // 1.95% = GH₵1.95 (195 pesewas)
      });
    });

    describe('ZAR transaction fees', () => {
      it('should calculate 2.9% + R1', () => {
        const fee = calculateTransactionFee(10000, 'ZAR'); // R100
        // 2.9% of 10000 = 290 + 100 (R1) = 390
        expect(fee).toBe(390);
      });
    });

    describe('KES transaction fees', () => {
      it('should calculate 1.5% for mobile money', () => {
        const fee = calculateTransactionFee(10000, 'KES', 'mobile_money'); // KSh100
        expect(fee).toBe(150); // 1.5% = KSh1.50 (150 cents)
      });

      it('should calculate 2.9% for cards', () => {
        const fee = calculateTransactionFee(10000, 'KES', 'card'); // KSh100
        expect(fee).toBe(290); // 2.9% = KSh2.90 (290 cents)
      });
    });
  });

  // ===========================================================================
  // QUICK AMOUNT SUGGESTIONS
  // ===========================================================================

  describe('getQuickDepositAmounts', () => {
    it('should return NGN deposit amounts', () => {
      const amounts = getQuickDepositAmounts('NGN');
      expect(amounts).toEqual([100000, 250000, 500000, 1000000, 2500000, 5000000]);
    });

    it('should return GHS deposit amounts', () => {
      const amounts = getQuickDepositAmounts('GHS');
      expect(amounts).toEqual([1000, 2500, 5000, 10000, 25000, 50000]);
    });

    it('should return ZAR deposit amounts', () => {
      const amounts = getQuickDepositAmounts('ZAR');
      expect(amounts).toEqual([5000, 10000, 25000, 50000, 100000, 250000]);
    });

    it('should return KES deposit amounts', () => {
      const amounts = getQuickDepositAmounts('KES');
      expect(amounts).toEqual([10000, 25000, 50000, 100000, 250000, 500000]);
    });

    it('should return empty array for unsupported currency', () => {
      const amounts = getQuickDepositAmounts('USD');
      expect(amounts).toEqual([]);
    });
  });

  describe('getQuickWithdrawalAmounts', () => {
    it('should return same amounts as deposit', () => {
      expect(getQuickWithdrawalAmounts('NGN')).toEqual(getQuickDepositAmounts('NGN'));
      expect(getQuickWithdrawalAmounts('GHS')).toEqual(getQuickDepositAmounts('GHS'));
      expect(getQuickWithdrawalAmounts('ZAR')).toEqual(getQuickDepositAmounts('ZAR'));
      expect(getQuickWithdrawalAmounts('KES')).toEqual(getQuickDepositAmounts('KES'));
    });
  });

  // ===========================================================================
  // COUNTRY/CURRENCY MAPPING CONSISTENCY
  // ===========================================================================

  describe('country/currency mapping consistency', () => {
    it('should have bidirectional mappings', () => {
      for (const [country, currency] of Object.entries(COUNTRY_TO_CURRENCY)) {
        expect(CURRENCY_TO_COUNTRY[currency]).toBe(country);
      }
    });

    it('should have currency config for all mapped currencies', () => {
      for (const currency of Object.values(COUNTRY_TO_CURRENCY)) {
        expect(PAYSTACK_CURRENCIES[currency]).toBeDefined();
      }
    });
  });
});
