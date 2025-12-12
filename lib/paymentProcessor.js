export const getAvailablePaymentMethods = (country) => {
  const methods = {
    US: ['stripe', 'paypal', 'applepay', 'googlepay'],
    CA: ['stripe', 'paypal', 'applepay', 'googlepay'],
    UK: ['stripe', 'paypal', 'applepay', 'googlepay'],
    // Add more countries as needed
  };
  
  return methods[country] || methods['US'];
};

export const calculateFees = (amount, method) => {
  const feeRates = {
    stripe: 0.029,
    paypal: 0.029,
    adyen: 0.028,
    applepay: 0.029,
    googlepay: 0.029
  };
  
  const rate = feeRates[method] || 0.029;
  return amount * rate;
}; 