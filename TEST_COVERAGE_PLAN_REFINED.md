# Test Coverage Implementation Plan (Refined)

**Date:** January 2025  
**Status:** 📋 Ready for Review  
**Goal:** Achieve meaningful test coverage with sustainable maintenance

---

## Why the Original Plan Won't Work

The original plan targets 100% test coverage. This is a mistake. Here's why:

| Problem | Reality |
|---------|---------|
| **100% coverage is a vanity metric** | You can have 100% coverage and still ship bugs. Coverage measures lines executed, not behavior verified. |
| **200-300 hours for 140 test files** | That's 1.4-2.1 hours per test file. Real-world test files for payment routes take 4-8 hours each when done properly. |
| **Maintenance burden** | 140 test files means 140 files to update when code changes. Tests become a tax on velocity. |
| **Diminishing returns** | Going from 80% to 100% often means testing getters, setters, and error logging—not business logic. |
| **False confidence** | "100% coverage" creates complacency. Teams stop thinking critically about what to test. |

**The right question isn't "how do we get to 100%?" It's "what tests give us confidence to deploy?"**

---

## Revised Strategy: Risk-Based Coverage

Instead of targeting a number, target **risk reduction**.

### Coverage Targets by Risk Tier

| Tier | Risk Level | Coverage Target | Examples |
|------|------------|-----------------|----------|
| **Tier 0** | Money touches it | 95%+ | Payment processing, webhooks, payouts |
| **Tier 1** | Security/Auth | 90%+ | Authentication, authorization, CSRF |
| **Tier 2** | Core Business Logic | 80%+ | Draft logic, scoring, league management |
| **Tier 3** | Data Fetching | 60%+ | NFL data routes, player stats |
| **Tier 4** | UI Components | 40%+ | Presentational components |
| **Tier 5** | Utilities | Case-by-case | Logging, analytics, config |

### What This Means in Practice

**Tier 0 (Payments):** Test every code path. Mock nothing internally. Test with realistic data. Include integration tests against Stripe test mode.

**Tier 4 (UI Components):** Test that buttons call handlers. Don't test that CSS classes are applied. Snapshot tests are fine here.

**Tier 5 (Utilities):** If `console.log` wrapper breaks, you'll know immediately. Don't write tests for it.

---

## Phase 1: Payment Routes (Tier 0)

**Target Coverage:** 95%+  
**Realistic Effort:** 60-80 hours  
**Timeline:** 3-4 weeks

### What Actually Needs Testing

The original plan lists 21 payment/auth routes. Let's categorize by actual risk:

#### Critical (Must Have 95%+ Coverage)

| Route | Risk | Test Priority |
|-------|------|---------------|
| `stripe/webhook.ts` | Handles real money | P0 - Test EVERY event type |
| `stripe/payment-intent.ts` | Creates charges | P0 - Test all payment methods |
| `stripe/connect/payout.ts` | Sends money out | P0 - Test success + all failure modes |
| `paystack/verify.ts` | Validates payments | P0 - Test valid, invalid, expired |
| `paystack/transfer/initiate.ts` | Sends money | P0 - Test all transfer scenarios |
| `paymongo/source.ts` | Creates payment sources | P0 - Test each source type |
| `paymongo/payout.ts` | Sends payouts | P0 - Test success + failures |
| `xendit/disbursement.ts` | Sends money | P0 - Test all disbursement types |

#### Important (Should Have 85%+ Coverage)

| Route | Risk | Test Priority |
|-------|------|---------------|
| `stripe/payment-methods.ts` | User-facing, not money-moving | P1 |
| `stripe/setup-intent.ts` | Saves cards, doesn't charge | P1 |
| `stripe/cancel-payment.ts` | Affects pending payments | P1 |
| `xendit/ewallet.ts` | Payment initiation | P1 |
| `xendit/virtual-account.ts` | Payment initiation | P1 |

#### Lower Priority (70%+ Coverage Fine)

