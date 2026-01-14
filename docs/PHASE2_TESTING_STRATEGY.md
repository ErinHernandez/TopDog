# Phase 2: Critical Path Testing Strategy

**Date:** January 2025  
**Status:** In Progress  
**Reference:** `CODE_REVIEW_HANDOFF_REFINED.md` - Phase 2

---

## Overview

Phase 2 focuses on achieving 90% test coverage for critical payment and authentication paths. This document outlines the testing strategy and implementation approach.

---

## Goals

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| Payment Webhooks | ~5% | 90% | P0 - Critical |
| Payment Routes | ~5% | 90% | P0 - Critical |
| Auth Routes | ~5% | 90% | P0 - Critical |
| Overall Coverage | ~5-20% | 60% | P1 - High |

**Timeline:** Weeks 3-6 (40-55 hours)

---

## Testing Infrastructure

### Test Utilities Created

1. **Webhook Mocks** (`__tests__/__mocks__/webhooks.js`)
   - Stripe webhook signature generation
   - PayMongo webhook payloads
   - Paystack webhook events
   - Xendit webhook events
   - Request/response helpers

2. **Existing Factories** (`__tests__/factories/index.js`)
   - Payment factories
   - User factories
   - Request/response factories

3. **Existing Mocks** (`__tests__/__mocks__/`)
   - Stripe mocks
   - Firebase mocks

---

## Payment Webhook Testing

### Test Coverage Requirements

Each webhook handler must test:

1. **Signature Verification**
   - Valid signatures accepted
   - Invalid signatures rejected
   - Missing signatures rejected
   - Replay attack prevention (timestamp validation)

2. **Event Processing**
   - Success events (payment_intent.succeeded, charge.success, etc.)
   - Failure events (payment_failed, etc.)
   - Payout events (payout.paid, disbursement.completed, etc.)
   - Unknown events handled gracefully

3. **Business Logic**
   - Balance updates (deposits)
   - Balance restorations (failed withdrawals)
   - Transaction recording
   - Currency conversion (for multi-currency)
   - Metadata handling

4. **Idempotency**
   - Duplicate events ignored
   - Event tracking in database
   - No double-processing

5. **Error Handling**
   - Database errors handled
   - External API errors handled
   - Always returns 200 (webhook best practice)

### Webhook Test Files

| File | Status | Coverage Target |
|------|--------|----------------|
| `__tests__/api/stripe-webhook.test.js` | ✅ Created | 90% |
| `__tests__/api/paymongo-webhook.test.js` | ⏳ Pending | 90% |
| `__tests__/api/paystack-webhook.test.js` | ⏳ Pending | 90% |
| `__tests__/api/xendit-webhook.test.js` | ⏳ Pending | 90% |

### Example Test Structure

```javascript
describe('/api/stripe/webhook', () => {
  describe('Request Validation', () => {
    // Test method validation, env vars, headers
  });
  
  describe('Signature Verification', () => {
    // Test valid/invalid signatures
  });
  
  describe('Payment Intent Events', () => {
    // Test payment_intent.succeeded, payment_failed, etc.
  });
  
  describe('Payout Events', () => {
    // Test payout.paid, payout.failed
  });
  
  describe('Error Handling', () => {
    // Test error scenarios
  });
});
```

---

## Payment Route Testing

### Routes to Test

| Route | Priority | Test File |
|-------|----------|-----------|
| `pages/api/stripe/payment-intent.ts` | P0 | `__tests__/api/stripe-payment-intent.test.js` |
| `pages/api/stripe/customer.ts` | P0 | `__tests__/api/stripe-customer.test.js` |
| `pages/api/paymongo/payment.ts` | P0 | `__tests__/api/paymongo-payment.test.js` |
| `pages/api/paystack/initialize.ts` | P0 | `__tests__/api/paystack-initialize.test.js` |
| `pages/api/create-payment-intent.js` | P0 | ✅ `__tests__/api/create-payment-intent.test.js` |

### Test Coverage Requirements

1. **Request Validation**
   - HTTP method validation
   - Required fields
   - Amount validation (min/max)
   - Currency validation

2. **Authentication**
   - Valid tokens accepted
   - Invalid tokens rejected
   - Missing auth handled

3. **Rate Limiting**
   - Rate limits enforced
   - Headers set correctly

