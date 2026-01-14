# 100% Test Coverage Implementation Plan

**Date:** January 2025  
**Status:** 📋 **PLAN READY FOR IMPLEMENTATION**  
**Goal:** Achieve 100% test coverage across entire codebase

---

## Executive Summary

This plan outlines the systematic approach to achieve 100% test coverage across all API routes, lib files, components, and hooks. The implementation will be done in 8 prioritized phases, starting with critical payment and auth paths, then expanding to cover all remaining code.

**Current State:**
- Existing Tests: 23 test files
- Coverage: 80% global, 90% critical paths
- Target: 100% across all files

**Estimated Total Effort:** 200-300 hours (14-20 weeks)

---

## Phase 1: Critical Payment & Auth Routes (Priority 1)

**Estimated Effort:** 40-60 hours  
**Timeline:** 2-3 weeks  
**Status:** ⏳ Pending

### API Routes Missing Tests

#### Stripe Routes (9 routes)
1. `pages/api/stripe/payment-methods.ts` - List, detach, set default payment methods
2. `pages/api/stripe/setup-intent.ts` - Setup intent creation for saved payment methods
3. `pages/api/stripe/pending-payments.ts` - Query pending payments (OXXO, Boleto, etc.)
4. `pages/api/stripe/cancel-payment.ts` - Cancel pending payments
5. `pages/api/stripe/exchange-rate.ts` - Fetch exchange rates
6. `pages/api/stripe/connect/account.ts` - Stripe Connect account management
7. `pages/api/stripe/connect/payout.ts` - Stripe Connect payouts
8. `pages/api/v1/stripe/payment-intent.ts` - V1 payment intent endpoint
9. `pages/api/v1/stripe/customer.ts` - V1 customer endpoint

#### Paystack Routes (3 routes)
1. `pages/api/paystack/verify.ts` - Payment verification
2. `pages/api/paystack/transfer/initiate.ts` - Transfer initiation
3. `pages/api/paystack/transfer/recipient.ts` - Recipient management

#### PayMongo Routes (2 routes)
1. `pages/api/paymongo/source.ts` - Payment source creation
2. `pages/api/paymongo/payout.ts` - Payout processing

#### Xendit Routes (3 routes)
1. `pages/api/xendit/ewallet.ts` - E-wallet payments
2. `pages/api/xendit/virtual-account.ts` - Virtual account payments
3. `pages/api/xendit/disbursement.ts` - Disbursement processing

#### Auth Routes (4 routes)
1. `pages/api/auth/username/change.js` - Username change
2. `pages/api/auth/username/claim.js` - Username claim
3. `pages/api/auth/username/reserve.js` - Username reservation
4. `pages/api/admin/verify-claims.ts` - Admin claims verification

**Total Routes:** 21 routes  
**Test Files to Create:** ~21 files

### Test Coverage Requirements

Each test file should cover:
- ✅ Request validation
- ✅ Authentication/authorization
- ✅ Rate limiting
- ✅ Success paths
- ✅ Error handling
- ✅ Edge cases
- ✅ Input sanitization

---

## Phase 2: Critical Lib Files (Priority 2)

**Estimated Effort:** 30-40 hours  
**Timeline:** 2-3 weeks  
**Status:** ⏳ Pending

### Payment Service Files

#### Stripe Service
1. `lib/stripe/stripeService.ts` - Core Stripe operations
   - Customer management
   - Payment intent creation
   - Setup intent creation
   - Connect account operations
   - Transaction management
   - Risk assessment

2. `lib/stripe/displayCurrency.ts` - Currency display logic
3. `lib/stripe/firebaseSchema.ts` - Schema utilities

#### PayMongo Service
1. `lib/paymongo/paymongoService.ts` - Core PayMongo operations
   - Source creation
   - Payment processing
   - Payout operations
   - Webhook handling

2. `lib/paymongo/currencyConfig.ts` - Currency configuration

#### Paystack Service
1. `lib/paystack/paystackService.ts` - Core Paystack operations
   - Payment initialization
   - Payment verification
   - Transfer operations
   - Recipient management

2. `lib/paystack/retryUtils.ts` - Retry logic
3. `lib/paystack/currencyConfig.ts` - Currency configuration

#### Xendit Service
1. `lib/xendit/xenditService.ts` - Core Xendit operations
   - E-wallet payments
   - Virtual accounts
   - Disbursements

