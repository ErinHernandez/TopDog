# Testing Guide for TopDog

## Overview

This document describes the testing infrastructure for the TopDog fantasy football platform. Our testing strategy covers unit tests, integration tests, and end-to-end tests to ensure code quality and reliability.

## Test Coverage Status

**Current Coverage**: Starting at ~5% → Target: 80%

| Component Type | Current | 3 Months | 6 Months | 12 Months |
|----------------|---------|----------|----------|-----------|
| Payment Logic | 40% | 80% | 90% | 95% |
| Authentication | 30% | 70% | 85% | 90% |
| API Endpoints | 20% | 60% | 75% | 85% |
| Draft Logic | 10% | 70% | 85% | 90% |
| Utilities | 25% | 80% | 90% | 95% |
| UI Components | 5% | 40% | 60% | 75% |
| Custom Hooks | 40% | 70% | 85% | 90% |
| E2E Flows | <5% | 30% | 50% | 70% |

## Quick Start

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run cypress:open
```

## Testing Stack

### Unit & Integration Testing
- **Jest** - Test runner and assertion library
- **@testing-library/react** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - DOM matchers

### E2E Testing
- **Cypress** - End-to-end testing framework

### Mocking
- Custom Firebase mocks (`__tests__/__mocks__/firebase.js`)
- Custom Stripe mocks (`__tests__/__mocks__/stripe.js`)
- Test data factories (`__tests__/factories/`)

## Project Structure

```
TopDog/
├── __tests__/
│   ├── __mocks__/           # Mock implementations
│   │   ├── firebase.js      # Firebase auth, firestore mocks
│   │   └── stripe.js        # Stripe payment mocks
│   ├── factories/           # Test data factories
│   │   └── index.js         # Mock data creators
│   ├── api/                 # API endpoint tests
│   │   └── create-payment-intent.test.js
│   ├── hooks/               # Custom hooks tests
│   │   ├── useStripeExchangeRate.test.js
│   │   └── useDisplayCurrency.test.js
│   ├── lib/                 # Library/utility tests
│   │   ├── paymentProcessor.test.js
│   │   ├── autodraftLimits.test.js
│   │   └── firebase-auth.test.js
│   ├── currencyConfig.test.js
│   ├── currencyFormatting.test.js
│   ├── PlayerPool.test.js
│   └── pickTracking.test.js
├── cypress/
│   ├── e2e/
│   │   ├── draftRoom.cy.js
│   │   └── payment-flow.cy.js  # NEW: Comprehensive payment E2E
│   └── support/
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Jest setup
└── cypress.config.js        # Cypress configuration
```

## Writing Tests

### Unit Tests

#### Testing Utilities

```javascript
import { calculateFees } from '../../lib/paymentProcessor';

describe('Payment Processor', () => {
  it('should calculate Stripe fee (2.9%)', () => {
    const fee = calculateFees(10000, 'stripe'); // $100.00
    expect(fee).toBe(290); // $2.90
  });
});
```

#### Testing React Hooks

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useStripeExchangeRate } from '../../hooks/useStripeExchangeRate';

describe('useStripeExchangeRate', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should fetch exchange rate for EUR', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: { currency: 'EUR', rate: 0.85 },
      }),
    });

    const { result } = renderHook(() => useStripeExchangeRate('EUR'));

    await waitFor(() => {
      expect(result.current.rate).toBe(0.85);
    });
  });
});
```

#### Testing API Endpoints

```javascript
import handler from '../../pages/api/create-payment-intent';
import { createMockRequest, createMockResponse } from '../factories';

describe('/api/create-payment-intent', () => {
  it('should create payment intent with valid amount', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { amount: 5000, userId: 'user-123' },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          clientSecret: expect.any(String),
        }),
      })
    );
  });
});
```

### Integration Tests

Integration tests verify multiple components working together:

```javascript
describe('Payment Flow Integration', () => {
  it('should process payment end-to-end', async () => {
    // 1. Create payment intent
    const paymentIntent = await createPaymentIntent(5000);

    // 2. Confirm payment
    const result = await confirmPayment(paymentIntent.clientSecret);

    // 3. Verify balance update
    const user = await getUser(userId);
    expect(user.balance).toBe(5000);
  });
});
```

### E2E Tests

E2E tests simulate real user interactions:

```javascript
describe('Payment Flow E2E', () => {
  it('should complete full deposit flow', () => {
    cy.visit('/deposit');
    cy.get('[data-cy=amount-50]').click();
    cy.get('[data-cy=card-number]').type('4242424242424242');
    cy.get('[data-cy=card-expiry]').type('12/25');
    cy.get('[data-cy=card-cvc]').type('123');
    cy.get('[data-cy=confirm-payment-button]').click();
    cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
  });
});
```

