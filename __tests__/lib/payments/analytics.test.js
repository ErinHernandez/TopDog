/**
 * Tests for lib/payments/analytics
 * 
 * Tier 0 business logic (95%+ coverage).
 * Tests focus on analytics tracking (must not lose data):
 * - Event tracking
 * - Aggregate counter updates
 * - Non-Paystack African country tracking
 * - Error handling (should not fail main operation)
 * - Helper functions
 */

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn((n) => ({ _increment: n })),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('../types', () => ({
  isPaystackCountry: jest.fn((country) => ['NG', 'KE', 'ZA', 'GH'].includes(country)),
  PAYSTACK_COUNTRIES: ['NG', 'KE', 'ZA', 'GH'],
}));

const { doc, collection, addDoc, setDoc, increment, serverTimestamp } = require('firebase/firestore');

describe('Payment Analytics', () => {
  let analytics;
  let trackPaymentEvent;
  let trackNonPaystackAfricanUser;
  let trackProviderFallback;
  let trackLocalPaymentRequest;
  let isAfricanCountry;
  let isNonPaystackAfricanCountry;
  let getRecommendedExpansionProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    analytics = require('../../../lib/payments/analytics');
    trackPaymentEvent = analytics.trackPaymentEvent;
    trackNonPaystackAfricanUser = analytics.trackNonPaystackAfricanUser;
    trackProviderFallback = analytics.trackProviderFallback;
    trackLocalPaymentRequest = analytics.trackLocalPaymentRequest;
    isAfricanCountry = analytics.isAfricanCountry;
    isNonPaystackAfricanCountry = analytics.isNonPaystackAfricanCountry;
    getRecommendedExpansionProvider = analytics.getRecommendedExpansionProvider;

    // Setup default mocks
    addDoc.mockResolvedValue({ id: 'event-123' });
    setDoc.mockResolvedValue(undefined);
    doc.mockImplementation((db, collectionPath, docId) => ({ 
      id: docId || 'doc-ref',
      collection: collectionPath,
    }));
    collection.mockReturnValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('trackPaymentEvent', () => {
    it('tracks event and updates aggregates', async () => {
      await trackPaymentEvent({
        event: 'deposit_initiated',
        country: 'NG',
        provider: 'paystack',
        userId: 'user-123',
        amount: 10000,
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'deposit_initiated',
          country: 'NG',
          provider: 'paystack',
          userId: 'user-123',
          isAfricanCountry: true,
          isPaystackCountry: true,
        })
      );
      expect(setDoc).toHaveBeenCalled(); // Aggregate updates
    });

    it('does not throw error on failure (must not fail main operation)', async () => {
      addDoc.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        trackPaymentEvent({
          event: 'deposit_initiated',
          country: 'NG',
          provider: 'paystack',
        })
      ).resolves.toBeUndefined();
    });

    it('tracks non-Paystack African countries correctly', async () => {
      await trackPaymentEvent({
        event: 'deposit_initiated',
        country: 'TZ', // Tanzania - non-Paystack African
        provider: 'none',
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isNonPaystackAfrican: true,
          country: 'TZ',
        })
      );
    });

    it('updates daily aggregates', async () => {
      await trackPaymentEvent({
        event: 'deposit_completed',
        country: 'NG',
        provider: 'paystack',
      });

      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2025-01-15' }),
        expect.objectContaining({
          'events.deposit_completed': expect.anything(),
          'countries.NG': expect.anything(),
          'providers.paystack': expect.anything(),
        }),
        { merge: true }
      );
    });

    it('updates monthly aggregates', async () => {
      await trackPaymentEvent({
        event: 'deposit_completed',
        country: 'NG',
        provider: 'paystack',
      });

      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2025-01' }),
        expect.anything(),
        { merge: true }
      );
    });

    it('tracks non-Paystack African deposit attempts', async () => {
      await trackPaymentEvent({
        event: 'deposit_initiated',
        country: 'TZ', // Tanzania
        provider: 'none',
      });

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nonPaystackAfricanUsers: expect.anything(),
          'nonPaystackAfricanCountries.TZ': expect.anything(),
          nonPaystackAfricanDepositAttempts: expect.anything(),
        }),
        { merge: true }
      );
    });

    it('tracks non-Paystack African bounces', async () => {
      await trackPaymentEvent({
        event: 'deposit_abandoned',
        country: 'UG', // Uganda
        provider: 'none',
      });

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nonPaystackAfricanBounces: expect.anything(),
        }),
        { merge: true }
      );
    });
  });

  describe('trackNonPaystackAfricanUser', () => {
    it('tracks non-Paystack African users', async () => {
      await trackNonPaystackAfricanUser('TZ', 'user-123', 'session-123');

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'deposit_page_view',
          country: 'TZ',
          userId: 'user-123',
          sessionId: 'session-123',
          provider: 'none',
          metadata: expect.objectContaining({
            fallbackReason: 'country_not_supported_by_paystack',
            potentialProvider: 'flutterwave',
          }),
        })
      );
    });

    it('does nothing for Paystack countries', async () => {
      await trackNonPaystackAfricanUser('NG', 'user-123');

      expect(addDoc).not.toHaveBeenCalled();
    });

    it('does nothing for non-African countries', async () => {
      await trackNonPaystackAfricanUser('US', 'user-123');

      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('trackProviderFallback', () => {
    it('tracks provider fallback events', async () => {
      await trackProviderFallback(
        'paystack',
        'stripe',
        'NG',
        'paystack_unavailable',
        'user-123'
      );

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'provider_fallback',
          country: 'NG',
          provider: 'stripe',
          metadata: expect.objectContaining({
            originalProvider: 'paystack',
            fallbackReason: 'paystack_unavailable',
          }),
        })
      );
    });
  });

  describe('trackLocalPaymentRequest', () => {
    it('tracks local payment method requests', async () => {
      await trackLocalPaymentRequest('NG', 'bank_transfer', 'user-123');

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'local_payment_requested',
          country: 'NG',
          paymentMethod: 'bank_transfer',
          provider: 'none',
        })
      );
    });
  });

  describe('Helper Functions', () => {
    describe('isAfricanCountry', () => {
      it('identifies Paystack African countries', () => {
        expect(isAfricanCountry('NG')).toBe(true);
        expect(isAfricanCountry('KE')).toBe(true);
      });

      it('identifies non-Paystack African countries', () => {
        expect(isAfricanCountry('TZ')).toBe(true);
        expect(isAfricanCountry('UG')).toBe(true);
      });

      it('returns false for non-African countries', () => {
        expect(isAfricanCountry('US')).toBe(false);
        expect(isAfricanCountry('GB')).toBe(false);
      });
    });

    describe('isNonPaystackAfricanCountry', () => {
      it('identifies non-Paystack African countries', () => {
        expect(isNonPaystackAfricanCountry('TZ')).toBe(true);
        expect(isNonPaystackAfricanCountry('UG')).toBe(true);
        expect(isNonPaystackAfricanCountry('EG')).toBe(true);
      });

      it('returns false for Paystack countries', () => {
        expect(isNonPaystackAfricanCountry('NG')).toBe(false);
        expect(isNonPaystackAfricanCountry('KE')).toBe(false);
      });

      it('returns false for non-African countries', () => {
        expect(isNonPaystackAfricanCountry('US')).toBe(false);
      });
    });

    describe('getRecommendedExpansionProvider', () => {
      it('recommends Flutterwave for non-Paystack African countries', () => {
        expect(getRecommendedExpansionProvider('TZ')).toBe('flutterwave');
        expect(getRecommendedExpansionProvider('UG')).toBe('flutterwave');
      });

      it('recommends Paymob for Egypt', () => {
        expect(getRecommendedExpansionProvider('EG')).toBe('paymob');
      });

      it('returns null for Paystack countries', () => {
        expect(getRecommendedExpansionProvider('NG')).toBe(null);
      });

      it('returns null for non-African countries', () => {
        expect(getRecommendedExpansionProvider('US')).toBe(null);
      });
    });
  });

  describe('Error Handling', () => {
    it('does not throw on aggregate update failure', async () => {
      setDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        trackPaymentEvent({
          event: 'deposit_initiated',
          country: 'NG',
          provider: 'paystack',
        })
      ).resolves.toBeUndefined();
    });

    it('does not throw on event storage failure', async () => {
      addDoc.mockRejectedValue(new Error('Storage failed'));

      await expect(
        trackPaymentEvent({
          event: 'deposit_initiated',
          country: 'NG',
          provider: 'paystack',
        })
      ).resolves.toBeUndefined();
    });
  });
});
