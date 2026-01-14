# Phase 2: Payment Service Libraries - Implementation Plan

**Target Coverage:** 95%+ for Tier 0 business logic  
**Focus:** Business logic only, not SDK wrappers  
**Effort Estimate:** 40-50 hours

---

## Critical Business Logic to Test

### 1. `lib/stripe/stripeService.ts`

#### `assessPaymentRisk` (Risk Assessment Logic)
- Risk scoring algorithm (0-100)
- Risk factor calculation (high_amount, round_amount, country_mismatch, new_device, unusual_time)
- Recommendation determination (approve, review, challenge, manual_review, decline)
- Error handling (should not fail payment if assessment fails)

#### `updateUserBalance` (Balance Operations)
- Adding to balance
- Subtracting from balance
- Insufficient balance validation
- User not found handling
- Error handling

### 2. `lib/paystack/retryUtils.ts`

#### `withRetry` (Generic Retry Logic)
- Exponential backoff calculation
- Retry attempts (maxRetries)
- Retryable error detection
- Custom shouldRetry function
- Error handling and logging

#### `withPaystackRetry` (Paystack-Specific Retry)
- Paystack-specific retry configuration
- Status code handling (5xx, 408, 429)
- Non-retryable 4xx errors
- Network error retries

### 3. `lib/payments/analytics.ts`

#### `trackPaymentEvent` (Analytics Tracking)
- Event tracking (must not lose data)
- Aggregate counter updates (daily/monthly)
- Non-Paystack African country tracking
- Error handling (should not fail main operation)

#### Helper Functions
- `isAfricanCountry`
- `isNonPaystackAfricanCountry`
- `getRecommendedExpansionProvider`

---

## Test Strategy

1. **Focus on Business Logic** - Test the algorithms, not SDK calls
2. **Mock External Dependencies** - Firebase, external APIs
3. **Test Edge Cases** - Boundary conditions, error scenarios
4. **Verify Calculations** - Risk scores, backoff delays, balances
5. **Error Handling** - Graceful failures, logging

---

## Test Files to Create

1. `__tests__/lib/stripe/stripeService-riskAssessment.test.js`
2. `__tests__/lib/stripe/stripeService-balanceOperations.test.js`
3. `__tests__/lib/paystack/retryUtils.test.js`
4. `__tests__/lib/payments/analytics.test.js`