#### Payment Utilities
1. `lib/paymentProcessor.js` - Payment processing (has partial test)
2. `lib/payments/analytics.ts` - Payment analytics
3. `lib/payments/providers/paystack.ts` - Paystack provider abstraction
4. `lib/payments/providers/paymongo.ts` - PayMongo provider abstraction
5. `lib/payments/providers/xendit.ts` - Xendit provider abstraction

**Total Files:** ~15 files  
**Test Files to Create:** ~15 files

---

## Phase 3: Auth & Security Lib Files (Priority 3)

**Estimated Effort:** 25-35 hours  
**Timeline:** 2 weeks  
**Status:** ⏳ Pending

### Auth Files
1. `lib/apiAuth.js` - API authentication middleware
2. `lib/adminAuth.js` - Admin authentication
3. `lib/webauthn.ts` - WebAuthn support

### Security Files
1. `lib/csrfProtection.js` - CSRF protection middleware
2. `lib/securityLogger.js` - Security event logging
3. `lib/securityMonitoring.js` - Security monitoring
4. `lib/fraudDetection.js` - Fraud detection logic
5. `lib/paymentSecurity.js` - Payment security utilities

### Error Handling
1. `lib/apiErrorHandler.js` - Error handling wrapper (critical)
2. `lib/errorTracking.ts` - Error tracking integration

**Total Files:** ~10 files  
**Test Files to Create:** ~10 files

---

## Phase 4: Utility & Data Lib Files (Priority 4)

**Estimated Effort:** 30-40 hours  
**Timeline:** 2-3 weeks  
**Status:** ⏳ Pending

### Firebase Files
1. `lib/firebase.js` - Firebase initialization
2. `lib/firebase-utils.ts` - Firebase utilities
3. `lib/firebase/queryOptimization.ts` - Query optimization

### Data Management
1. `lib/playerModel.ts` - Player data model
2. `lib/playerPool.js` - Player pool management
3. `lib/dataManager.js` - Data management utilities
4. `lib/tournamentDatabase.js` - Tournament database operations

### Utilities
1. `lib/rateLimitConfig.js` - Rate limiting configuration
2. `lib/rateLimiter.js` - Rate limiter implementation
3. `lib/usernameValidation.js` - Username validation
4. `lib/usernameSimilarity.js` - Username similarity checking
5. `lib/inputSanitization.js` - Input sanitization
6. `lib/draft/stateManager.js` - Draft state management
7. `lib/draft/renderingOptimizations.js` - Rendering optimizations
8. `lib/draft/latencyCompensation.ts` - Latency compensation

**Total Files:** ~15 files  
**Test Files to Create:** ~15 files

---

## Phase 5: NFL & External API Routes (Priority 5)

**Estimated Effort:** 20-30 hours  
**Timeline:** 1-2 weeks  
**Status:** ⏳ Pending

### NFL Routes (18 routes)
1. `pages/api/nfl/bye-weeks.js`
2. `pages/api/nfl/cache-status.js`
3. `pages/api/nfl/current-week.js`
4. `pages/api/nfl/depth-charts.js`
5. `pages/api/nfl/fantasy/adp.js`
6. `pages/api/nfl/fantasy/index.js`
7. `pages/api/nfl/fantasy/rankings.js`
8. `pages/api/nfl/fantasy-live.js`
9. `pages/api/nfl/game/[id].js`
10. `pages/api/nfl/headshots-sportsdataio.js`
11. `pages/api/nfl/headshots.js`
12. `pages/api/nfl/injuries.js`
13. `pages/api/nfl/live.js`
14. `pages/api/nfl/news.js`
15. `pages/api/nfl/player/[id].js`
16. `pages/api/nfl/players.js`
17. `pages/api/nfl/projections.js`
18. `pages/api/nfl/schedule.js`
19. `pages/api/nfl/scores.js`
20. `pages/api/nfl/stats/player.js`
21. `pages/api/nfl/stats/redzone.js`
22. `pages/api/nfl/stats/season.js`
23. `pages/api/nfl/stats/weekly.js`
24. `pages/api/nfl/teams.js`

**Note:** These are read-only data routes, less critical but should be tested for data integrity and error handling.

**Total Routes:** ~24 routes  
**Test Files to Create:** ~24 files

---

