# Comprehensive Fix Plan
**Date:** January 23, 2026  
**Based On:** Comprehensive Error Report  
**Status:** 📋 Ready for Implementation

---

## Executive Summary

This plan addresses all errors and issues identified in the codebase:

| Priority | Issue | Files | Time | Status |
|----------|-------|-------|------|--------|
| **P0** | localStorage JSON.parse Error | 5 files | 5 min | ✅ Fixed (Jan 25, 2026) |
| **P1** | State Updates After Unmount | ✅ Fixed | 0 min | ✅ Already Fixed |
| **P2** | Test Type Errors | 5 files | 2-4 hours | ⚠️ Needs Fix |
| **P3** | Audio Error Handling | 1 file | 5 min | ✅ Already Implemented |

*TBD = To Be Determined (file may have been refactored/moved)

**Total Estimated Time:** 2.5 - 4.5 hours  
**Critical Fixes:** 1 (if still exists)  
**Non-Critical Fixes:** 1-2

---

## Phase 1: Verification & Discovery (15 minutes)

### Step 1.1: Verify Current State of Reported Bugs

**Objective:** Confirm which bugs still exist and locate exact file locations.

#### Task 1.1.1: Verify localStorage Bug
```bash
# Search for draftRankings localStorage usage
grep -r "draftRankings" --include="*.js" --include="*.ts" --include="*.tsx" .
grep -r "JSON.parse.*rankings\|rankings.*JSON.parse" --include="*.js" --include="*.ts" --include="*.tsx" .
```

**Expected Findings:**
- File location of localStorage rankings parsing
- Current error handling implementation
- Whether bug still exists

**Action:**
- If bug exists: Proceed to Phase 2.1
- If bug fixed: Mark as ✅ and skip to Phase 2.2
- If file moved/refactored: Update file path and proceed

#### Task 1.1.2: Verify useMyTeamsFirebase Fix
**File:** `components/vx2/hooks/data/useMyTeamsFirebase.ts`

**Check:**
- [ ] Lines 171-176: `isMountedRef` exists
- [ ] Lines 199-202: Mounted check before `setTeams()`

**Status:** ✅ **ALREADY FIXED** (verified in code review)

#### Task 1.1.3: Locate Audio Error Handling
```bash
# Search for audio.play().catch patterns
grep -r "audio\.play\(\)\.catch" --include="*.js" --include="*.ts" --include="*.tsx" .
```

**Action:**
- If found: Proceed to Phase 2.3
- If not found: Mark as ✅ and skip

---

## Phase 2: Critical Fixes (P0) - 5-15 minutes

### Phase 2.1: Fix localStorage JSON.parse Error Handling

**Priority:** 🔴 **P0 - CRITICAL**  
**Estimated Time:** 5 minutes  
**Risk Level:** 🟢 **LOW** (Simple error handling fix)

#### Step 2.1.1: Locate the File
**Action:** Use grep results from Phase 1.1.1 to find exact file and line numbers.

#### Step 2.1.2: Implement Fix

**Current Code Pattern (Expected):**
```javascript
try {
  const parsedRankings = JSON.parse(stored);
  setRankings(parsedRankings);
} catch (error) {
  console.error('Error parsing rankings:', error);
  // BUG: No cleanup or fallback
}
```

**Fixed Code:**
```javascript
try {
  const parsedRankings = JSON.parse(stored);
  setRankings(parsedRankings);
} catch (error) {
  console.error('Error parsing rankings:', error);
  // Clear corrupted data from localStorage
  localStorage.removeItem('draftRankings');
  // Set fallback to prevent broken state
  setRankings([]);
}
```

**Alternative Fix (if different storage key):**
```javascript
try {
  const parsedRankings = JSON.parse(stored);
  setRankings(parsedRankings);
} catch (error) {
  console.error('Error parsing rankings:', error);
  // Clear corrupted data - use the actual storage key
  const storageKey = 'draftRankings'; // or 'vx2Rankings', etc.
  localStorage.removeItem(storageKey);
  // Set fallback to prevent broken state
  setRankings([]);
}
```

#### Step 2.1.3: Verify Fix
- [ ] Error handling clears corrupted data
- [ ] Fallback value is set
- [ ] No console errors in catch block
- [ ] User can recover from corrupted state