4. **Payment Processing**
   - Payment intent creation
   - Customer creation/retrieval
   - Error handling

5. **Response Format**
   - Consistent response structure
   - Error messages clear
   - Status codes correct

---

## Authentication Route Testing

### Routes to Test

| Route | Priority | Test File |
|-------|----------|-----------|
| `pages/api/auth/signup.js` | P0 | `__tests__/api/auth-signup.test.js` |
| `pages/api/auth/username/check.js` | P1 | `__tests__/api/auth-username-check.test.js` |
| `pages/api/auth/username/claim.js` | P1 | `__tests__/api/auth-username-claim.test.js` |
| `pages/api/auth/verify-admin.ts` | P1 | `__tests__/api/auth-verify-admin.test.js` |

### Test Coverage Requirements

1. **Signup Flow**
   - User creation
   - Email validation
   - Username validation
   - Duplicate prevention

2. **Username Operations**
   - Availability checking
   - Claiming
   - Validation rules

3. **Admin Verification**
   - Role checking
   - Token validation
   - Permission checks

---

## CI Coverage Enforcement

### Coverage Thresholds

Update `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 20,
    functions: 20,
    lines: 20,
    statements: 20,
  },
  // Payment routes require 90% coverage
  'pages/api/stripe/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  'pages/api/paymongo/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  'pages/api/paystack/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  'pages/api/xendit/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  // Auth routes require 90% coverage
  'pages/api/auth/**/*.{js,ts}': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

### CI Workflow Update

Already implemented in Phase 1:
- Payment route test verification (`scripts/verify-payment-tests.js`)
- Test coverage reporting

Add coverage enforcement:

```yaml
- name: Check test coverage
  run: npm run test:coverage
  continue-on-error: false
```

---

## Implementation Checklist

### Week 3-4: Payment Webhooks
- [x] Create webhook test utilities
- [x] Create Stripe webhook test (example)
- [ ] Create PayMongo webhook test
- [ ] Create Paystack webhook test
- [ ] Create Xendit webhook test
- [ ] Achieve 90% coverage for all webhooks

### Week 4-5: Payment Routes
- [x] Existing: `create-payment-intent.test.js`
- [ ] Create Stripe payment-intent test
- [ ] Create Stripe customer test
- [ ] Create PayMongo payment test
- [ ] Create Paystack initialize test
- [ ] Achieve 90% coverage for all payment routes

### Week 5-6: Auth Routes
- [ ] Create signup test
- [ ] Create username check test
- [ ] Create username claim test
- [ ] Create verify-admin test
- [ ] Achieve 90% coverage for all auth routes

### Week 6: CI Integration
- [ ] Update jest.config.js with coverage thresholds
- [ ] Update CI workflow with coverage enforcement
- [ ] Verify coverage reports in CI
- [ ] Document coverage requirements

---

## Success Metrics

Track weekly:

| Metric | Week 3 | Week 4 | Week 5 | Week 6 |
|--------|--------|--------|--------|--------|
| Payment Webhook Coverage | 25% | 60% | 85% | 90% |
| Payment Route Coverage | 30% | 60% | 85% | 90% |
| Auth Route Coverage | 20% | 50% | 75% | 90% |
| Total Test Files | 15 | 25 | 35 | 40+ |

---

## Best Practices

1. **Test Isolation**
   - Each test should be independent
   - Use `beforeEach` to reset mocks
   - Don't rely on test execution order

2. **Mock Strategy**
   - Mock external services (Stripe, Firebase)
   - Mock file system operations
   - Use factories for test data

3. **Coverage Focus**
   - Test happy paths first
   - Test error cases
   - Test edge cases
   - Test boundary conditions

4. **Maintainability**
   - Use descriptive test names
   - Group related tests with `describe`
   - Keep tests DRY (use helpers)

---

## Related Documents

- `CODE_REVIEW_HANDOFF_REFINED.md` - Phase 2 requirements
- `PHASE1_IMPLEMENTATION_SUMMARY.md` - Phase 1 completion
- `__tests__/api/stripe-webhook.test.js` - Example test file
- `__tests__/__mocks__/webhooks.js` - Webhook test utilities

---

**Next Steps:**
1. Complete PayMongo, Paystack, and Xendit webhook tests
2. Create payment route tests
3. Create auth route tests
4. Update CI with coverage enforcement