## Phase 6: Utility API Routes (Priority 6)

**Estimated Effort:** 15-20 hours  
**Timeline:** 1 week  
**Status:** ⏳ Pending

### Analytics Routes
1. `pages/api/analytics.js` - General analytics endpoint
2. `pages/api/analytics/draft-version.ts` - Draft version tracking

### Health & Monitoring
1. `pages/api/health.ts` - Health check endpoint
2. `pages/api/health-edge.ts` - Edge health check
3. `pages/api/performance/metrics.ts` - Performance metrics

### Migrations
1. `pages/api/migrations/run.ts` - Migration runner
2. `pages/api/migrations/status.ts` - Migration status

### Export
1. `pages/api/export/[...params].js` - Data export endpoint

### User
1. `pages/api/user/display-currency.ts` - Display currency
2. `pages/api/v1/user/display-currency.ts` - V1 display currency

**Total Routes:** ~10 routes  
**Test Files to Create:** ~10 files

---

## Phase 7: Components & Hooks (Priority 7)

**Estimated Effort:** 40-60 hours  
**Timeline:** 3-4 weeks  
**Status:** ⏳ Pending

### Critical Components

#### Draft Room Components
- `components/vx2/draft-room/**/*.tsx` - Draft room components
  - Focus on logic-heavy components first
  - Test state management
  - Test user interactions
  - Test error boundaries

#### Payment Components
- Payment modals and forms
- Payment method selection
- Payment status displays

#### Auth Components
- Signup/signin forms
- Username validation components
- Profile management

### Hooks

#### Data Hooks
- `hooks/useStripeExchangeRate.ts` - ✅ Has test
- `hooks/useDisplayCurrency.ts` - ✅ Has test
- Other data fetching hooks in `components/vx2/hooks/data/`

#### UI Hooks
- Custom UI hooks in `components/vx2/hooks/ui/`
- Draft room hooks in `components/vx2/draft-room/hooks/`

**Total Files:** ~30 components/hooks  
**Test Files to Create:** ~30 files

---

## Phase 8: Remaining Files (Priority 8)

**Estimated Effort:** 20-30 hours  
**Timeline:** 1-2 weeks  
**Status:** ⏳ Pending

### Low-Priority Routes
1. `pages/api/azure-vision/analyze.js` - Vision processing
2. `pages/api/azure-vision/clay-pdf.js` - PDF processing
3. `pages/api/vision/analyze.js` - Vision API
4. `pages/api/test-sentry.ts` - Test endpoint
5. `pages/api/test-latency.ts` - Test endpoint
6. `pages/api/sportsdataio-nfl-test.js` - Test endpoint
7. `pages/api/create-payment-intent.js` - Legacy route (consider deprecating)

### Remaining Lib Files
- All other utility files not covered in previous phases
- Data processing utilities
- Export utilities
- Tournament utilities

**Total Files:** ~15 files  
**Test Files to Create:** ~15 files

---

## Implementation Strategy

### Test Structure

```
__tests__/
├── api/
│   ├── stripe-*.test.js          # Stripe route tests
│   ├── paymongo-*.test.js        # PayMongo route tests
│   ├── paystack-*.test.js        # Paystack route tests
│   ├── xendit-*.test.js          # Xendit route tests
│   ├── auth-*.test.js           # Auth route tests
│   ├── nfl-*.test.js            # NFL route tests
│   └── ...                      # Other route tests
├── lib/
│   ├── stripe-*.test.js         # Stripe service tests
│   ├── paymongo-*.test.js       # PayMongo service tests
│   ├── auth-*.test.js           # Auth lib tests
│   ├── security-*.test.js       # Security lib tests
│   └── ...                      # Other lib tests
├── components/
│   └── ...                      # Component tests
└── hooks/
    └── ...                      # Hook tests
```

### Test Patterns

Follow existing test patterns from Phase 2:

1. **Use Existing Mocks:**
   - `__tests__/__mocks__/webhooks.js` - Webhook mocks
   - Create additional mocks as needed

2. **Test Structure:**
   ```javascript
   describe('Route/Function Name', () => {
     describe('Success Cases', () => {
       // Test happy paths
     });
     
     describe('Error Cases', () => {
       // Test error handling
     });
     
     describe('Edge Cases', () => {
       // Test boundary conditions
     });
     
     describe('Validation', () => {
       // Test input validation
     });
   });
   ```