#### Step 2.1.4: Test Scenarios
1. **Normal Case:** Valid JSON in localStorage → Should parse correctly
2. **Corrupted Data:** Invalid JSON in localStorage → Should clear and set fallback
3. **Missing Data:** No data in localStorage → Should handle gracefully
4. **Empty String:** Empty string in localStorage → Should handle gracefully

**Test Code:**
```javascript
// Simulate corrupted data
localStorage.setItem('draftRankings', 'invalid json{');
// Reload page or trigger parse
// Verify: localStorage cleared, rankings = []
```

---

### Phase 2.2: Verify useMyTeamsFirebase Fix ✅

**Status:** ✅ **ALREADY FIXED**

**Verification:**
- File: `components/vx2/hooks/data/useMyTeamsFirebase.ts`
- Lines 171-176: Mounted ref implementation ✅
- Lines 199-202: Mounted check before state update ✅

**No Action Required** - This fix is already implemented.

---

### Phase 2.3: Fix Audio Error Handling (Optional)

**Priority:** 🟡 **P3 - LOW**  
**Estimated Time:** 5 minutes  
**Risk Level:** 🟢 **LOW**

#### Step 2.3.1: Locate Audio Play Calls
**Action:** Use grep results from Phase 1.1.3

#### Step 2.3.2: Implement Fix

**Current Code Pattern (Expected):**
```javascript
audio.play().catch(() => {}); // Silent failure
```

**Fixed Code:**
```javascript
audio.play().catch((error) => {
  console.warn('Audio play failed:', error);
  // Optional: Track in analytics if needed
});
```

**Enhanced Fix (with user feedback):**
```javascript
audio.play().catch((error) => {
  console.warn('Audio play failed:', error);
  // Optional: Show user-friendly notification
  // toast.warn('Sound notification unavailable');
});
```

#### Step 2.3.3: Verify Fix
- [ ] Errors are logged for debugging
- [ ] No silent failures
- [ ] Optional: User feedback if desired

---

## Phase 3: Test File Type Fixes (P2) - 2-4 hours

### Phase 3.1: Fix Webhook Integration Test Types

