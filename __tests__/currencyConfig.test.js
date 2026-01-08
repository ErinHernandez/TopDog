/**
 * Currency Configuration Tests
 * 
 * Tests for lib/stripe/currencyConfig.ts
 */

const {
  CURRENCY_CONFIG,
  COUNTRY_TO_CURRENCY,
  ZERO_DECIMAL_CURRENCIES,
  isZeroDecimalCurrency,
  getCurrencyConfig,
  getCurrencyForCountry,
  toSmallestUnit,
  toDisplayAmount,
  validateAmount,
  getCurrencyOptions,
} = require('../lib/stripe/currencyConfig');

describe('currencyConfig', () => {
  describe('CURRENCY_CONFIG', () => {
    it('should have 27 currencies defined', () => {
      expect(Object.keys(CURRENCY_CONFIG).length).toBe(27);
    });

    it('should have USD defined with correct properties', () => {
      const usd = CURRENCY_CONFIG.USD;
      expect(usd).toBeDefined();
      expect(usd.code).toBe('USD');
      expect(usd.symbol).toBe('$');
      expect(usd.decimals).toBe(2);
      expect(usd.countries).toContain('US');
    });

    it('should have EUR defined with correct properties', () => {
      const eur = CURRENCY_CONFIG.EUR;
      expect(eur).toBeDefined();
      expect(eur.code).toBe('EUR');
      expect(eur.symbol).toBe('€');
      expect(eur.decimals).toBe(2);
      expect(eur.countries).toContain('DE');
      expect(eur.countries).toContain('FR');
    });

    it('should have zero-decimal currencies configured correctly', () => {
      expect(CURRENCY_CONFIG.KRW.decimals).toBe(0);
      expect(CURRENCY_CONFIG.VND.decimals).toBe(0);
      expect(CURRENCY_CONFIG.IDR.decimals).toBe(0);
    });
  });

  describe('COUNTRY_TO_CURRENCY', () => {
    it('should map US to USD', () => {
      expect(COUNTRY_TO_CURRENCY.US).toBe('USD');
    });

    it('should map UK to GBP', () => {
      expect(COUNTRY_TO_CURRENCY.GB).toBe('GBP');
    });

    it('should map Germany to EUR', () => {
      expect(COUNTRY_TO_CURRENCY.DE).toBe('EUR');
    });

    it('should map Japan to undefined (not in our supported list)', () => {
      // JPY is not in our supported currencies for this implementation
      expect(COUNTRY_TO_CURRENCY.JP).toBeUndefined();
    });
  });

  describe('isZeroDecimalCurrency', () => {
    it('should return true for zero-decimal currencies', () => {
      expect(isZeroDecimalCurrency('KRW')).toBe(true);
      expect(isZeroDecimalCurrency('VND')).toBe(true);
      expect(isZeroDecimalCurrency('IDR')).toBe(true);
    });

    it('should return false for standard currencies', () => {
      expect(isZeroDecimalCurrency('USD')).toBe(false);
      expect(isZeroDecimalCurrency('EUR')).toBe(false);
      expect(isZeroDecimalCurrency('GBP')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isZeroDecimalCurrency('krw')).toBe(true);
      expect(isZeroDecimalCurrency('usd')).toBe(false);
    });
  });

  describe('getCurrencyConfig', () => {
    it('should return config for valid currency', () => {
      const config = getCurrencyConfig('EUR');
      expect(config.code).toBe('EUR');
      expect(config.symbol).toBe('€');
    });

    it('should return USD config for unknown currency', () => {
      const config = getCurrencyConfig('XXX');
      expect(config.code).toBe('USD');
    });

    it('should be case-insensitive', () => {
      const config = getCurrencyConfig('eur');
      expect(config.code).toBe('EUR');
    });
  });

  describe('getCurrencyForCountry', () => {
    it('should return USD for US', () => {
      expect(getCurrencyForCountry('US')).toBe('USD');
    });

    it('should return GBP for UK', () => {
      expect(getCurrencyForCountry('GB')).toBe('GBP');
    });

    it('should return USD for unknown country', () => {
      expect(getCurrencyForCountry('XX')).toBe('USD');
    });

    it('should be case-insensitive', () => {
      expect(getCurrencyForCountry('us')).toBe('USD');
      expect(getCurrencyForCountry('gb')).toBe('GBP');
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert USD dollars to cents', () => {
      expect(toSmallestUnit(25, 'USD')).toBe(2500);
      expect(toSmallestUnit(25.50, 'USD')).toBe(2550);
      expect(toSmallestUnit(100, 'USD')).toBe(10000);
    });

    it('should convert EUR to cents', () => {
      expect(toSmallestUnit(25, 'EUR')).toBe(2500);
    });

    it('should not multiply for zero-decimal currencies', () => {
      expect(toSmallestUnit(5000, 'KRW')).toBe(5000);
      expect(toSmallestUnit(100000, 'VND')).toBe(100000);
    });

    it('should round to nearest integer', () => {
      expect(toSmallestUnit(25.555, 'USD')).toBe(2556);
    });
  });

  describe('toDisplayAmount', () => {
    it('should convert cents to USD dollars', () => {
      expect(toDisplayAmount(2500, 'USD')).toBe(25);
      expect(toDisplayAmount(2550, 'USD')).toBe(25.50);
    });

    it('should not divide for zero-decimal currencies', () => {
      expect(toDisplayAmount(5000, 'KRW')).toBe(5000);
      expect(toDisplayAmount(100000, 'VND')).toBe(100000);
    });
  });

  describe('validateAmount', () => {
    it('should validate USD amounts correctly', () => {
      // $5 minimum
      expect(validateAmount(500, 'USD').isValid).toBe(true);
      expect(validateAmount(400, 'USD').isValid).toBe(false);
      
      // $10,000 maximum
      expect(validateAmount(1000000, 'USD').isValid).toBe(true);
      expect(validateAmount(1000001, 'USD').isValid).toBe(false);
    });

    it('should validate EUR amounts correctly', () => {
      expect(validateAmount(500, 'EUR').isValid).toBe(true);
      expect(validateAmount(400, 'EUR').isValid).toBe(false);
    });

    it('should return appropriate error messages', () => {
      const result = validateAmount(100, 'USD');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Minimum');
    });
  });

  describe('getCurrencyOptions', () => {
    it('should return array of currency options', () => {
      const options = getCurrencyOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(27);
    });

    it('should have correct structure for each option', () => {
      const options = getCurrencyOptions();
      const usdOption = options.find(o => o.value === 'USD');
      
      expect(usdOption).toBeDefined();
      expect(usdOption.value).toBe('USD');
      expect(usdOption.symbol).toBe('$');
      expect(usdOption.label).toContain('US Dollar');
    });
  });
});

