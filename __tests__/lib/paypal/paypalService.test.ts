/**
 * PayPal Service Tests
 *
 * Unit tests for PayPal service layer functions
 */

import {
  PAYPAL_DEPOSIT_LIMITS,
  PAYPAL_WITHDRAWAL_LIMITS,
  getPayPalErrorMessage,
} from '../../../lib/paypal/paypalTypes';
import { getSecurityTier } from '../../../lib/paypal/paypalWithdrawals';

// Mock Firebase
jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

// Mock logger
jest.mock('../../../lib/logger/serverLogger', () => ({
  serverLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PayPal Types and Constants', () => {
  describe('PAYPAL_DEPOSIT_LIMITS', () => {
    it('should have correct minimum deposit ($25)', () => {
      expect(PAYPAL_DEPOSIT_LIMITS.minAmountCents).toBe(2500);
    });

    it('should have correct maximum deposit ($3,750)', () => {
      expect(PAYPAL_DEPOSIT_LIMITS.maxAmountCents).toBe(375000);
    });

    it('should only support USD', () => {
      expect(PAYPAL_DEPOSIT_LIMITS.currency).toBe('USD');
    });
  });

  describe('PAYPAL_WITHDRAWAL_LIMITS', () => {
    it('should have no minimum withdrawal', () => {
      expect(PAYPAL_WITHDRAWAL_LIMITS.minAmountCents).toBe(0);
    });

    it('should have no maximum withdrawal', () => {
      expect(PAYPAL_WITHDRAWAL_LIMITS.maxAmountCents).toBeNull();
    });

    it('should allow 3 withdrawals per day', () => {
      expect(PAYPAL_WITHDRAWAL_LIMITS.maxPerDay).toBe(3);
    });

    it('should have correct security tier thresholds', () => {
      const { securityTiers } = PAYPAL_WITHDRAWAL_LIMITS;

      expect(securityTiers.confirmationRequired).toBe(100000); // $1,000
      expect(securityTiers.holdRequired).toBe(1000000); // $10,000
      expect(securityTiers.supportRequired).toBe(5000000); // $50,000
    });
  });
});

describe('getSecurityTier', () => {
  it('should return "standard" for amounts under $1,000', () => {
    expect(getSecurityTier(0)).toBe('standard');
    expect(getSecurityTier(99999)).toBe('standard');
    expect(getSecurityTier(50000)).toBe('standard');
  });

  it('should return "confirmation_required" for $1,000 - $9,999', () => {
    expect(getSecurityTier(100000)).toBe('confirmation_required');
    expect(getSecurityTier(500000)).toBe('confirmation_required');
    expect(getSecurityTier(999999)).toBe('confirmation_required');
  });

  it('should return "hold_required" for $10,000 - $49,999', () => {
    expect(getSecurityTier(1000000)).toBe('hold_required');
    expect(getSecurityTier(2500000)).toBe('hold_required');
    expect(getSecurityTier(4999999)).toBe('hold_required');
  });

  it('should return "support_required" for $50,000+', () => {
    expect(getSecurityTier(5000000)).toBe('support_required');
    expect(getSecurityTier(10000000)).toBe('support_required');
    expect(getSecurityTier(100000000)).toBe('support_required');
  });
});

describe('getPayPalErrorMessage', () => {
  it('should return user-friendly message for known error codes', () => {
    expect(getPayPalErrorMessage('INSTRUMENT_DECLINED')).toBe(
      'Your payment method was declined. Please try another.'
    );
    expect(getPayPalErrorMessage('INSUFFICIENT_FUNDS')).toBe(
      'Insufficient funds in your PayPal account.'
    );
  });

  it('should return default message for unknown error codes', () => {
    expect(getPayPalErrorMessage('UNKNOWN_ERROR')).toBe(
      'An unexpected error occurred. Please try again.'
    );
    expect(getPayPalErrorMessage(undefined)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});

describe('Deposit Validation Logic', () => {
  const validateDeposit = (amountCents: number): string | null => {
    if (amountCents < PAYPAL_DEPOSIT_LIMITS.minAmountCents) {
      return `Minimum deposit is $${PAYPAL_DEPOSIT_LIMITS.minAmountCents / 100}`;
    }
    if (amountCents > PAYPAL_DEPOSIT_LIMITS.maxAmountCents) {
      return `Maximum deposit is $${PAYPAL_DEPOSIT_LIMITS.maxAmountCents / 100}`;
    }
    return null;
  };

  it('should reject deposits below $25', () => {
    expect(validateDeposit(2400)).toBe('Minimum deposit is $25');
    expect(validateDeposit(0)).toBe('Minimum deposit is $25');
    expect(validateDeposit(100)).toBe('Minimum deposit is $25');
  });

  it('should reject deposits above $3,750', () => {
    expect(validateDeposit(375001)).toBe('Maximum deposit is $3750');
    expect(validateDeposit(500000)).toBe('Maximum deposit is $3750');
  });

  it('should accept valid deposit amounts', () => {
    expect(validateDeposit(2500)).toBeNull(); // $25 (minimum)
    expect(validateDeposit(5000)).toBeNull(); // $50
    expect(validateDeposit(10000)).toBeNull(); // $100
    expect(validateDeposit(375000)).toBeNull(); // $3,750 (maximum)
  });
});

describe('Withdrawal Daily Limit Logic', () => {
  const checkDailyLimit = (count: number): { allowed: boolean; warning: string | null } => {
    if (count >= PAYPAL_WITHDRAWAL_LIMITS.maxPerDay) {
      return { allowed: false, warning: null };
    }
    if (count >= 2) {
      return { allowed: true, warning: '3 withdrawals maximum per 24 hour period' };
    }
    return { allowed: true, warning: null };
  };

  it('should allow first withdrawal without warning', () => {
    const result = checkDailyLimit(0);
    expect(result.allowed).toBe(true);
    expect(result.warning).toBeNull();
  });

  it('should allow second withdrawal without warning', () => {
    const result = checkDailyLimit(1);
    expect(result.allowed).toBe(true);
    expect(result.warning).toBeNull();
  });

  it('should allow third withdrawal with warning', () => {
    const result = checkDailyLimit(2);
    expect(result.allowed).toBe(true);
    expect(result.warning).toBe('3 withdrawals maximum per 24 hour period');
  });

  it('should block fourth withdrawal', () => {
    const result = checkDailyLimit(3);
    expect(result.allowed).toBe(false);
  });
});