**Priority:** 🟡 **P2 - MEDIUM**  
**Estimated Time:** 1-2 hours  
**Risk Level:** 🟢 **LOW** (Test files only, don't affect production)

#### Step 3.1.1: Fix PayMongo Integration Test

**File:** `__tests__/integration/webhooks/paymongo.integration.test.ts`

**Issues:**
- Lines 29-34: `jest.fn<ReturnType, ArgsType>()` - Too many type arguments
- Lines 37-42: `unknown[]` not assignable to `never`

**Fix Strategy 1: Remove Type Arguments (Simplest)**
```typescript
// Before
const mockVerifyWebhookSignature = jest.fn<boolean, any[]>().mockReturnValue(true);
const mockHandleSourceChargeable = jest.fn<Promise<{ success: boolean; actions: string[] }>, any[]>();

// After
const mockVerifyWebhookSignature = jest.fn().mockReturnValue(true);
const mockHandleSourceChargeable = jest.fn<Promise<{ success: boolean; actions: string[] }>>();
```

**Fix Strategy 2: Use Proper Mock Types**
```typescript
// Before
jest.mock('../../../lib/paymongo', () => ({
  verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
}));

// After
jest.mock('../../../lib/paymongo', () => ({
  verifyWebhookSignature: mockVerifyWebhookSignature,
  handleSourceChargeable: mockHandleSourceChargeable,
  // ... etc
}));
```

**Implementation Steps:**
1. Remove type arguments from `jest.fn()` calls (use only return type if needed)
2. Simplify mock implementations in `jest.mock()`
3. Use direct function references instead of wrappers

#### Step 3.1.2: Fix Paystack Integration Test

**File:** `__tests__/integration/webhooks/paystack.integration.test.ts`

**Same Pattern:** Apply same fixes as PayMongo test

#### Step 3.1.3: Fix Stripe Integration Test

**File:** `__tests__/integration/webhooks/stripe.integration.test.ts`

**Additional Issue:**
- Line 127: Buffer type issue

**Fix:**
```typescript
// Before
const buffer = Buffer.from('test');
mockVerifyWebhookSignature(buffer, ...);

// After
const buffer = Buffer.from('test') as unknown as string;
// Or use proper type assertion
```

#### Step 3.1.4: Fix Xendit Integration Test

**File:** `__tests__/integration/webhooks/xendit.integration.test.ts`

**Same Pattern:** Apply same fixes as PayMongo test

---

### Phase 3.2: Fix Audit Logger Test Types

**File:** `__tests__/lib/draft/auditLogger.test.ts`

**Issues:**
- Lines 34-35: Mock type incompatibilities
- Lines 85+: Type conversion issues with `undefined`
- Lines 85+: Tuple index errors

**Fix Strategy:**

**Step 3.2.1: Fix Mock Types**
```typescript
// Before
const mockGetDoc = jest.fn<() => Promise<string>>();
mockGetDoc.mockResolvedValue('doc_123');

// After
const mockGetDoc = jest.fn<() => Promise<string>>();
mockGetDoc.mockResolvedValue('doc_123' as unknown as string);
// Or better: Use proper mock implementation
const mockGetDoc = jest.fn().mockResolvedValue('doc_123');
```

**Step 3.2.2: Fix Type Conversions**
```typescript
// Before
const event = mockGetEvents.mock.results[0].value as AuditEvent;

// After
const result = mockGetEvents.mock.results[0];
if (result && result.value) {
  const event = result.value as AuditEvent;
  // Use event
}
```

**Step 3.2.3: Fix Tuple Index Errors**
```typescript
// Before
const [first, second] = mockGetEvents.mock.results;

// After
const results = mockGetEvents.mock.results;
if (results && results.length >= 2) {
  const first = results[0]?.value;
  const second = results[1]?.value;
}
```

---

### Phase 3.3: Fix Integrity Integration Test

**File:** `__tests__/lib/integrity/integration.test.ts`

**Issue:**
- Line 96: Type conversion for NextApiRequest mock

**Fix:**
```typescript
// Before
const req = {
  method: 'GET',
  headers: { authorization: 'Bearer token' },
  query: { draftId: '123' },
} as NextApiRequest;

// After
const req = {
  method: 'GET',
  headers: { authorization: 'Bearer token' },
  query: { draftId: '123' },
  // Add required NextApiRequest properties
  cookies: {},
  body: {},
  env: {},
  // ... other required properties
} as unknown as NextApiRequest;

// Or use a proper mock library
import { createMocks } from 'node-mocks-http';
const { req, res } = createMocks<NextApiRequest, NextApiResponse>();
```

---

## Phase 4: Testing & Verification (30 minutes)

### Step 4.1: Run TypeScript Type Check

```bash
# Check production code only
npx tsc --noEmit 2>&1 | grep -v "__tests__"

# Expected: No errors
```

### Step 4.2: Run Full Type Check

```bash
# Check all files including tests
npm run type-check

# Expected: Reduced errors (or 0 if all test fixes applied)
```

### Step 4.3: Run Linter

```bash
npm run lint

# Expected: No errors
```

### Step 4.4: Run Production Build

```bash
npm run build

# Expected: Build succeeds
```

### Step 4.5: Run Tests

```bash
npm test

# Expected: All tests pass
```

### Step 4.6: Manual Testing

**Test localStorage Fix:**
1. Open browser DevTools
2. Set corrupted data: `localStorage.setItem('draftRankings', 'invalid json{')`
3. Reload page
4. Verify: localStorage cleared, rankings reset to []

**Test State Update Fix:**
1. Navigate to My Teams page
2. Quickly navigate away before data loads
3. Verify: No React warnings in console

**Test Audio Fix (if applied):**
1. Trigger audio play in draft room
2. Block audio in browser settings
3. Verify: Warning logged in console

---

## Phase 5: Documentation & Cleanup (15 minutes)

### Step 5.1: Update Error Report

- [ ] Mark fixed issues as ✅
- [ ] Update file paths if changed
- [ ] Note any issues that couldn't be fixed

### Step 5.2: Create Fix Summary

**Template:**
```markdown
# Fix Implementation Summary
**Date:** [Date]
**Fixes Applied:** [List]
**Time Taken:** [Duration]
**Status:** ✅ Complete
```

### Step 5.3: Update Related Documentation

- [ ] Update BUG_HUNT_ENTERPRISE_2025.md if bugs fixed
- [ ] Update BUILD_FAILURES_INVESTIGATION.md if test errors fixed
- [ ] Add notes to relevant code files if needed

---

## Implementation Checklist

### Pre-Implementation
- [ ] Read this plan completely
- [ ] Verify current state of all bugs (Phase 1)
- [ ] Create feature branch: `fix/error-handling-improvements`
- [ ] Backup current state: `git stash` or commit current work

### Critical Fixes (P0)
- [x] Phase 2.1: Fix localStorage JSON.parse error ✅ (5 files updated)
- [x] Phase 2.2: Verify useMyTeamsFirebase (already fixed) ✅
- [x] Phase 2.3: Fix audio error handling (already implemented) ✅

### Test Fixes (P2)
- [ ] Phase 3.1: Fix webhook integration tests (4 files)
- [ ] Phase 3.2: Fix audit logger test
- [ ] Phase 3.3: Fix integrity integration test

### Verification
- [ ] Phase 4.1: TypeScript type check (production)
- [ ] Phase 4.2: Full type check
- [ ] Phase 4.3: Linter check
- [ ] Phase 4.4: Production build
- [ ] Phase 4.5: Run tests
- [ ] Phase 4.6: Manual testing

### Documentation
- [ ] Phase 5.1: Update error report
- [ ] Phase 5.2: Create fix summary
- [ ] Phase 5.3: Update related docs

### Post-Implementation
- [ ] Commit changes with descriptive messages
- [ ] Create PR with fix summary
- [ ] Request code review
- [ ] Merge after approval

---

## Risk Assessment

### Low Risk Fixes
- ✅ localStorage error handling (simple catch block update)
- ✅ Audio error handling (add logging)
- ✅ Test type fixes (don't affect production)

### Medium Risk Fixes
- ⚠️ Test mock changes (could break tests if done incorrectly)

### Mitigation Strategies
1. **Test After Each Fix:** Run tests after each file fix
2. **Incremental Commits:** Commit each fix separately
3. **Backup First:** Stash or commit current work
4. **Review Changes:** Use `git diff` to review before committing

---

## Time Estimates

| Phase | Task | Time | Cumulative |
|-------|------|------|------------|
| Phase 1 | Verification | 15 min | 15 min |
| Phase 2.1 | localStorage Fix | 5 min | 20 min |
| Phase 2.2 | Verify useMyTeamsFirebase | 0 min | 20 min |
| Phase 2.3 | Audio Fix (optional) | 5 min | 25 min |
| Phase 3.1 | Webhook Tests (4 files) | 1-2 hours | 1.5-2.5 hours |
| Phase 3.2 | Audit Logger Test | 30 min | 2-3 hours |
| Phase 3.3 | Integrity Test | 15 min | 2.25-3.25 hours |
| Phase 4 | Testing & Verification | 30 min | 2.75-3.75 hours |
| Phase 5 | Documentation | 15 min | 3-4 hours |

**Total Estimated Time:** 3-4 hours (if all fixes applied)

---

## Quick Start Guide

For developers who want to fix issues quickly:

### 5-Minute Fix (Critical Only)
1. Find localStorage bug (Phase 1.1.1)
2. Apply fix (Phase 2.1.2)
3. Test (Phase 4.6 - localStorage test)
4. Commit

### 30-Minute Fix (Critical + Audio)
1. Do 5-minute fix above
2. Find audio issues (Phase 1.1.3)
3. Apply audio fix (Phase 2.3.2)
4. Test (Phase 4.6)
5. Commit

### Full Fix (All Issues)
1. Follow complete plan from Phase 1 through Phase 5
2. Estimated time: 3-4 hours

---

## Success Criteria

### Critical Fixes
- ✅ localStorage error clears corrupted data
- ✅ Fallback value set on parse error
- ✅ No user-facing bugs from corrupted data

### Test Fixes
- ✅ TypeScript compiles with 0 errors (or only acceptable test errors)
- ✅ All tests pass
- ✅ No new type errors introduced

### Code Quality
- ✅ No linter errors
- ✅ Production build succeeds
- ✅ Code follows best practices

---

## Notes

1. **File Locations May Vary:** Some files mentioned in bug reports may have been refactored. Always verify current locations in Phase 1.

2. **Test Errors Are Optional:** Test file type errors don't block production builds. Fix them incrementally if desired.

3. **Incremental Approach:** Fixes can be applied incrementally. Start with critical fixes, then move to test fixes.

4. **Code Review:** All fixes should be reviewed before merging to main branch.

---

**Plan Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** 📋 Ready for Implementation