| Route | Risk | Test Priority |
|-------|------|---------------|
| `stripe/pending-payments.ts` | Read-only query | P2 |
| `stripe/exchange-rate.ts` | Informational | P2 |
| `stripe/connect/account.ts` | Account management | P2 |

### Test Structure for Payment Routes

Don't just test "success" and "error". Test **realistic scenarios**:

```javascript
describe('POST /api/stripe/webhook', () => {
  // ✅ GOOD: Tests actual business scenarios
  describe('payment_intent.succeeded', () => {
    it('credits user account when payment completes', async () => {});
    it('handles duplicate webhook deliveries idempotently', async () => {});
    it('fails gracefully when user account not found', async () => {});
    it('logs payment to analytics', async () => {});
  });

  describe('payment_intent.payment_failed', () => {
    it('does NOT debit user account', async () => {});
    it('sends failure notification to user', async () => {});
    it('records failure reason for support', async () => {});
  });

  describe('charge.dispute.created', () => {
    it('freezes user account pending review', async () => {});
    it('alerts fraud team', async () => {});
  });

  // ❌ BAD: Tests implementation details
  describe('validation', () => {
    it('returns 400 for missing signature header', async () => {}); // Who cares about status code?
    it('calls verifyWebhookSignature', async () => {}); // Testing that code runs isn't useful
  });
});
```

### Realistic Time Estimates

| Route | Original Estimate | Realistic Estimate | Notes |
|-------|-------------------|-------------------|-------|
| Webhook handler | ~2 hours | 8-12 hours | 15+ event types, each with 3-5 scenarios |
| Payment intent | ~2 hours | 6-8 hours | Multiple payment methods, currencies, error modes |
| Payout routes | ~2 hours each | 4-6 hours each | Must test idempotency, retries, partial failures |
| Simple query routes | ~2 hours | 1-2 hours | Actually reasonable |

**Phase 1 Total:** 60-80 hours (not 40-60)

---

## Phase 2: Payment Service Libraries (Tier 0)

**Target Coverage:** 95%+  
**Realistic Effort:** 40-50 hours  
**Timeline:** 2-3 weeks

### Focus on Business Logic, Not Wrappers

The original plan lists service files without distinguishing between:
- **Business logic** (must test thoroughly)
- **SDK wrappers** (test integration, not unit)

#### Test Thoroughly (Unit Tests)

| File | Why |
|------|-----|
| `lib/stripe/stripeService.ts` - Risk assessment logic | Makes decisions about fraud |
| `lib/stripe/stripeService.ts` - Transaction fee calculation | Affects money |
| `lib/paystack/retryUtils.ts` | Controls retry behavior |
| `lib/payments/analytics.ts` | Must not lose data |

#### Test Integration Only

| File | Why |
|------|-----|
| `lib/stripe/stripeService.ts` - SDK method calls | Stripe SDK is already tested by Stripe |
| `lib/paymongo/paymongoService.ts` - API calls | Test against sandbox, not with mocks |
| Provider abstraction files | Test that the right provider is selected |

### Integration Test Example

```javascript
// Instead of mocking Stripe SDK...
describe('StripeService integration', () => {
  // Use Stripe test mode with test API keys
  const stripe = new Stripe(process.env.STRIPE_TEST_KEY);

  it('creates payment intent with correct amount', async () => {
    const intent = await stripeService.createPaymentIntent({
      amount: 1000,
      currency: 'usd',
      customerId: 'cus_test123',
    });

    // Verify in Stripe test dashboard
    expect(intent.amount).toBe(1000);
    expect(intent.currency).toBe('usd');
  });
});
```

This catches real bugs that mocked tests miss (API version changes, field renames, etc.).

---

## Phase 3: Auth & Security (Tier 1)

**Target Coverage:** 90%+  
**Realistic Effort:** 30-40 hours  
**Timeline:** 2 weeks

### Security Code Requires Different Testing

Security code needs **adversarial testing**, not just happy-path coverage:

