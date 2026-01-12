# TypeScript Compiler Results - `noImplicitAny` Errors

**Date:** January 2025  
**Compiler:** TypeScript 5.9.3  
**Command:** `tsc --noEmit --noImplicitAny`  
**Total Errors Found:** ~200+ errors (initial) → 77 errors (after first fixes) → 76 errors (after db fixes) → 69 errors (after more fixes) → 60 errors → 47 errors (after API route parameter fixes) → TBD (final)

---

## Error Categories

### 1. Firebase `db` Variable Errors (~100+ errors)
**Issue:** `db` imported from `@/lib/firebase` is implicitly typed as `any` in many locations.

**Affected Files:**
- `lib/customization/geolocation.ts` (5 errors)
- `lib/customization/storage.ts` (5 errors)
- `lib/location/consentManager.ts` (5 errors)
- `lib/location/locationService.ts` (7 errors)
- `lib/location/securityService.ts` (5 errors)
- `lib/payments/analytics.ts` (4 errors)
- `lib/paymongo/paymongoService.ts` (11 errors)
- `lib/paystack/paystackService.ts` (10 errors)
- `lib/stripe/displayCurrency.ts` (4 errors)
- `lib/stripe/firebaseSchema.ts` (5 errors)
- `lib/stripe/stripeService.ts` (10 errors)
- `lib/xendit/xenditService.ts` (11 errors)
- `pages/api/paymongo/payout.ts` (2 errors)
- `pages/api/paystack/transfer/initiate.ts` (5 errors)
- `pages/api/paystack/transfer/recipient.ts` (4 errors)
- `pages/api/stripe/connect/payout.ts` (2 errors)
- `pages/api/stripe/webhook.ts` (4 errors)
- `pages/api/xendit/disbursement.ts` (2 errors)
- `components/vx2/draft-room/hooks/useDraftPicks.ts` (2 errors)
- `components/vx2/hooks/data/useMyTeams.firebase-example.ts` (6 errors)
- `components/vx2/hooks/data/useMyTeams.firebase.ts` (2 errors)
- `components/vx2/hooks/data/useMyTeams.seasonal-example.ts` (5 errors)
- `components/vx2/hooks/data/useMyTeamsFirebase.ts` (2 errors)
- `components/vx2/hooks/data/useTransactionHistory.ts` (3 errors)
- `components/vx2/location/hooks/useLocationConsent.ts` (2 errors)
- `components/vx2/location/hooks/useLocationTracking.ts` (2 errors)

**Root Cause:** The `db` export from `lib/firebase` needs explicit typing.

**Fix:** Add explicit type annotation to `db` export in `lib/firebase/index.ts` or `lib/firebase/firebase.ts`.

---

### 2. API Route Handler Parameters (~15 errors)
**Issue:** API route handlers have `req`, `res`, and `logger` parameters implicitly typed as `any`.

**Affected Files:**
- `pages/api/auth/verify-admin.ts` (3 errors)
- `pages/api/stripe/connect/account.ts` (3 errors)
- `pages/api/stripe/connect/payout.ts` (3 errors)
- `pages/api/stripe/customer.ts` (3 errors)
- `pages/api/stripe/exchange-rate.ts` (3 errors)
- `pages/api/stripe/payment-intent.ts` (3 errors)
- `pages/api/stripe/payment-methods.ts` (3 errors)
- `pages/api/stripe/setup-intent.ts` (3 errors)
- `pages/api/user/display-currency.ts` (3 errors)

**Fix:** Add explicit types: `req: NextApiRequest`, `res: NextApiResponse`, `logger: ScopedLogger`.

---

### 3. Missing ErrorType.STRIPE (~8 errors)
**Issue:** `ErrorType.STRIPE` is referenced but doesn't exist in the enum.

