/**
 * Tests for Payment Processor
 *
 * Tests payment method availability and fee calculations.
 * Critical for ensuring correct payment processing fees.
 */

import {
  getAvailablePaymentMethods,
  calculateFees,
} from '../../lib/paymentProcessor';

describe('Payment Processor', () => {
  describe('getAvailablePaymentMethods', () => {
    it('should return US payment methods for US', () => {
      const methods = getAvailablePaymentMethods('US');
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });

    it('should return CA payment methods for Canada', () => {
      const methods = getAvailablePaymentMethods('CA');
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });

    it('should return UK payment methods for UK', () => {
      const methods = getAvailablePaymentMethods('UK');
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });

    it('should default to US methods for unknown countries', () => {
      const methods = getAvailablePaymentMethods('FR');
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });

    it('should handle null country', () => {
      const methods = getAvailablePaymentMethods(null);
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });

    it('should handle undefined country', () => {
      const methods = getAvailablePaymentMethods(undefined);
      expect(methods).toEqual(['stripe', 'paypal', 'applepay', 'googlepay']);
    });
  });

  describe('calculateFees', () => {
    it('should calculate Stripe fee (2.9%)', () => {
      const fee = calculateFees(10000, 'stripe'); // $100.00
      expect(fee).toBe(290); // $2.90
    });

    it('should calculate PayPal fee (2.9%)', () => {
      const fee = calculateFees(10000, 'paypal'); // $100.00
      expect(fee).toBe(290); // $2.90
    });

    it('should calculate Adyen fee (2.8%)', () => {
      const fee = calculateFees(10000, 'adyen'); // $100.00
      expect(fee).toBe(280); // $2.80
    });

    it('should calculate Apple Pay fee (2.9%)', () => {
      const fee = calculateFees(10000, 'applepay'); // $100.00
      expect(fee).toBe(290); // $2.90
    });

    it('should calculate Google Pay fee (2.9%)', () => {
      const fee = calculateFees(10000, 'googlepay'); // $100.00
      expect(fee).toBe(290); // $2.90
    });

    it('should default to 2.9% for unknown methods', () => {
      const fee = calculateFees(10000, 'unknown');
      expect(fee).toBe(290); // $2.90 default
    });

    it('should calculate fee for small amounts', () => {
      const fee = calculateFees(500, 'stripe'); // $5.00
      expect(fee).toBe(14.5); // $0.145
    });

    it('should calculate fee for large amounts', () => {
      const fee = calculateFees(1000000, 'stripe'); // $10,000.00
      expect(fee).toBe(29000); // $290.00
    });

    it('should return 0 for zero amount', () => {
      const fee = calculateFees(0, 'stripe');
      expect(fee).toBe(0);
    });

    it('should handle negative amounts (edge case)', () => {
      const fee = calculateFees(-1000, 'stripe');
      expect(fee).toBe(-29); // Negative fee (invalid but handled)
    });
  });

  describe('Fee Accuracy', () => {
    it('should calculate exact fees with precision', () => {
      // $50.00 with 2.9% fee
      const fee = calculateFees(5000, 'stripe');
      expect(fee).toBeCloseTo(145, 2); // $1.45
    });

    it('should handle decimal amounts correctly', () => {
      // $99.99 with 2.9% fee
      const fee = calculateFees(9999, 'stripe');
      expect(fee).toBeCloseTo(289.971, 2); // ~$2.90
    });

    it('should calculate fees for all supported methods consistently', () => {
      const amount = 10000;
      const methods = ['stripe', 'paypal', 'applepay', 'googlepay'];

      methods.forEach(method => {
        const fee = calculateFees(amount, method);
        expect(fee).toBe(290); // All should be 2.9%
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should calculate total cost including fees', () => {
      const depositAmount = 10000; // $100.00
      const fee = calculateFees(depositAmount, 'stripe');
      const totalCharged = depositAmount + fee;

      expect(totalCharged).toBe(10290); // $102.90
    });

    it('should calculate merchant receives amount (after fees)', () => {
      const chargedAmount = 10000; // $100.00 charged to customer
      const fee = calculateFees(chargedAmount, 'stripe');
      const merchantReceives = chargedAmount - fee;

      expect(merchantReceives).toBe(9710); // $97.10
    });

    it('should handle multiple payment methods comparison', () => {
      const amount = 10000;

      const stripeFee = calculateFees(amount, 'stripe'); // 2.9%
      const adyenFee = calculateFees(amount, 'adyen');   // 2.8%

      expect(stripeFee).toBeGreaterThan(adyenFee);
      expect(stripeFee - adyenFee).toBe(10); // $0.10 difference
    });
  });
});
