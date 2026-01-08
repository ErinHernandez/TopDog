/**
 * Currency Formatting Tests
 * 
 * Tests for components/vx2/utils/formatting/currency.ts
 */

const {
  formatSmallestUnit,
  formatCents,
  formatDisplayAmount,
  formatDollars,
  formatCompactCurrency,
  parseCurrency,
  toDisplayAmount,
  toSmallestUnit,
  isZeroDecimalCurrency,
  getCurrencySymbol,
} = require('../components/vx2/utils/formatting/currency');

describe('currencyFormatting', () => {
  describe('isZeroDecimalCurrency', () => {
    it('should identify zero-decimal currencies', () => {
      expect(isZeroDecimalCurrency('JPY')).toBe(true);
      expect(isZeroDecimalCurrency('KRW')).toBe(true);
      expect(isZeroDecimalCurrency('VND')).toBe(true);
      expect(isZeroDecimalCurrency('IDR')).toBe(true);
    });

    it('should return false for standard currencies', () => {
      expect(isZeroDecimalCurrency('USD')).toBe(false);
      expect(isZeroDecimalCurrency('EUR')).toBe(false);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XXX')).toBe('XXX');
    });
  });

  describe('formatSmallestUnit', () => {
    it('should format USD cents correctly', () => {
      expect(formatSmallestUnit(2500, { currency: 'USD' })).toContain('25');
      expect(formatSmallestUnit(2500, { currency: 'USD' })).toContain('$');
    });

    it('should format EUR cents correctly', () => {
      expect(formatSmallestUnit(2500, { currency: 'EUR' })).toContain('25');
    });

    it('should handle zero-decimal currencies', () => {
      // For KRW, 5000 should display as 5,000 (not 50)
      const result = formatSmallestUnit(5000, { currency: 'KRW' });
      expect(result).toContain('5,000') || expect(result).toContain('5000');
    });

    it('should handle negative amounts', () => {
      const result = formatSmallestUnit(-2500, { currency: 'USD' });
      expect(result).toContain('-');
      expect(result).toContain('25');
    });

    it('should show plus sign when requested', () => {
      const result = formatSmallestUnit(2500, { currency: 'USD', showPlusSign: true });
      expect(result).toContain('+');
    });
  });

  describe('formatCents (backward compatibility)', () => {
    it('should format cents as dollars', () => {
      const result = formatCents(2500);
      expect(result).toContain('25');
    });

    it('should hide cents when requested', () => {
      const result = formatCents(2500, { showCents: false });
      expect(result).not.toContain('.00');
    });
  });

  describe('formatDisplayAmount', () => {
    it('should format display amount correctly', () => {
      const result = formatDisplayAmount(25, { currency: 'USD' });
      expect(result).toContain('25');
    });

    it('should handle zero-decimal currencies', () => {
      const result = formatDisplayAmount(5000, { currency: 'KRW' });
      expect(result).toContain('5,000') || expect(result).toContain('5000');
    });
  });

  describe('formatDollars (backward compatibility)', () => {
    it('should format dollars correctly', () => {
      const result = formatDollars(25);
      expect(result).toContain('25');
    });
  });

  describe('formatCompactCurrency', () => {
    it('should format thousands with K', () => {
      expect(formatCompactCurrency(2500)).toBe('2.5K');
      expect(formatCompactCurrency(15000)).toBe('15K');
    });

    it('should format millions with M', () => {
      expect(formatCompactCurrency(1500000)).toBe('1.5M');
      expect(formatCompactCurrency(25000000)).toBe('25M');
    });

    it('should format billions with B', () => {
      expect(formatCompactCurrency(1500000000)).toBe('1.5B');
    });

    it('should not compact small numbers', () => {
      expect(formatCompactCurrency(500)).toBe('500');
    });
  });

  describe('parseCurrency', () => {
    it('should parse simple numbers', () => {
      expect(parseCurrency('25', 'USD')).toBe(2500);
      expect(parseCurrency('25.50', 'USD')).toBe(2550);
    });

    it('should parse with currency symbol', () => {
      expect(parseCurrency('$25', 'USD')).toBe(2500);
      expect(parseCurrency('€25', 'EUR')).toBe(2500);
    });

    it('should parse with commas', () => {
      expect(parseCurrency('$1,000', 'USD')).toBe(100000);
    });

    it('should parse compact notation', () => {
      expect(parseCurrency('$2.5K', 'USD')).toBe(250000);
      expect(parseCurrency('$1.5M', 'USD')).toBe(150000000);
    });

    it('should handle zero-decimal currencies', () => {
      expect(parseCurrency('5000', 'KRW')).toBe(5000);
      expect(parseCurrency('5K', 'KRW')).toBe(5000);
    });

    it('should return null for invalid input', () => {
      expect(parseCurrency('', 'USD')).toBeNull();
      expect(parseCurrency('abc', 'USD')).toBeNull();
    });
  });

  describe('toDisplayAmount', () => {
    it('should convert cents to dollars for USD', () => {
      expect(toDisplayAmount(2500, 'USD')).toBe(25);
      expect(toDisplayAmount(2550, 'USD')).toBe(25.5);
    });

    it('should not convert for zero-decimal currencies', () => {
      expect(toDisplayAmount(5000, 'KRW')).toBe(5000);
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert dollars to cents for USD', () => {
      expect(toSmallestUnit(25, 'USD')).toBe(2500);
      expect(toSmallestUnit(25.50, 'USD')).toBe(2550);
    });

    it('should not convert for zero-decimal currencies', () => {
      expect(toSmallestUnit(5000, 'KRW')).toBe(5000);
    });

    it('should round to nearest integer', () => {
      expect(toSmallestUnit(25.555, 'USD')).toBe(2556);
    });
  });
});