```javascript
describe('CSRF Protection', () => {
  // ❌ BAD: Only tests that it works when used correctly
  it('accepts valid CSRF token', async () => {});
  it('rejects missing CSRF token', async () => {});

  // ✅ GOOD: Tests attack scenarios
  it('rejects token from different session', async () => {});
  it('rejects expired token', async () => {});
  it('rejects token with tampered signature', async () => {});
  it('rejects token replay after logout', async () => {});
  it('handles timing attacks on comparison', async () => {});
});
```

### Auth Test Priorities

| File | Test Focus |
|------|------------|
| `lib/apiAuth.js` | Token validation, expiry, refresh, revocation |
| `lib/adminAuth.js` | Permission escalation prevention |
| `lib/csrfProtection.js` | Attack vector coverage |
| `lib/fraudDetection.js` | False positive/negative rates |

---

## Phase 4: Core Business Logic (Tier 2)

**Target Coverage:** 80%+  
**Realistic Effort:** 30-40 hours  
**Timeline:** 2-3 weeks

### Draft Logic is Complex

The original plan underestimates draft room testing. Draft logic involves:
- Real-time state synchronization
- Race conditions (two users picking same player)
- Timer management
- Undo/redo
- Disconnection recovery

**Recommended approach:** Focus on **state machine testing**:

```javascript
describe('Draft State Machine', () => {
  describe('state transitions', () => {
    it('WAITING -> ACTIVE when all players ready', () => {});
    it('ACTIVE -> PAUSED when commissioner pauses', () => {});
    it('ACTIVE -> PICKING when timer starts', () => {});
    it('PICKING -> PICKED when selection made', () => {});
    it('cannot transition COMPLETED -> ACTIVE', () => {});
  });

  describe('pick validation', () => {
    it('rejects pick when not your turn', () => {});
    it('rejects already-drafted player', () => {});
    it('rejects pick after timer expires', () => {});
    it('handles simultaneous picks correctly', () => {}); // Race condition
  });
});
```

---

## Phase 5: Data Routes (Tier 3)

**Target Coverage:** 60%+  
**Realistic Effort:** 15-20 hours  
**Timeline:** 1 week

### NFL Routes Are Low Risk

The original plan dedicates 20-30 hours to 24 NFL data routes. This is overkill.

**These routes:**
- Are read-only
- Return cached data
- Don't affect user state
- Fail gracefully (show stale data)

