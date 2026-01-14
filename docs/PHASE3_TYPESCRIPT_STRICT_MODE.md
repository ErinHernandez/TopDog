# Phase 3: TypeScript Strict Mode Implementation

**Date:** January 2025  
**Status:** 🚧 **IN PROGRESS**  
**Reference:** `CODE_REVIEW_HANDOFF_REFINED.md` - Phase 3

---

## Overview

Phase 3 focuses on enabling TypeScript strict mode incrementally to improve type safety across the codebase. This document tracks the implementation approach and progress.

---

## Strategy: Incremental Enablement

Following the refined plan, we're enabling strict flags **ONE AT A TIME** to avoid overwhelming errors:

### Week 1-2: ✅ `noImplicitAny` (Already Enabled)
- ✅ Already enabled in `tsconfig.json`
- ✅ Payment and auth routes are well-typed (no `any` types found)

### Week 3-4: 🚧 `strictNullChecks` (In Progress)
- ✅ Enabled in `tsconfig.json`
- ⏳ Fixing null/undefined issues in payment/auth routes
- ⏳ Adding proper type guards where needed

### Week 5: `strictFunctionTypes` + `strictBindCallApply`
- ⏳ Enable and fix function type issues
- ⏳ Fix bind/call/apply issues

### Week 6: `strictPropertyInitialization` + `noImplicitThis`
- ⏳ Enable and fix property initialization issues
- ⏳ Fix implicit `this` issues

### Week 7: `alwaysStrict` + Final `strict: true`
- ⏳ Enable alwaysStrict
- ⏳ Enable full strict mode
- ⏳ Final verification

---

## Current Status

### ✅ Completed

1. **`noImplicitAny` Enabled**
   - Status: ✅ Already enabled
   - Payment routes: ✅ No `any` types found
   - Auth routes: ✅ No `any` types found

2. **`strictNullChecks` Enabled**
   - Status: ✅ Enabled in `tsconfig.json`
   - Next: Fix null/undefined issues

3. **TypeScript Error Checker Script**
   - Status: ✅ Created (`scripts/check-typescript-errors.js`)
   - Usage: `node scripts/check-typescript-errors.js`

---

## Common Patterns to Fix

### 1. Optional Properties

**Before:**
```typescript
const email = body.email; // Could be undefined
```

**After:**
```typescript
const email = body.email; // Type: string | undefined
if (!email) {
  // Handle missing email
}
```

### 2. Function Returns That Might Be Null

**Before:**
```typescript
const config = getCurrencyConfig(currency);
// Assumes config is never null
```

**After:**
```typescript
const config = getCurrencyConfig(currency);
// getCurrencyConfig always returns CurrencyConfig (has fallback)
// No change needed if function guarantees non-null return
```

### 3. Optional Chaining Results

**Before:**
```typescript
const country = body.riskContext?.country || 'US';
```

**After:**
```typescript
const country = body.riskContext?.country ?? 'US';
// Use nullish coalescing (??) instead of || for better null handling
```

### 4. Array Access

**Before:**
```typescript
const firstItem = array[0]; // Could be undefined
```

**After:**
```typescript
const firstItem = array[0];
if (!firstItem) {
  // Handle empty array
}
```

---

## Files to Review

### Priority 1: Payment Routes (Critical)
- `pages/api/stripe/payment-intent.ts`
- `pages/api/stripe/customer.ts`
- `pages/api/paymongo/payment.ts`
- `pages/api/paystack/initialize.ts`

### Priority 2: Auth Routes
- `pages/api/auth/signup.js` (JS file - may need conversion)
- `pages/api/auth/username/check.js` (JS file)
- `pages/api/auth/verify-admin.ts`

### Priority 3: Webhook Handlers
- `pages/api/stripe/webhook.ts`
- `pages/api/paymongo/webhook.ts`
- `pages/api/paystack/webhook.ts`
- `pages/api/xendit/webhook.ts`

---

## Verification Steps

1. **Check for errors:**
   ```bash
   node scripts/check-typescript-errors.js
   ```

2. **Fix errors incrementally:**
   - Start with payment routes
   - Then auth routes
   - Then webhook handlers
   - Finally, other routes

3. **Verify no regressions:**
   ```bash
   npm test
   npm run build
   ```

---

## Success Criteria

- ✅ `strictNullChecks` enabled
- ⏳ Zero TypeScript errors in payment routes
- ⏳ Zero TypeScript errors in auth routes
- ⏳ All strict flags enabled
- ⏳ Full `strict: true` enabled
- ⏳ CI blocks new `any` types

---

## Notes

- Payment routes are already well-typed (no `any` types found)
- `getCurrencyConfig` always returns a value (has USD fallback)
- Most issues will be around optional properties and null checks
- JS files (`.js`) won't be checked by TypeScript - consider converting to `.ts`

---

**Document Status:** In Progress  
**Next Update:** After fixing strictNullChecks errors  
**Related:** `CODE_REVIEW_HANDOFF_REFINED.md`, `tsconfig.json`
