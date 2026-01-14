/**
 * Tests for lib/stripe/stripeService - Balance Operations
 * 
 * Tier 0 business logic (95%+ coverage).
 * Tests focus on balance update operations:
 * - Adding to balance
 * - Subtracting from balance
 * - Insufficient balance validation
 * - User not found handling
 * - Error handling
 */

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

describe('updateUserBalance', () => {
  let mockUserDoc;
  let mockUserRef;
  let updateUserBalance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        balance: 100.00, // $100.00
      })),
    };

    mockUserRef = { id: 'user-123' };
    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockReturnValue(mockUserRef);
    setDoc.mockResolvedValue(undefined);

    // Import after mocks are set up
    const stripeLib = require('../../../lib/stripe');
    updateUserBalance = stripeLib.updateUserBalance;
  });

  describe('Adding to Balance', () => {
    it('adds amount to balance correctly', async () => {
      const result = await updateUserBalance('user-123', 5000, 'add'); // $50.00

      expect(getDoc).toHaveBeenCalledWith(mockUserRef);
      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 150.00, // $100 + $50
        }),
        { merge: true }
      );
      expect(result).toBe(150.00);
    });

    it('handles cents conversion correctly', async () => {
      const result = await updateUserBalance('user-123', 1250, 'add'); // $12.50

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 112.50, // $100 + $12.50
        }),
        { merge: true }
      );
      expect(result).toBe(112.50);
    });

    it('handles zero balance correctly', async () => {
      mockUserDoc.data.mockReturnValue({ balance: 0 });

      const result = await updateUserBalance('user-123', 5000, 'add'); // $50.00

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 50.00,
        }),
        { merge: true }
      );
      expect(result).toBe(50.00);
    });

    it('updates lastBalanceUpdate timestamp', async () => {
      await updateUserBalance('user-123', 5000, 'add');

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          lastBalanceUpdate: expect.anything(),
        }),
        { merge: true }
      );
    });
  });

  describe('Subtracting from Balance', () => {
    it('subtracts amount from balance correctly', async () => {
      const result = await updateUserBalance('user-123', 3000, 'subtract'); // $30.00

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 70.00, // $100 - $30
        }),
        { merge: true }
      );
      expect(result).toBe(70.00);
    });

    it('allows balance to reach zero', async () => {
      const result = await updateUserBalance('user-123', 10000, 'subtract'); // $100.00

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 0.00,
        }),
        { merge: true }
      );
      expect(result).toBe(0.00);
    });

    it('rejects subtraction that would result in negative balance', async () => {
      await expect(
        updateUserBalance('user-123', 15000, 'subtract') // $150.00 > $100.00
      ).rejects.toThrow('Insufficient balance');
    });

    it('handles cents in subtraction', async () => {
      mockUserDoc.data.mockReturnValue({ balance: 100.50 });

      const result = await updateUserBalance('user-123', 2550, 'subtract'); // $25.50

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 75.00, // $100.50 - $25.50
        }),
        { merge: true }
      );
      expect(result).toBe(75.00);
    });
  });

  describe('Edge Cases', () => {
    it('handles user with no balance field (defaults to 0)', async () => {
      mockUserDoc.data.mockReturnValue({});

      const result = await updateUserBalance('user-123', 5000, 'add'); // $50.00

      expect(setDoc).toHaveBeenCalledWith(
        mockUserRef,
        expect.objectContaining({
          balance: 50.00,
        }),
        { merge: true }
      );
      expect(result).toBe(50.00);
    });

    it('throws error when user does not exist', async () => {
      mockUserDoc.exists.mockReturnValue(false);

      await expect(
        updateUserBalance('user-nonexistent', 5000, 'add')
      ).rejects.toThrow('User not found');

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('handles very large amounts', async () => {
      mockUserDoc.data.mockReturnValue({ balance: 1000000.00 }); // $1,000,000

      const result = await updateUserBalance('user-123', 50000000, 'add'); // $500,000

      expect(result).toBe(1500000.00);
    });

    it('handles fractional cents correctly (rounding)', async () => {
      // Test that cents are properly converted (should not have floating point issues)
      const result = await updateUserBalance('user-123', 1, 'add'); // $0.01

      expect(result).toBe(100.01);
    });
  });

  describe('Error Handling', () => {
    it('captures errors for monitoring', async () => {
      const captureError = require('../../../lib/errorTracking').captureError;
      mockUserDoc.exists.mockReturnValue(false);

      await expect(
        updateUserBalance('user-nonexistent', 5000, 'add')
      ).rejects.toThrow();

      expect(captureError).toHaveBeenCalled();
    });

    it('throws error on database read failure', async () => {
      getDoc.mockRejectedValue(new Error('Database error'));

      await expect(
        updateUserBalance('user-123', 5000, 'add')
      ).rejects.toThrow('Database error');
    });

    it('throws error on database write failure', async () => {
      setDoc.mockRejectedValue(new Error('Write error'));

      await expect(
        updateUserBalance('user-123', 5000, 'add')
      ).rejects.toThrow('Write error');
    });
  });

  describe('Balance Validation', () => {
    it('prevents negative balance after subtraction', async () => {
      mockUserDoc.data.mockReturnValue({ balance: 10.00 });

      await expect(
        updateUserBalance('user-123', 2000, 'subtract') // $20.00 > $10.00
      ).rejects.toThrow('Insufficient balance');

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('allows exact balance subtraction', async () => {
      mockUserDoc.data.mockReturnValue({ balance: 50.00 });

      const result = await updateUserBalance('user-123', 5000, 'subtract'); // $50.00

      expect(result).toBe(0.00);
    });
  });
});
