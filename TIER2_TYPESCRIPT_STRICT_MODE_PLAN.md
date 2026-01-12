# Tier 2.1: TypeScript Strict Mode - Implementation Plan

## Overview

Enable TypeScript strict mode incrementally to catch bugs before users find them. This is a gradual migration, not a big-bang rewrite.

**Status:** Phase 1 Started - `noImplicitAny` enabled  
**Approach:** Enable one check at a time, fix errors systematically  
**Timeline:** 20-40 hours over several weeks

---

## Current State

**Before Tier 2:**
```json
{
  "strict": false,
  "noImplicitAny": false,
  "strictNullChecks": false,
  // ... all strict checks disabled
}
```

**After Phase 1:**
```json
{
  "strict": false,
  "noImplicitAny": true,  // ✅ Enabled
  "strictNullChecks": false,  // Phase 2
  // ... other checks still disabled
}
```

---

## Implementation Phases

### Phase 1: Enable `noImplicitAny` ✅ IN PROGRESS

**What it does:** Catches functions/variables without type annotations

**Why start here:** Safest check, catches obvious bugs, easy to fix

**How to check errors:**
```bash
# Run TypeScript compiler to see errors
npx tsc --noEmit --noImplicitAny

# Or use your IDE's TypeScript checker
```

**Fix strategy:**
1. Start with well-typed files (low risk)
2. Add type annotations to functions
3. Use `@ts-expect-error` with comments for exceptions
4. Document why exceptions exist

**Files to start with:**
- ✅ `lib/structuredLogger.ts` - Already well-typed
- ✅ `lib/errorTracking.ts` - Already well-typed
- ✅ `lib/clientLogger.ts` - Already well-typed
- ✅ `lib/serverLogger.ts` - Already well-typed
- `lib/stripe/*.ts` - Payment logic (should be well-typed)
- `components/vx2/**/*.ts` - New components (should be well-typed)

**Files to fix later:**
- `pages/draft/topdog/[roomId].js` - Large JS file, convert to TS first
- `components/draft/v2/**/*.js` - Legacy JS files
- `components/vx/**/*.tsx` - May have some issues

---

### Phase 2: Enable `strictNullChecks` ⏳ NEXT

**What it does:** Prevents null/undefined errors

**Why next:** Catches common runtime errors, but requires more fixes

**Fix strategy:**
1. Add null checks where needed
2. Use optional chaining (`?.`)
3. Use nullish coalescing (`??`)
4. Add proper type guards

**Example fixes:**
```typescript
// Before (might crash)
const name = user.name.toUpperCase();

// After (safe)
const name = user?.name?.toUpperCase() ?? 'Unknown';
```

---

### Phase 3: Enable Full Strict Mode ⏳ LATER

**What it does:** Enables all strict checks at once

**Why last:** Requires fixing all previous issues first

**Includes:**
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitReturns`
- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `useUnknownInCatchVariables`

---

## Error Fixing Strategy

### 1. Add Type Annotations

**Before:**
```typescript
function processPayment(amount, currency) {
  return amount * 1.1;
}
```

**After:**
```typescript
function processPayment(amount: number, currency: string): number {
  return amount * 1.1;
}
```

### 2. Use Type Inference (When Possible)

**Good:**
```typescript
const items = [1, 2, 3]; // TypeScript infers number[]
```

**Also good:**
```typescript
const items: number[] = [1, 2, 3]; // Explicit is fine too
```

### 3. Use `@ts-expect-error` for Exceptions

**When to use:** When you can't fix the error immediately but know it's safe

**Example:**
```typescript
// @ts-expect-error - Legacy API returns any, will fix in refactor
const data = legacyFunction();
```

**Always add a comment explaining why:**
```typescript
// @ts-expect-error - Third-party library types are incomplete
// Issue: https://github.com/library/issues/123
const result = libraryFunction();
```

### 4. Use `unknown` Instead of `any`

**Bad:**
```typescript
function process(data: any) {
  return data.value;
}
```

**Good:**
```typescript
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: number }).value;
  }
  throw new Error('Invalid data');
}
```

---

## Progress Tracking

### Phase 1: `noImplicitAny` ✅ Started

**Status:** Enabled in `tsconfig.json`

**Next Steps:**
1. Run `npx tsc --noEmit --noImplicitAny` to see errors
2. Fix errors in low-risk files first
3. Document exceptions with `@ts-expect-error`
4. Track progress in this document

**Error Count:** TBD (run TypeScript compiler to see)

**Files Fixed:** 0/X

---

## Common Error Patterns

### Pattern 1: Missing Function Parameters

**Error:**
```
Parameter 'userId' implicitly has an 'any' type.
```

**Fix:**
```typescript
function getUser(userId: string) {
  // ...
}
```

### Pattern 2: Missing Return Types

**Error:**
```
Function lacks return type annotation.
```

**Fix:**
```typescript
function calculateTotal(): number {
  return 100;
}
```

### Pattern 3: Implicit Any in Callbacks

**Error:**
```
Parameter 'item' implicitly has an 'any' type.
```

**Fix:**
```typescript
items.map((item: Item) => item.name);
// Or better:
items.map((item) => item.name); // TypeScript infers from items: Item[]
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ `noImplicitAny: true` enabled
- ✅ All errors fixed or documented with `@ts-expect-error`
- ✅ No new `any` types added
- ✅ Build passes with `--noImplicitAny`

### Phase 2 Complete When:
- ✅ `strictNullChecks: true` enabled
- ✅ All null/undefined errors fixed
- ✅ Proper null checks added
- ✅ Build passes with `--strictNullChecks`

### Phase 3 Complete When:
- ✅ `strict: true` enabled
- ✅ All strict mode errors fixed
- ✅ Build passes with `--strict`
- ✅ Code quality improved

---

## Tools & Commands

### Check Errors
```bash
# Check all TypeScript errors
npx tsc --noEmit

# Check with specific flag
npx tsc --noEmit --noImplicitAny
npx tsc --noEmit --strictNullChecks

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### IDE Integration
- VS Code: TypeScript errors show in Problems panel
- Cursor: TypeScript errors show inline
- Enable "TypeScript: Check JS" in settings

### Pre-commit Hook (Future)
```bash
# Prevent committing with TypeScript errors
npm install --save-dev husky lint-staged
# Add to package.json:
# "lint-staged": {
#   "*.{ts,tsx}": ["tsc --noEmit"]
# }
```

---

## Related Documents

- `TIER2_IMPLEMENTATION_STATUS.md` - Overall Tier 2 status
- `TS_CONSISTENCY_IMPROVEMENTS.md` - TypeScript improvements
- `ALL_TIERS_IMPLEMENTATION_STATUS.md` - Master document

---

**Last Updated:** January 2025  
**Next Review:** After Phase 1 errors are fixed