**Affected Files:**
- `pages/api/stripe/connect/account.ts` (2 errors)
- `pages/api/stripe/connect/payout.ts` (1 error)
- `pages/api/stripe/customer.ts` (2 errors)
- `pages/api/stripe/payment-intent.ts` (1 error)
- `pages/api/stripe/payment-methods.ts` (3 errors)
- `pages/api/stripe/setup-intent.ts` (1 error)

**Fix:** Add `STRIPE: 'STRIPE_ERROR'` to `ErrorType` enum in `lib/apiErrorHandler.js`.

---

### 4. Component Type Errors (~10 errors)
**Issue:** Various component files have implicit `any` types.

**Affected Files:**
- `components/vx/constants/colors.ts` - Object literal property 'FLEX' implicitly has 'any' type
- `components/vx2/core/constants/colors.ts` - Object literal property 'FLEX' implicitly has 'any' type
- `components/vx2/auth/components/PhoneAuthModal.tsx` - Property 'flag' does not exist
- `components/vx2/auth/hooks/useUsernameValidation.ts` - Missing properties
- `components/vx2/draft-room/components/PicksBar.tsx` - Function expression lacks return type
- `components/vx2/providers/StripeProvider.tsx` - Function expression lacks return type

**Fix:** Add explicit types to object literals and function expressions.

---

### 5. Customization Storage Type Errors (~5 errors)
**Issue:** Type mismatches in `lib/customization/storage.ts`.

**Errors:**
- Type 'string' is not assignable to type '"none" | "solid" | "flag"'
- This expression is always nullish
- Type 'string' is not assignable to type 'OverlayPattern'
- Type 'string | number' is not assignable to type 'number'

**Fix:** Add proper type guards and type assertions.

---

### 6. Paystack Metadata Type Error (~1 error)
**Issue:** `lib/payments/providers/paystack.ts` - metadata value type mismatch.

**Error:** Type 'unknown' is not assignable to type 'string | number'.

**Fix:** Add type assertion or type guard for metadata values.

---

### 7. Error Tracking Type Error (~1 error)
**Issue:** `lib/errorTracking.ts` - `withErrorTracking` return type issue.

**Error:** Type 'unknown' is not assignable to type 'ReturnType<T>'.

**Fix:** Improve generic type handling in `withErrorTracking`.

---

### 8. Sentry Config Errors (~3 errors)
**Issue:** Sentry integration properties don't exist in current version.

**Errors:**
- Property 'BrowserTracing' does not exist
- Property 'Replay' does not exist
- Property 'Integrations' does not exist

**Fix:** Update Sentry config to use correct API for `@sentry/nextjs` version.

---

### 9. Stripe Webhook Errors (~3 errors)
**Issue:** Type mismatches in webhook handler.

**Errors:**
- Missing 'userId' property in logPaymentEvent call
- Block-scoped variable 'logPaymentEvent' used before declaration
- Expected 2 arguments, but got 3

**Fix:** Fix function signature and call order.

---

## Priority Fix Order

### High Priority (Critical Paths)
1. ✅ **Firebase `db` typing** - Fixes ~100 errors across many files
2. ✅ **API route handler types** - Fixes ~15 errors in critical API routes
3. ✅ **ErrorType.STRIPE** - Fixes ~8 errors in payment APIs

### Medium Priority
4. ✅ **Customization storage types** - Fixes ~5 errors
5. ✅ **Paystack metadata type** - Fixes ~1 error
6. ✅ **Error tracking return type** - Fixes ~1 error
7. ✅ **Stripe webhook types** - Fixes ~3 errors

### Low Priority (Non-Critical)
8. ⏳ **Component type errors** - Fixes ~10 errors in UI components
9. ⏳ **Sentry config** - Fixes ~3 errors (Sentry not fully set up yet)

---

## Next Steps

1. Fix Firebase `db` export typing (highest impact)
2. Fix API route handler parameter types
3. Add `ErrorType.STRIPE` to enum
4. Fix remaining type errors systematically

---

**Last Updated:** January 2025