**Test strategy:**
- One comprehensive test per route type (not per route)
- Focus on error handling and caching behavior
- Skip testing data transformation (it's obvious when it breaks)

```javascript
// One test covers the pattern for all NFL routes
describe('NFL Data Routes', () => {
  it('returns cached data when available', async () => {});
  it('fetches fresh data when cache expired', async () => {});
  it('returns stale data when upstream fails', async () => {});
  it('sets appropriate cache headers', async () => {});
});
```

**Phase 5 Total:** 15-20 hours (not 20-30)

---

## Phase 6: Components & Hooks (Tier 4)

**Target Coverage:** 40%+  
**Realistic Effort:** 20-30 hours  
**Timeline:** 2 weeks

### Don't Over-Test UI Components

The original plan allocates 40-60 hours to component testing. Most of this is wasted effort.

**What to test:**
- Complex state logic
- User interaction handlers
- Conditional rendering logic
- Error boundaries

**What NOT to test:**
- That className is applied
- That text renders
- That props are passed to children
- Snapshot tests of everything

```javascript
// ❌ WASTEFUL: Testing React works
it('renders player name', () => {
  render(<PlayerCard player={mockPlayer} />);
  expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
});

// ✅ VALUABLE: Testing business logic
it('disables draft button when player already drafted', () => {
  render(<PlayerCard player={mockPlayer} isDrafted={true} />);
  expect(screen.getByRole('button', { name: /draft/i })).toBeDisabled();
});

// ✅ VALUABLE: Testing interaction
it('calls onDraft with player ID when draft button clicked', () => {
  const onDraft = jest.fn();
  render(<PlayerCard player={mockPlayer} onDraft={onDraft} />);
  fireEvent.click(screen.getByRole('button', { name: /draft/i }));
  expect(onDraft).toHaveBeenCalledWith(mockPlayer.id);
});
```

---

## Revised Timeline

| Phase | Scope | Coverage Target | Effort | Timeline |
|-------|-------|-----------------|--------|----------|
| 1 | Payment Routes | 95% | 60-80 hrs | 3-4 weeks |
| 2 | Payment Libraries | 95% | 40-50 hrs | 2-3 weeks |
| 3 | Auth & Security | 90% | 30-40 hrs | 2 weeks |
| 4 | Core Business Logic | 80% | 30-40 hrs | 2-3 weeks |
| 5 | Data Routes | 60% | 15-20 hrs | 1 week |
| 6 | Components | 40% | 20-30 hrs | 2 weeks |

**Total: 195-260 hours (12-16 weeks)**

This is similar total time to the original, but produces **more valuable tests** because effort is allocated by risk, not by file count.

---

## What to Remove from the Original Plan

### Drop These Entirely

| Item | Why |
|------|-----|
| 100% global coverage target | Vanity metric |
| Testing test endpoints (`test-sentry.ts`, `test-latency.ts`) | They're tests themselves |
| Testing config files | They fail loudly at startup |
| Testing logging utilities | Obvious when broken |
| Snapshot tests for all components | Maintenance nightmare |

### Deprioritize These

| Item | Why |
|------|-----|
| `lib/firebase.js` | Firebase SDK is well-tested |
| Export utilities | Low usage, obvious failures |
| Analytics tracking | Not critical path |
| Azure Vision routes | Presumably low traffic |

---

## Coverage Configuration (Realistic)

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    // Tier 0: Money
    './pages/api/stripe/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paystack/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paymongo/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/xendit/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/stripe/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Tier 1: Auth
    './lib/apiAuth.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/csrfProtection.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Global (achievable baseline)
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

---

## Success Metrics (What Actually Matters)

### Track These

| Metric | Target | Why |
|--------|--------|-----|
| Payment route test failures in CI | 0 | Blocks bad deploys |
| Time to write test for new payment feature | < 2 hours | Sustainable velocity |
| Production payment bugs per quarter | < 2 | Actual quality |
| Test suite runtime | < 5 minutes | Developers will skip slow tests |

### Don't Track These

| Metric | Why It's Misleading |
|--------|---------------------|
| Overall coverage percentage | Incentivizes bad tests |
| Number of test files | Quantity ≠ quality |
| Lines of test code | More isn't better |

---

## First Week Deliverables

Instead of planning 140 test files, start with **5 high-value tests**:

1. **`stripe/webhook.ts`** - Test `payment_intent.succeeded` and `payment_intent.failed` events
2. **`stripe/payment-intent.ts`** - Test happy path + insufficient funds + card declined
3. **`paystack/verify.ts`** - Test valid, invalid, and expired payment verification
4. **`lib/apiAuth.js`** - Test token validation + expiry + refresh
5. **`lib/csrfProtection.js`** - Test valid token + attack scenarios

**These 5 tests provide more value than 50 tests of utility functions.**

---

## Summary: Original vs. Refined

| Aspect | Original Plan | Refined Plan |
|--------|---------------|--------------|
| Goal | 100% coverage | Risk-appropriate coverage |
| Test count | 140 files | ~60-80 files |
| Effort estimate | 200-300 hours | 195-260 hours |
| Payment coverage | 100% | 95% (same outcome) |
| UI component coverage | 100% | 40% (appropriate) |
| Maintenance burden | Unsustainable | Manageable |
| Value delivered | Coverage number | Deployment confidence |

The refined plan delivers **equal or better protection** for critical paths while being **sustainable long-term**.

---

**Document Status:** Ready for Review  
**Key Change:** Risk-based coverage instead of blanket 100%  
**Next Step:** Review and approve approach before starting Phase 1