3. **Mock External Dependencies:**
   - Firebase (Firestore, Auth)
   - Stripe SDK
   - PayMongo SDK
   - Paystack SDK
   - Xendit SDK
   - External APIs

4. **Coverage Requirements:**
   - All code paths
   - All error cases
   - All edge cases
   - All validation logic

### Coverage Configuration

Update `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 100,    // ✅ Updated from 80
    functions: 100,   // ✅ Updated from 80
    lines: 100,       // ✅ Updated from 80
    statements: 100,  // ✅ Updated from 80
  },
  // Critical paths remain at 100%
  './pages/api/stripe/**/*.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
  // ... other critical paths
}
```

---

## Timeline Summary

| Phase | Effort | Timeline | Priority |
|-------|--------|----------|----------|
| Phase 1: Payment/Auth Routes | 40-60 hours | 2-3 weeks | P0 |
| Phase 2: Payment Lib Files | 30-40 hours | 2-3 weeks | P0 |
| Phase 3: Auth/Security Libs | 25-35 hours | 2 weeks | P1 |
| Phase 4: Utility Lib Files | 30-40 hours | 2-3 weeks | P1 |
| Phase 5: NFL Routes | 20-30 hours | 1-2 weeks | P2 |
| Phase 6: Utility Routes | 15-20 hours | 1 week | P2 |
| Phase 7: Components/Hooks | 40-60 hours | 3-4 weeks | P2 |
| Phase 8: Remaining Files | 20-30 hours | 1-2 weeks | P3 |

**Total:** 200-300 hours (14-20 weeks)

---

## Success Criteria

- ✅ 100% coverage on all files in `collectCoverageFrom`
- ✅ All tests passing
- ✅ CI enforcing 100% coverage
- ✅ No uncovered code paths
- ✅ All edge cases tested
- ✅ All error cases tested
- ✅ All validation logic tested

---

## Files to Modify

### Configuration
1. `jest.config.js` - Update coverage thresholds to 100%
2. `.github/workflows/ci.yml` - Ensure coverage enforcement

### Test Files to Create
- **Phase 1:** ~21 test files (API routes)
- **Phase 2:** ~15 test files (Lib files)
- **Phase 3:** ~10 test files (Auth/Security)
- **Phase 4:** ~15 test files (Utilities)
- **Phase 5:** ~24 test files (NFL routes)
- **Phase 6:** ~10 test files (Utility routes)
- **Phase 7:** ~30 test files (Components/Hooks)
- **Phase 8:** ~15 test files (Remaining)

**Total:** ~140 test files to create

---

## Implementation Guidelines

### 1. Start with Critical Paths
- Phase 1-2 are highest priority (payment/auth)
- These have the highest business impact
- Get these to 100% first

### 2. Use Existing Patterns
- Follow patterns from existing tests
- Use `__mocks__/` for external dependencies
- Maintain consistency across test files

### 3. Test Thoroughly
- Test success paths
- Test error paths
- Test edge cases
- Test validation
- Test rate limiting
- Test authentication

### 4. Mock External Dependencies
- Firebase (Firestore, Auth)
- Payment gateways (Stripe, PayMongo, Paystack, Xendit)
- External APIs
- File system operations

### 5. Document as You Go
- Update test documentation
- Document test patterns
- Document mock usage

---

## Quick Reference

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- stripe-payment-methods.test.js

# Watch mode
npm run test:watch
```

### Check Coverage
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Update Coverage Thresholds
```bash
# After completing each phase, update jest.config.js
# Set thresholds to 100% for completed areas
```

---

## Notes

- **Start with critical paths** (Phase 1-2) for maximum impact
- **Use existing test patterns** as templates
- **Mock external dependencies** consistently
- **Test error cases** thoroughly
- **Document test coverage** as we go
- **Update thresholds incrementally** as phases complete

---

## Related Documents

- `CODE_REVIEW_HANDOFF_REFINED.md` - Original code review plan
- `PHASE2_COMPLETE_SUMMARY.md` - Phase 2 testing implementation
- `docs/PHASE2_TESTING_STRATEGY.md` - Testing strategy guide
- `__tests__/api/stripe-webhook.test.js` - Example test file

---

**Document Status:** Plan Complete  
**Last Updated:** January 2025  
**Ready for Implementation:** ✅ Yes
