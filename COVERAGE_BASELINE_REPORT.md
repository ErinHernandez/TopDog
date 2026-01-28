# Coverage Baseline Report - BestBall Fantasy Football Platform

**Generated:** January 27, 2026
**Phase:** 1.4 - Establish Test Coverage Baseline & CI/CD Setup
**Report Version:** 1.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Source Files** | 839 |
| **Test Files** | 77 |
| **Tests Passing** | 856 |
| **Tests Failing** | 245 |
| **Total Tests** | 1,101 |
| **Test Suites** | 76 (21 passing, 55 failing) |

### Overall Coverage

| Metric | Current | Target |
|--------|---------|--------|
| **Statements** | 4.96% | 60%+ |
| **Branches** | 3.61% | 50%+ |
| **Functions** | 4.66% | 60%+ |
| **Lines** | 4.99% | 60%+ |

---

## Coverage by Tier

### Tier 0: Payment/Security (Target: 95%+)

**CRITICAL PRIORITY - Contains financial transaction and security code**

| File | Statements | Branches | Functions | Lines | Gap |
|------|------------|----------|-----------|-------|-----|
| lib/paymentProcessor.ts | 100% | 100% | 100% | 100% | MET |
| lib/paypal/paypalTypes.ts | 100% | 100% | 100% | 100% | MET |
| lib/csrfProtection.ts | 96.66% | 94.44% | 100% | 96.66% | MET |
| lib/stripe/currencyConfig.ts | 96.29% | 100% | 91.66% | 96.15% | MET |
| lib/paystack/retryUtils.ts | 82.81% | 75% | 100% | 82.25% | -12.75% |
| lib/paystack/currencyConfig.ts | 82.3% | 81.42% | 100% | 81.65% | -13.35% |
| lib/rateLimiters.ts | 70.58% | 21.42% | 50% | 70.58% | -24.42% |
| lib/rateLimiter.ts | 30.08% | 22.85% | 43.75% | 30.63% | -64.37% |
| lib/stripe/stripeTypes.ts | 25% | 0% | 0% | 25% | -70% |
| lib/adminAuth.ts | 24.52% | 17.64% | 25% | 24.52% | -70.48% |
| lib/apiAuth.ts | 24.44% | 12.76% | 20% | 24.44% | -70.56% |
| lib/paystack/paystackService.ts | 14.74% | 19.27% | 15.62% | 14.74% | -80.26% |
| lib/stripe/firebaseSchema.ts | 6.89% | 0% | 0% | 6.89% | -88.11% |
| lib/stripe/stripeService.ts | 6.06% | 1.88% | 9.09% | 6.25% | -88.75% |
| lib/stripe/exchangeRates.ts | 5.4% | 0% | 0% | 5.55% | -89.45% |
| lib/paypal/paypalWithdrawals.ts | 5.26% | 9.37% | 5.26% | 5.26% | -89.74% |
| lib/paypal/paypalClient.ts | 4.68% | 2.56% | 0% | 4.68% | -90.32% |
| lib/stripe/currencyIcons.ts | 0% | 0% | 0% | 0% | -95% |
| lib/stripe/displayCurrency.ts | 0% | 0% | 0% | 0% | -95% |
| lib/stripe/index.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paystack/index.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paymongo/* (all files) | 0% | 0% | 0% | 0% | -95% |
| lib/paypal/index.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paypal/paypalOAuth.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paypal/paypalService.ts | 0% | 0% | 0% | 0% | -95% |
| lib/xendit/* (all files) | 0% | 0% | 0% | 0% | -95% |
| lib/webhooks/atomicLock.ts | 0% | 0% | 0% | 0% | -95% |
| lib/bankingSystem.ts | 0% | 100% | 0% | 0% | -95% |
| lib/complianceSystem.ts | 0% | 100% | 0% | 0% | -95% |
| lib/fraudDetection.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paymentHealthMonitor.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paymentMethodConfig.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paymentSecurity.ts | 0% | 0% | 0% | 0% | -95% |
| lib/paymentSystemIntegration.ts | 0% | 0% | 0% | 0% | -95% |
| lib/rateLimitConfig.ts | 0% | 0% | 0% | 0% | -95% |
| lib/rateLimiterV2.ts | 0% | 0% | 0% | 0% | -95% |
| lib/securityLogger.ts | 0% | 0% | 0% | 0% | -95% |
| lib/securityMonitoring.ts | 0% | 0% | 0% | 0% | -95% |
| lib/webauthn.ts | 0% | 0% | 0% | 0% | -95% |

**Tier 0 Summary:**
- Files at target (95%+): 4
- Files below target: 34
- **Average Line Coverage: ~15.5%**
- **Gap to Target: ~79.5%**

---

### Tier 1: Draft/League/User (Target: 90%+)

| File | Statements | Branches | Functions | Lines | Gap |
|------|------------|----------|-----------|-------|-----|
| lib/draft/auditLogger.ts | 88.33% | 75.29% | 89.47% | 89.71% | -0.29% |
| lib/draft/stateManager.ts | 71.96% | 64.94% | 57.37% | 71.84% | -18.16% |
| lib/draft/latencyCompensation.ts | 49.31% | 33.33% | 52.63% | 55% | -35% |
| lib/autodraftLimits.ts | 41.97% | 15% | 33.33% | 41.97% | -48.03% |
| lib/csvToPlayerPool.ts | 0% | 0% | 0% | 0% | -90% |
| lib/draftCompletionTracker.ts | 0% | 0% | 0% | 0% | -90% |
| lib/draftDataIntegration.ts | 0% | 0% | 0% | 0% | -90% |
| lib/mockDrafters.ts | 0% | 0% | 0% | 0% | -90% |
| lib/playerDataContext.tsx | 0% | 0% | 0% | 0% | -90% |
| lib/playerDatabase.ts | 0% | 0% | 0% | 0% | -90% |
| lib/playerModel.ts | 0% | 0% | 0% | 0% | -90% |
| lib/playerPhotos.ts | 0% | 0% | 0% | 0% | -90% |
| lib/playerPool.ts | 0% | 0% | 0% | 0% | -90% |
| lib/tournament/* | 0% | 0% | 0% | 0% | -90% |
| lib/user*.ts (all files) | 0% | 0% | 0% | 0% | -90% |

**Tier 1 Summary:**
- Files at target (90%+): 0
- Files close to target (80-89%): 1
- **Average Line Coverage: ~18.5%**
- **Gap to Target: ~71.5%**

---

### Tier 2: Core Logic (Target: 80%+)

| File | Statements | Branches | Functions | Lines | Gap |
|------|------------|----------|-----------|-------|-----|
| lib/integrity/utils.ts | 100% | 100% | 100% | 100% | MET |
| lib/services/draftPicksService.ts | 97.72% | 89.47% | 100% | 97.61% | MET |
| lib/integrity/validation.ts | 96.29% | 95.94% | 100% | 96% | MET |
| lib/services/playerService.ts | 92.3% | 80% | 91.66% | 94.59% | MET |
| lib/firebase/retryUtils.ts | 94.2% | 81.15% | 100% | 94.07% | MET |
| lib/monitoring/queryMonitor.ts | 90% | 77.77% | 100% | 89.47% | MET |
| lib/integrity/AdpService.ts | 89.36% | 75% | 60% | 89.36% | MET |
| lib/clientLogger.ts | 80% | 58.62% | 81.81% | 88.88% | MET |
| lib/integrity/CrossDraftAnalyzer.ts | 77.47% | 61.81% | 78.94% | 80.41% | MET |
| lib/logger/serverLogger.ts | 80% | 65.38% | 62.5% | 79.16% | -0.84% |
| lib/integrity/config.ts | 80% | 25% | 100% | 77.77% | -2.23% |
| lib/integrity/PostDraftAnalyzer.ts | 71.67% | 56.56% | 96.15% | 68.18% | -11.82% |
| lib/structuredLogger.ts | 61.53% | 42.3% | 50% | 61.53% | -18.47% |
| lib/validation/schemas.ts | 57.97% | 0% | 0% | 58.82% | -21.18% |
| lib/apiErrorHandler.ts | 9.02% | 2.72% | 13.63% | 9.02% | -70.98% |
| lib/errorTracking.ts | 7.05% | 0% | 0% | 8% | -72% |
| lib/integrity/AdminService.ts | 1.81% | 0% | 0% | 1.96% | -78.04% |
| lib/firebase/* (most files) | 0% | 0% | 0% | 0% | -80% |
| lib/integrity/* (several files) | 0% | 0% | 0% | 0% | -80% |

**Tier 2 Summary:**
- Files at target (80%+): 9
- Files close to target (60-79%): 5
- **Average Line Coverage: ~42%**
- **Gap to Target: ~38%**

---

### Tier 3: Data Routes (Target: 60%+)

| File | Lines | Gap |
|------|-------|-----|
| pages/api/create-payment-intent.ts | 45.83% | -14.17% |
| pages/api/nfl/stats/* | 19.56% | -40.44% |
| pages/api/user/* | 4.44% | -55.56% |
| pages/api/admin/integrity/* | 1.61-4.16% | -55.84% |
| All other API routes | 0% | -60% |

**Tier 3 Summary:**
- Files at target (60%+): 0
- **Average Line Coverage: ~4.13%**
- **Gap to Target: ~55.87%**

---

### Tier 4: UI Components (Target: 40%+)

| Area | Coverage | Gap |
|------|----------|-----|
| components/ (overall) | 0% | -40% |
| components/vx2/auth/components | 7.01% | -32.99% |
| components/vx2/utils/formatting | 41.29% | MET |
| components/vx2/draft-logic/constants | 81.81% | MET |
| hooks/ | 41.92% | MET |

**Tier 4 Summary:**
- Folders at target (40%+): 3
- **Average Line Coverage: ~0%**
- **Gap to Target: ~40%**

---

## Critical Coverage Gaps (Priority Order)

### 1. URGENT: Tier 0 Payment Files (0% Coverage)

These files handle real money transactions and MUST be tested:

```
lib/stripe/stripeService.ts           - Main Stripe integration (6.25%)
lib/stripe/exchangeRates.ts           - Currency conversion (5.55%)
lib/paypal/paypalClient.ts            - PayPal API client (4.68%)
lib/paypal/paypalWithdrawals.ts       - Withdrawal processing (5.26%)
lib/paypal/paypalService.ts           - PayPal integration (0%)
lib/paymongo/paymongoService.ts       - PayMongo integration (0%)
lib/xendit/xenditService.ts           - Xendit integration (0%)
lib/webhooks/atomicLock.ts            - Webhook idempotency (0%)
lib/fraudDetection.ts                 - Fraud prevention (0%)
lib/paymentSecurity.ts                - Payment security (0%)
```

### 2. HIGH: Tier 0 Security/Auth Files

```
lib/adminAuth.ts                      - Admin authentication (24.52%)
lib/apiAuth.ts                        - API authentication (24.44%)
lib/rateLimiter.ts                    - Rate limiting (30.63%)
lib/securityMonitoring.ts             - Security monitoring (0%)
lib/webauthn.ts                       - WebAuthn support (0%)
```

### 3. MEDIUM: Tier 1 Draft/League Core

```
lib/draft/stateManager.ts             - Draft state management (71.84%)
lib/draft/latencyCompensation.ts      - Latency handling (55%)
lib/autodraftLimits.ts                - Autodraft rules (41.97%)
lib/playerPool.ts                     - Player pool logic (0%)
lib/draftCompletionTracker.ts         - Draft completion (0%)
```

### 4. MEDIUM: Tier 2 Core Services

```
lib/firebase/firebaseAdapter.ts       - Firebase adapter (0%)
lib/firebase/firebaseAdmin.ts         - Firebase admin (0%)
lib/integrity/AdminService.ts         - Admin integrity (1.96%)
lib/apiErrorHandler.ts                - Error handling (9.02%)
```

---

## Test Suite Health Issues

### Failing Test Suites (55 of 76)

1. **Integration Tests Failing** - Most integration tests have environment issues:
   - `ReferenceError: fetch is not defined` in webhook tests
   - Firebase mock issues in rate limiter tests
   - Timeout issues in payment intent tests

2. **Specific Failures to Address:**
   - `__tests__/lib/snakeDraft.test.ts` - Logic errors in getPicksUntilTurn
   - `__tests__/lib/firebase/retryUtils.test.ts` - Circuit breaker test issues
   - `__tests__/lib/rateLimiter.test.ts` - Mock initialization order
   - `__tests__/api/create-payment-intent.test.js` - Multiple timeout failures

---

## Recommendations

### Immediate Actions (Week 1)

1. **Fix Failing Tests First**
   - Address environment setup issues (missing `fetch` polyfill)
   - Fix mock initialization order in rateLimiter tests
   - Increase timeouts or optimize slow payment tests

2. **Add Critical Tier 0 Tests**
   - lib/stripe/stripeService.ts - Add comprehensive unit tests
   - lib/webhooks/atomicLock.ts - Test idempotency guarantees
   - lib/fraudDetection.ts - Test all fraud detection rules

### Short-term Actions (Weeks 2-4)

1. **Improve Auth Coverage**
   - lib/adminAuth.ts - Test all admin verification paths
   - lib/apiAuth.ts - Test token validation edge cases
   - lib/rateLimiter.ts - Test rate limit enforcement

2. **Add Draft Core Tests**
   - lib/draft/stateManager.ts - Improve from 71% to 90%
   - lib/autodraftLimits.ts - Test limit enforcement

### CI/CD Integration

1. **Add Coverage Thresholds to jest.config.js:**
   ```javascript
   coverageThreshold: {
     global: {
       statements: 10,
       branches: 8,
       functions: 10,
       lines: 10
     },
     './lib/stripe/': { lines: 50 },
     './lib/paypal/': { lines: 50 },
     './lib/webhooks/': { lines: 80 }
   }
   ```

2. **Add Pre-commit Hooks:**
   - Run relevant tests for changed files
   - Enforce coverage on Tier 0/1 files

3. **GitHub Actions Workflow:**
   - Run full test suite on PRs
   - Block merge if coverage drops
   - Generate coverage reports as artifacts

---

## Appendix: Source File Distribution

| Directory | Files | TypeScript | TSX | JavaScript |
|-----------|-------|------------|-----|------------|
| lib/ | 224 | 220 | 4 | 0 |
| pages/ | 173 | 96 | 67 | 10 |
| components/ | 434 | 155 | 202 | 77 |
| hooks/ | 8 | 4 | 0 | 4 |
| **Total** | **839** | **475** | **273** | **91** |

---

## Next Steps

1. Fix the 55 failing test suites
2. Add tests for 0% coverage Tier 0 files
3. Set up CI/CD coverage thresholds
4. Create test templates for common patterns
5. Document testing best practices

---

*Report generated as part of Phase 1.4: Establish Test Coverage Baseline & CI/CD Setup*
