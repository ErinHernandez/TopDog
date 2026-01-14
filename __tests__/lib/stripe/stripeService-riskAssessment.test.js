/**
 * Tests for lib/stripe/stripeService - Risk Assessment Logic
 * 
 * Tier 0 business logic (95%+ coverage).
 * Tests focus on the risk scoring algorithm:
 * - Risk factor calculation
 * - Risk score aggregation
 * - Recommendation determination
 * - Error handling
 */

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

const { doc, getDoc } = require('firebase/firestore');

describe('assessPaymentRisk', () => {
  let mockUserDoc;
  let assessPaymentRisk;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.resetModules();
    
    // Import after resetModules
    const stripeLib = require('../../../lib/stripe');
    assessPaymentRisk = stripeLib.assessPaymentRisk;

    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        registrationCountry: 'US',
      })),
    };

    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockImplementation(() => ({ id: 'test-doc-ref' }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Risk Score Calculation', () => {
    it('returns low risk score for normal transaction', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        5000, // $50 - normal amount
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.score).toBeLessThanOrEqual(30);
      expect(result.recommendation).toBe('approve');
    });

    it('adds risk for high amounts (>$1000)', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        150000, // $1,500 - high amount
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.factors).toContain('high_amount');
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    it('adds risk for round amounts (>$500)', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        100000, // $1,000 - round amount
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.factors).toContain('round_amount');
      expect(result.score).toBeGreaterThanOrEqual(15);
    });

    it('adds risk for country mismatch', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'GB', // Different from registration country (US)
          newDevice: false,
        }
      );

      expect(result.factors).toContain('country_mismatch');
      expect(result.score).toBeGreaterThanOrEqual(25);
    });

    it('adds risk for new device', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: true,
        }
      );

      expect(result.factors).toContain('new_device');
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    it('adds risk for unusual time (2-6 AM)', async () => {
      jest.setSystemTime(new Date('2025-01-15T03:00:00Z')); // 3 AM

      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.factors).toContain('unusual_time');
      expect(result.score).toBeGreaterThanOrEqual(10);
    });

    it('does not add risk for normal business hours', async () => {
      jest.setSystemTime(new Date('2025-01-15T14:00:00Z')); // 2 PM

      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.factors).not.toContain('unusual_time');
    });
  });

  describe('Recommendation Determination', () => {
    it('recommends approve for low risk (score <= 30)', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.recommendation).toBe('approve');
    });

    it('recommends review for medium risk (31-50)', async () => {
      // Combine factors to get score in this range
      const result = await assessPaymentRisk(
        'user-123',
        60000, // Round amount >$500
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.recommendation).toBe('review');
    });

    it('recommends challenge for higher risk (51-70)', async () => {
      // Combine multiple risk factors
      const result = await assessPaymentRisk(
        'user-123',
        150000, // High amount
        {
          country: 'GB', // Country mismatch
          newDevice: false,
        }
      );

      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThanOrEqual(70);
      expect(result.recommendation).toBe('challenge');
    });

    it('recommends manual_review for high risk (71-90)', async () => {
      // Combine multiple high-risk factors
      const result = await assessPaymentRisk(
        'user-123',
        200000, // High amount
        {
          country: 'GB', // Country mismatch
          newDevice: true, // New device
        }
      );

      expect(result.score).toBeGreaterThan(70);
      expect(result.score).toBeLessThanOrEqual(90);
      expect(result.recommendation).toBe('manual_review');
    });

    it('recommends decline for very high risk (91+)', async () => {
      // Combine all risk factors
      jest.setSystemTime(new Date('2025-01-15T03:00:00Z')); // Unusual time

      const result = await assessPaymentRisk(
        'user-123',
        500000, // Very high amount
        {
          country: 'GB', // Country mismatch
          newDevice: true, // New device
        }
      );

      expect(result.score).toBeGreaterThan(90);
      expect(result.recommendation).toBe('decline');
    });

    it('caps risk score at 100', async () => {
      jest.setSystemTime(new Date('2025-01-15T03:00:00Z')); // Unusual time

      const result = await assessPaymentRisk(
        'user-123',
        1000000, // Very high amount
        {
          country: 'GB', // Country mismatch
          newDevice: true, // New device
        }
      );

      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Risk Factor Combinations', () => {
    it('aggregates multiple risk factors correctly', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        150000, // High + round amount
        {
          country: 'GB', // Country mismatch
          newDevice: true, // New device
        }
      );

      expect(result.factors.length).toBeGreaterThan(1);
      expect(result.score).toBeGreaterThan(30);
    });

    it('includes all applicable risk factors', async () => {
      jest.setSystemTime(new Date('2025-01-15T03:00:00Z')); // Unusual time

      const result = await assessPaymentRisk(
        'user-123',
        200000, // High + round amount
        {
          country: 'GB', // Country mismatch
          newDevice: true, // New device
        }
      );

      const expectedFactors = ['high_amount', 'round_amount', 'country_mismatch', 'new_device', 'unusual_time'];
      expectedFactors.forEach(factor => {
        expect(result.factors).toContain(factor);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles user with no registration country', async () => {
      mockUserDoc.data.mockReturnValue({});

      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      // Should not add country_mismatch risk
      expect(result.factors).not.toContain('country_mismatch');
    });

    it('handles missing country in context', async () => {
      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          newDevice: false,
        }
      );

      expect(result.factors).not.toContain('country_mismatch');
    });

    it('handles user document not existing', async () => {
      mockUserDoc.exists.mockReturnValue(false);
      mockUserDoc.data.mockReturnValue({});

      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      // Should still calculate risk
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('recommendation');
    });
  });

  describe('Error Handling', () => {
    it('returns safe default on error (should not fail payment)', async () => {
      getDoc.mockRejectedValue(new Error('Database error'));

      const result = await assessPaymentRisk(
        'user-123',
        5000,
        {
          country: 'US',
          newDevice: false,
        }
      );

      expect(result).toEqual({
        score: 0,
        factors: ['assessment_failed'],
        recommendation: 'review',
      });
    });

    it('does not throw error on failure', async () => {
      getDoc.mockRejectedValue(new Error('Database error'));

      await expect(
        assessPaymentRisk('user-123', 5000, { country: 'US' })
      ).resolves.toBeDefined();
    });
  });
});
