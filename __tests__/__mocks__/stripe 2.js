/**
 * Stripe Mocks for Testing
 *
 * Provides mock implementations of Stripe API:
 * - Payment Intents
 * - Customers
 * - Charges
 * - Webhooks
 */

// Mock Payment Intent
export const createMockPaymentIntent = (overrides = {}) => ({
  id: 'pi_test_123456',
  object: 'payment_intent',
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  status: 'requires_payment_method',
  client_secret: 'pi_test_123456_secret_test',
  created: Math.floor(Date.now() / 1000),
  metadata: {},
  ...overrides,
});

// Mock Customer
export const createMockCustomer = (overrides = {}) => ({
  id: 'cus_test_123456',
  object: 'customer',
  email: 'test@example.com',
  name: 'Test Customer',
  created: Math.floor(Date.now() / 1000),
  metadata: {},
  ...overrides,
});

// Mock Charge
export const createMockCharge = (overrides = {}) => ({
  id: 'ch_test_123456',
  object: 'charge',
  amount: 5000,
  currency: 'usd',
  status: 'succeeded',
  paid: true,
  created: Math.floor(Date.now() / 1000),
  ...overrides,
});

// Mock Exchange Rate
export const createMockExchangeRate = (currency = 'EUR', rate = 0.85) => ({
  id: `eur_${Date.now()}`,
  object: 'exchange_rate',
  rates: {
    [currency.toLowerCase()]: rate,
  },
});

// Mock Stripe Error
export class MockStripeError extends Error {
  constructor(message, type = 'card_error', code = 'card_declined') {
    super(message);
    this.type = type;
    this.code = code;
    this.statusCode = 402;
  }
}

// Mock Stripe API
export const createMockStripe = (config = {}) => {
  const {
    shouldFailPaymentIntent = false,
    shouldFailCustomer = false,
    paymentIntentOverrides = {},
    customerOverrides = {},
  } = config;

  return {
    paymentIntents: {
      create: jest.fn().mockImplementation(async (params) => {
        if (shouldFailPaymentIntent) {
          throw new MockStripeError('Payment failed', 'card_error', 'card_declined');
        }
        return createMockPaymentIntent({
          amount: params.amount,
          currency: params.currency,
          metadata: params.metadata,
          ...paymentIntentOverrides,
        });
      }),
      retrieve: jest.fn().mockImplementation(async (id) => {
        return createMockPaymentIntent({ id, ...paymentIntentOverrides });
      }),
      update: jest.fn().mockImplementation(async (id, params) => {
        return createMockPaymentIntent({ id, ...params, ...paymentIntentOverrides });
      }),
      confirm: jest.fn().mockImplementation(async (id) => {
        return createMockPaymentIntent({
          id,
          status: 'succeeded',
          ...paymentIntentOverrides,
        });
      }),
      cancel: jest.fn().mockImplementation(async (id) => {
        return createMockPaymentIntent({
          id,
          status: 'canceled',
          ...paymentIntentOverrides,
        });
      }),
    },
    customers: {
      create: jest.fn().mockImplementation(async (params) => {
        if (shouldFailCustomer) {
          throw new MockStripeError('Customer creation failed', 'api_error');
        }
        return createMockCustomer({
          email: params.email,
          name: params.name,
          metadata: params.metadata,
          ...customerOverrides,
        });
      }),
      retrieve: jest.fn().mockImplementation(async (id) => {
        return createMockCustomer({ id, ...customerOverrides });
      }),
      update: jest.fn().mockImplementation(async (id, params) => {
        return createMockCustomer({ id, ...params, ...customerOverrides });
      }),
    },
    charges: {
      create: jest.fn().mockImplementation(async (params) => {
        return createMockCharge({
          amount: params.amount,
          currency: params.currency,
          customer: params.customer,
        });
      }),
      retrieve: jest.fn().mockImplementation(async (id) => {
        return createMockCharge({ id });
      }),
    },
    exchangeRates: {
      retrieve: jest.fn().mockImplementation(async (currency) => {
        return createMockExchangeRate(currency);
      }),
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((payload, signature, secret) => {
        // Mock webhook event
        return {
          id: 'evt_test_123456',
          object: 'event',
          type: 'payment_intent.succeeded',
          data: {
            object: createMockPaymentIntent({ status: 'succeeded' }),
          },
        };
      }),
    },
  };
};

// Mock Stripe.js (client-side)
export const createMockStripeJs = () => ({
  elements: jest.fn().mockReturnValue({
    create: jest.fn().mockReturnValue({
      mount: jest.fn(),
      unmount: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }),
  }),
  confirmCardPayment: jest.fn().mockResolvedValue({
    paymentIntent: createMockPaymentIntent({ status: 'succeeded' }),
  }),
  confirmPayment: jest.fn().mockResolvedValue({
    paymentIntent: createMockPaymentIntent({ status: 'succeeded' }),
  }),
});

// Helper to setup Stripe mocks
export const setupStripeMocks = (config = {}) => {
  const mockStripe = createMockStripe(config);

  jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => mockStripe);
  });

  return mockStripe;
};

// Mock fetch for Stripe API calls
export const mockStripeFetch = (responseData, shouldFail = false) => {
  global.fetch = jest.fn().mockImplementation(async (url) => {
    if (shouldFail) {
      throw new Error('Network error');
    }

    // Handle different API endpoints
    if (url.includes('/exchange-rate')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            rate: 0.85,
            rateDisplay: '1 USD = 0.85 EUR',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      };
    }

    return {
      ok: true,
      json: async () => responseData,
    };
  });
};

export default {
  createMockPaymentIntent,
  createMockCustomer,
  createMockCharge,
  createMockExchangeRate,
  createMockStripe,
  createMockStripeJs,
  setupStripeMocks,
  mockStripeFetch,
  MockStripeError,
};
