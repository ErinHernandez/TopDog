/**
 * Payment Processor Utilities
 * Simple utility functions for payment method availability and fee calculation
 */

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = 'stripe' | 'paypal' | 'applepay' | 'googlepay' | 'adyen';
export type CountryCode = 'US' | 'CA' | 'UK' | string;

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Get available payment methods for a country
 * @param country - Country code (e.g., 'US', 'CA', 'UK')
 * @returns Array of available payment methods
 */
export const getAvailablePaymentMethods = (country: CountryCode): PaymentMethod[] => {
  const methods: Record<string, PaymentMethod[]> = {
    US: ['stripe', 'paypal', 'applepay', 'googlepay'],
    CA: ['stripe', 'paypal', 'applepay', 'googlepay'],
    UK: ['stripe', 'paypal', 'applepay', 'googlepay'],
    // Add more countries as needed
  };
  
  return methods[country] || methods['US'];
};

/**
 * Calculate fees for a payment amount and method
 * @param amount - Payment amount
 * @param method - Payment method
 * @returns Calculated fee amount
 */
export const calculateFees = (amount: number, method: PaymentMethod): number => {
  const feeRates: Record<PaymentMethod, number> = {
    stripe: 0.029,
    paypal: 0.029,
    adyen: 0.028,
    applepay: 0.029,
    googlepay: 0.029
  };
  
  const rate = feeRates[method] || 0.029;
  return amount * rate;
};
