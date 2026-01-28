/**
 * Tests for lib/stripe/stripeService - Exchange Rate Conversion
 * 
 * Tests the exchange rate conversion functionality for non-USD withdrawals:
 * - USD withdrawals (no conversion)
 * - Non-USD withdrawals (conversion to USD)
 * - Exchange rate API failures
 * - Insufficient balance with conversion
 * - Edge cases (zero balance, invalid rates)
 */

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

// Mock exchange rate service
const mockGetStripeExchangeRate = jest.fn();
jest.mock('../../../lib/stripe/exchangeRates', () => ({
  getStripeExchangeRate: (...args) => mockGetStripeExchangeRate(...args),
}));

// Mock currency config
const mockToDisplayAmount = jest.fn((cents) => cents / 100);
jest.mock('../../../lib/stripe/currencyConfig', () => ({
  toDisplayAmount: (...args) => mockToDisplayAmount(...args),
}));

// Mock Stripe
const mockStripeTransfer = {
  id: 'tr_test_123',
  amount: 10000,
  currency: 'usd',
  status: 'pending',
};

const mockStripe = {
  transfers: {
    create: jest.fn().mockResolvedValue(mockStripeTransfer),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

const { doc, getDoc } = require('firebase/firestore');

describe('createPayout - Exchange Rate Conversion', () => {
  let createPayout;
  let getConnectAccountStatus;
  
  const mockUserId = 'user_123';
  const mockConnectAccountId = 'acct_test_123';
  
  const mockUserDoc = {
    exists: jest.fn(() => true),
    data: jest.fn(() => ({
      balance: 100.0, // $100 USD
      stripeConnectAccountId: mockConnectAccountId,
    })),
  };

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Default mocks
    doc.mockReturnValue({ id: 'user_123' });
    getDoc.mockResolvedValue(mockUserDoc);
    mockToDisplayAmount.mockImplementation((cents) => cents / 100);
    
    // Import after mocks are set up
    const stripeLib = require('../../../lib/stripe');
    getConnectAccountStatus = stripeLib.getConnectAccountStatus;
    jest.spyOn(stripeLib, 'getConnectAccountStatus').mockResolvedValue({
      payoutsEnabled: true,
      chargesEnabled: true,
      type: 'express',
    });
    
    createPayout = stripeLib.createPayout;
  });

  describe('USD Withdrawals (No Conversion)', () => {
    it('should process USD withdrawal without conversion', async () => {
      const request = {
        userId: mockUserId,
        amountCents: 5000, // $50.00
        currency: 'usd',
      };

      const result = await createPayout(request);

      expect(result).toBeDefined();
      expect(result.payoutId).toBe('tr_test_123');
      expect(result.currency).toBe('USD');
      expect(mockGetStripeExchangeRate).not.toHaveBeenCalled();
      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          currency: 'usd',
        }),
        undefined
      );
    });

    it('should reject USD withdrawal if insufficient balance', async () => {
      const request = {
        userId: mockUserId,
        amountCents: 15000, // $150.00 (more than $100 balance)
        currency: 'usd',
      };

      await expect(createPayout(request)).rejects.toThrow('Insufficient balance');
      expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    });
  });

  describe('Non-USD Withdrawals (With Conversion)', () => {
    it('should convert AUD withdrawal to USD and process', async () => {
      // Mock exchange rate: 1 USD = 1.55 AUD
      mockGetStripeExchangeRate.mockResolvedValue({
        currency: 'AUD',
        rate: 1.55,
        rateDisplay: '1 USD = 1.55 AUD',
        fetchedAt: Date.now(),
        expiresAt: Date.now() + 900000,
      });

      // User wants to withdraw 77.50 AUD
      // 77.50 AUD / 1.55 = 50.00 USD (within $100 balance)
      const request = {
        userId: mockUserId,
        amountCents: 7750, // 77.50 AUD
        currency: 'aud',
      };

      const result = await createPayout(request);

      expect(result).toBeDefined();
      expect(result.payoutId).toBe('tr_test_123');
      expect(result.currency).toBe('AUD');
      expect(mockGetStripeExchangeRate).toHaveBeenCalledWith('AUD');
      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 7750,
          currency: 'aud',
        }),
        undefined
      );
    });

    it('should reject non-USD withdrawal if converted amount exceeds balance', async () => {
      // Mock exchange rate: 1 USD = 1.55 AUD
      mockGetStripeExchangeRate.mockResolvedValue({
        currency: 'AUD',
        rate: 1.55,
        rateDisplay: '1 USD = 1.55 AUD',
        fetchedAt: Date.now(),
        expiresAt: Date.now() + 900000,
      });

      // User wants to withdraw 232.50 AUD
      // 232.50 AUD / 1.55 = 150.00 USD (exceeds $100 balance)
      const request = {
        userId: mockUserId,
        amountCents: 23250, // 232.50 AUD
        currency: 'aud',
      };

      await expect(createPayout(request)).rejects.toThrow('Insufficient balance');
      expect(mockGetStripeExchangeRate).toHaveBeenCalledWith('AUD');
      expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    });

    it('should include conversion details in error message', async () => {
      mockGetStripeExchangeRate.mockResolvedValue({
        currency: 'AUD',
        rate: 1.55,
        rateDisplay: '1 USD = 1.55 AUD',
        fetchedAt: Date.now(),
        expiresAt: Date.now() + 900000,
      });

      const request = {
        userId: mockUserId,
        amountCents: 23250, // 232.50 AUD
        currency: 'aud',
      };

      try {
        await createPayout(request);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Insufficient balance');
        expect(error.message).toContain('232.50 AUD');
        expect(error.message).toContain('150.00 USD'); // Converted amount
        expect(error.message).toContain('100.00 USD'); // Available balance
      }
    });
  });

  describe('Exchange Rate API Failures', () => {
    it('should handle exchange rate API failure gracefully', async () => {
      mockGetStripeExchangeRate.mockRejectedValue(
        new Error('Failed to fetch exchange rate')
      );

      const request = {
        userId: mockUserId,
        amountCents: 5000,
        currency: 'aud',
      };

      await expect(createPayout(request)).rejects.toThrow(
        'Failed to fetch exchange rate for AUD'
      );
      expect(mockGetStripeExchangeRate).toHaveBeenCalledWith('AUD');
      expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero balance correctly', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          balance: 0,
          stripeConnectAccountId: mockConnectAccountId,
        }),
      });

      const request = {
        userId: mockUserId,
        amountCents: 100, // $1.00
        currency: 'usd',
      };

      await expect(createPayout(request)).rejects.toThrow('Insufficient balance');
    });

    it('should handle exact balance match', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          balance: 50.0, // Exactly $50
          stripeConnectAccountId: mockConnectAccountId,
        }),
      });

      const request = {
        userId: mockUserId,
        amountCents: 5000, // Exactly $50.00
        currency: 'usd',
      };

      const result = await createPayout(request);
      expect(result).toBeDefined();
      expect(mockStripe.transfers.create).toHaveBeenCalled();
    });
  });
});