## Test Data Factories

Use factories to create consistent test data:

```javascript
import {
  createMockUser,
  createMockTournament,
  createMockPayment,
} from '../factories';

const user = createMockUser({ balance: 10000 });
const tournament = createMockTournament({ entryFee: 1000 });
const payment = createMockPayment({ amount: 5000, currency: 'USD' });
```

## Mocking

### Firebase Mocking

```javascript
import { createMockAuth, createMockFirestore } from '../__mocks__/firebase';

const mockAuth = createMockAuth(mockUser);
const mockFirestore = createMockFirestore({
  users: {
    'user-123': { username: 'testuser', balance: 10000 },
  },
});
```

### Stripe Mocking

```javascript
import { createMockStripe, mockStripeFetch } from '../__mocks__/stripe';

const mockStripe = createMockStripe({
  shouldFailPaymentIntent: false,
});

// Mock fetch for exchange rates
mockStripeFetch({
  ok: true,
  data: { currency: 'EUR', rate: 0.85 },
});
```

## Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

This generates:
- Terminal summary
- HTML report in `coverage/`
- LCOV report for CI tools

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
coverageThresholds: {
  global: {
    branches: 20,
    functions: 20,
    lines: 20,
    statements: 20,
  },
}
```

Thresholds will increase over time as coverage improves.

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:ci
      - run: npm run cypress:run
```

### Pre-commit Hooks

Install Husky for pre-commit testing:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test -- --findRelatedTests"
```

## Best Practices

### 1. Test Naming

```javascript
// ✅ Good: Descriptive, clear intent
it('should reject amounts below $5 minimum', () => {});

// ❌ Bad: Vague, unclear
it('should work', () => {});
```

### 2. Arrange-Act-Assert Pattern

```javascript
it('should calculate fees correctly', () => {
  // Arrange
  const amount = 10000;
  const method = 'stripe';

  // Act
  const fee = calculateFees(amount, method);

  // Assert
  expect(fee).toBe(290);
});
```

### 3. Test Independence

```javascript
// ✅ Good: Each test is independent
beforeEach(() => {
  mockLocalStorage = {};
});

// ❌ Bad: Tests depend on each other
let sharedState = {};
```

### 4. Mock External Dependencies

```javascript
// ✅ Good: Mock Firebase
jest.mock('../../lib/firebase');

// ❌ Bad: Use real Firebase (slow, unreliable)
```

### 5. Test Edge Cases

```javascript
describe('Edge Cases', () => {
  it('should handle null input', () => {});
  it('should handle empty array', () => {});
  it('should handle negative numbers', () => {});
  it('should handle very large numbers', () => {});
});
```

## Testing Priority Areas

### 🔴 Critical (Must Test)

1. **Payment Processing** - Revenue impact
   - Stripe integration
   - Currency conversion
   - Fee calculation
   - Payment validation

2. **Authentication** - Security impact
   - Sign in/sign out
   - Session management
   - Custom claims
   - Access control

3. **Draft Logic** - Core feature
   - Pick tracking
   - Turn management
   - Player selection
   - Draft completion

4. **API Endpoints** - Data integrity
   - Request validation
   - Authentication
   - Error handling
   - Response formatting

### 🟡 High Priority

5. **Custom Hooks** - Reusability
6. **User Management** - Data accuracy
7. **Tournament Logic** - Business rules

### 🟢 Medium Priority

8. **UI Components** - User experience
9. **Utilities** - Helper functions
10. **Styling** - Visual regression

## Troubleshooting

### Common Issues

#### Tests fail with "Cannot find module"

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Firebase tests hang

```javascript
// Ensure auth is disabled in tests
jest.mock('../../lib/firebase', () => ({
  isAuthEnabled: jest.fn(() => false),
}));
```

#### Cypress tests timeout

```javascript
// Increase timeout for slow operations
cy.get('[data-cy=payment-success]', { timeout: 10000 });
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Firebase Testing](https://firebase.google.com/docs/rules/unit-tests)

## Contributing

When adding new features:

1. Write tests BEFORE implementation (TDD)
2. Ensure coverage doesn't decrease
3. Add E2E tests for critical flows
4. Update this documentation

## Questions?

Contact the development team or open an issue in the repository.

---

**Last Updated**: January 2026
**Maintained By**: TopDog Development Team
