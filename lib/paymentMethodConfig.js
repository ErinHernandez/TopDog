// Strategic payment methods - Core Global processors only
export const GLOBAL_PAYMENT_METHODS = [
  // === CORE GLOBAL (5 processors) ===
  'stripe', 'paypal', 'adyen', 'applepay', 'googlepay'
];

// Smart ordering based on geographic proximity
export const getPaymentMethodsByLocation = (userCountry = 'US') => {
  // All countries get the same core global methods
  return GLOBAL_PAYMENT_METHODS;
};

// Helper function to get payment method IDs in user's preferred order
export const getOrderedPaymentMethods = (userCountry = 'US') => {
  const orderedMethodIds = getPaymentMethodsByLocation(userCountry);
  return orderedMethodIds.filter(methodId => PAYMENT_METHOD_DETAILS[methodId]?.name);
};

// Helper function to get payment method details in user's preferred order
export const getOrderedPaymentMethodsWithDetails = (userCountry = 'US') => {
  const orderedMethodIds = getPaymentMethodsByLocation(userCountry);
  return orderedMethodIds.map(methodId => ({
    id: methodId,
    ...PAYMENT_METHOD_DETAILS[methodId]
  })).filter(method => method.name);
};

// Legacy country-specific config (deprecated - use getPaymentMethodsByLocation)
export const PAYMENT_METHODS_BY_COUNTRY = {
  GLOBAL: GLOBAL_PAYMENT_METHODS
};

export const PAYMENT_METHOD_DETAILS = {
  stripe: {
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Visa, Mastercard, American Express',
    fees: 0.029,
    minAmount: 5,
    maxAmount: 10000,
    region: 'Global',
    primaryMarkets: ['US', 'CA', 'EU', 'AU'],
    notes: 'Most widely accepted payment method globally'
  },
  paypal: {
    name: 'PayPal',
    icon: '🔵',
    description: 'PayPal account or guest checkout',
    fees: 0.029,
    minAmount: 5,
    maxAmount: 10000,
    region: 'Global',
    primaryMarkets: ['US', 'EU', 'AU', 'CA'],
    notes: 'Widely trusted e-wallet, good for international users'
  },
  adyen: {
    name: 'Adyen',
    icon: '🌐',
    description: 'Global payment platform',
    fees: 0.028,
    minAmount: 1,
    maxAmount: 100000,
    region: 'Global',
    primaryMarkets: ['EU', 'US', 'AU', 'SG'],
    notes: 'Major Stripe competitor, strong in enterprise'
  },
  applepay: {
    name: 'Apple Pay',
    icon: '🍎',
    description: 'Apple Pay wallet',
    fees: 0.029,
    minAmount: 5,
    maxAmount: 10000,
    region: 'Global',
    primaryMarkets: ['US', 'EU', 'AU', 'CA']
  },
  googlepay: {
    name: 'Google Pay',
    icon: '🤖',
    description: 'Google Pay wallet',
    fees: 0.029,
    minAmount: 5,
    maxAmount: 10000,
    region: 'Global',
    primaryMarkets: ['US', 'EU', 'AU', 'CA']
  }
};
