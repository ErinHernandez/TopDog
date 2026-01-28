# 23 Bugs Found in Codebase - Comprehensive Report
**Date:** January 27, 2026  
**Scope:** Full codebase audit based on Comprehensive Improvement Plan 2026  
**Status:** 🔴 **23 BUGS IDENTIFIED**

---

## Executive Summary

This report documents **23 bugs** found in the codebase that need to be addressed. These bugs are organized by priority and category:

- **P0 (Critical):** 8 bugs - Security vulnerabilities, data integrity issues
- **P1 (High):** 8 bugs - Missing validation, error handling issues
- **P2 (Medium):** 7 bugs - Type safety, code quality issues

---

## 🔴 P0: CRITICAL BUGS (Security & Data Integrity)

### Bug #32: Missing Input Validation in Export Route
**File:** `pages/api/export/[...params].ts`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Missing ownership verification for draft/user exports
- Users could potentially export other users' data if they know the ID
- No validation that the requester owns the resource being exported

**Current Code (Line 160):**
```typescript
// Only checks if userId query param matches authenticated user
if (authenticatedReq.user && requesterId && !verifyUserAccess(authenticatedReq.user.uid, requesterId)) {
  // This only validates the userId param, not the actual resource ownership
}
```

**Fix Required:**
- Add explicit ownership verification for each export type (draft, user, tournament)
- Verify user owns the draft before allowing export
- Add resource-level access checks

**Impact:** Users could export other users' draft data or tournament data

---

### Bug #33: Unhandled Promise in Draft Submit-Pick
**File:** `pages/api/draft/submit-pick.ts:354`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Fire-and-forget promise for collusion analysis
- If the promise fails silently, draft completion may not be tracked
- No retry mechanism if the analysis service is down

**Current Code:**
```typescript
collusionFlagService.markDraftCompleted(roomId).catch((error) => {
  logger.error('Failed to mark draft as completed for collusion analysis', error as Error);
  // ❌ No retry, no queue, no fallback
});
```

**Fix Required:**
- Use a proper background job queue (e.g., Firestore queue)
- Add retry logic with exponential backoff
- Or use a fire-and-forget wrapper that guarantees at-least-once delivery

**Impact:** Draft completion may not be tracked, collusion analysis may be missed

---

### Bug #34: Unsafe API Parsing in NFL Fantasy Index
**File:** `pages/api/nfl/fantasy/index.ts`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **PARTIALLY FIXED** (has validation but could be improved)

**Issue:**
- While validation exists, it's custom and could miss edge cases
- Should use Zod schema for runtime validation
- Type assertions without runtime checks

**Current Code (Line 45-100):**
```typescript
function validateExternalApiResponse(data: unknown): FantasyPlayer[] {
  // Custom validation - could miss edge cases
  if (!Array.isArray(data)) {
    throw new Error('External API response is not an array');
  }
  // ... custom validation logic
}
```

**Fix Required:**
- Replace with Zod schema validation
- Add comprehensive type checking
- Validate all fields at runtime

**Impact:** Malformed external API responses could cause runtime errors or data corruption

---

### Bug #35: Weak Admin Auth in Integrity Drafts Route
**File:** `pages/api/admin/integrity/drafts/[draftId].ts:23`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Admin verification exists but error response doesn't include requestId
- Missing explicit type checking for admin claims
- Error response leaks information about admin endpoint existence

**Current Code:**
```typescript
const admin = await verifyAdminAccess(req.headers.authorization);
if (!admin.isAdmin) {
  const errorResponse = createErrorResponse(
    ErrorType.UNAUTHORIZED,
    'Unauthorized - Admin access required',
    {}, // ❌ Empty details - should not leak endpoint info
    res.getHeader('X-Request-ID') as string | undefined // ⚠️ Could be undefined
  );
}
```

**Fix Required:**
- Ensure requestId is always present
- Return generic error messages (don't confirm admin endpoint exists)
- Add explicit type checking for admin claims

**Impact:** Information leakage, potential security vulnerability

---

### Bug #36: Missing Rate Limit in PayPal Withdraw
**File:** `pages/api/paypal/withdraw.ts`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- No rate limiting on withdrawal endpoint
- Users could spam withdrawal requests
- Could lead to financial abuse or DoS

**Current Code:**
```typescript
// ❌ No rate limiting wrapper
export default withCSRFProtection(handler as unknown as CSRFHandler);
```

**Fix Required:**
- Add rate limiting (e.g., 5 withdrawals per hour)
- Use `withRateLimit` wrapper
- Add to rate limit configuration

**Impact:** Financial abuse, potential DoS attack vector

---

### Bug #37: Weak Amount Validation in PayPal Withdraw
**File:** `pages/api/paypal/withdraw.ts:44`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Basic type checking but no comprehensive validation
- No minimum/maximum amount checks
- No currency validation
- No check for negative amounts beyond type check

**Current Code:**
```typescript
if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
  return res.status(400).json({ error: 'Invalid amount' });
}
// ❌ No minimum, no maximum, no currency check
```

**Fix Required:**
- Add Zod schema with min/max validation
- Validate currency if applicable
- Check for reasonable limits (e.g., minimum $1, maximum $10,000)
- Validate against user balance more explicitly

**Impact:** Invalid withdrawal amounts could be processed

---

### Bug #38: IDOR Vulnerability in Slow Drafts
**File:** `pages/api/slow-drafts/index.ts:200`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **PARTIALLY FIXED** (has check but could be improved)

**Issue:**
- Ownership verification exists but could be bypassed
- Query parameter `userId` is optional - if not provided, uses authenticated user
- But if provided and doesn't match, should reject more explicitly
- No verification that user actually owns the drafts being returned

**Current Code:**
```typescript
const { userId: requestedUserId } = req.query;
if (requestedUserId && typeof requestedUserId === 'string') {
  if (!verifyUserAccess(authenticatedUserId, requestedUserId)) {
    return res.status(403).json({ /* ... */ });
  }
}
// ⚠️ But then queries all drafts and filters in memory - could leak data
```

**Fix Required:**
- Always use authenticated user ID for queries (never trust query param)
- Remove userId query parameter entirely
- Add explicit ownership checks for each draft returned

**Impact:** Users could potentially see other users' draft data

---

### Bug #39: Error Info Leakage in Admin Integrity Route
**File:** `pages/api/admin/integrity/drafts/[draftId].ts:78`  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Error response includes draftId which could leak information
- Should return generic errors for unauthorized access
- Details object includes sensitive information

**Current Code:**
```typescript
const errorResponse = createErrorResponse(
  ErrorType.NOT_FOUND,
  'Draft not found or not analyzed',
  { draftId }, // ❌ Leaks draftId in error response
  res.getHeader('X-Request-ID') as string | undefined
);
```

**Fix Required:**
- Return generic error messages
- Don't include draftId in error responses
- Log details server-side only

**Impact:** Information leakage about draft existence and analysis status

---

## 🟠 P1: HIGH PRIORITY BUGS (Missing Validation & Error Handling)

### Bug #40: Missing requestId in Export Error Response
**File:** `pages/api/export/[...params].ts:240`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- `createErrorResponse` called without requestId parameter
- Error tracking may not work correctly

**Current Code:**
```typescript
const errorResponse = createErrorResponse(
  ErrorType.NOT_FOUND,
  'No data found for export',
  { exportType, id }
  // ❌ Missing requestId parameter
);
```

**Fix Required:**
```typescript
const errorResponse = createErrorResponse(
  ErrorType.NOT_FOUND,
  'No data found for export',
  { exportType, id },
  res.getHeader('X-Request-ID') as string
);
```

**Impact:** Error tracking and debugging may fail

---

### Bug #41: Unsafe Type Assertion in Export Route
**File:** `pages/api/export/[...params].ts:245`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Double type assertion without validation
- `errorResponse.body as unknown as ExportResponse` is unsafe

**Current Code:**
```typescript
return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as ExportResponse);
```

**Fix Required:**
- Use proper type checking
- Or ensure errorResponse.body matches ExportResponse structure

**Impact:** Type safety issues, potential runtime errors

---

### Bug #42: Missing Zod Validation in PayPal Withdraw
**File:** `pages/api/paypal/withdraw.ts:41`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as WithdrawBody` without runtime validation
- Should use Zod schema validation

**Current Code:**
```typescript
const { amountCents, linkedAccountId, confirmationMethod } = req.body as WithdrawBody;
// ❌ No runtime validation
```

**Fix Required:**
- Create Zod schema for WithdrawBody
- Use `validateRequestBody` helper
- Validate all fields at runtime

**Impact:** Invalid data could be processed, type safety issues

---

### Bug #43: Missing Error Handling in Slow Drafts Query
**File:** `pages/api/slow-drafts/index.ts:240`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Firestore query could fail but error handling is in outer try-catch
- No specific handling for permission errors
- Could expose database structure in errors

**Current Code:**
```typescript
const snapshot = await getDocs(q);
// ⚠️ Error handling is in outer try-catch, but could be more specific
```

**Fix Required:**
- Add specific error handling for Firestore errors
- Handle permission-denied errors gracefully
- Don't expose database structure in error messages

**Impact:** Database errors could leak information

---

### Bug #44: Missing Input Validation in Paystack Transfer Routes
**File:** `pages/api/paystack/transfer/recipient.ts:158`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as CreateRecipientRequest` without Zod validation
- Multiple routes use unsafe type assertions

**Current Code:**
```typescript
const {
  userId,
  accountNumber,
  bankCode,
  accountName,
} = req.body as CreateRecipientRequest;
// ❌ No runtime validation
```

**Fix Required:**
- Create Zod schemas for all Paystack request types
- Use `validateRequestBody` helper
- Validate all transfer-related requests

**Impact:** Invalid transfer data could be processed

---

### Bug #45: Missing Rate Limiting in Xendit Routes
**File:** `pages/api/xendit/disbursement.ts`  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- No rate limiting on disbursement endpoint
- Could be abused for financial attacks

**Fix Required:**
- Add rate limiting wrapper
- Configure appropriate limits (e.g., 10/hour)

**Impact:** Financial abuse, DoS potential

---

### Bug #46: Missing Validation in Stripe Setup Intent
**File:** `pages/api/stripe/setup-intent.ts` (referenced in audit)  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as SetupIntentRequestBody` without validation
- Should use Zod schema

**Fix Required:**
- Create Zod schema
- Use `validateRequestBody` helper

**Impact:** Invalid setup intent data could be processed

---

### Bug #47: Missing Validation in Stripe Cancel Payment
**File:** `pages/api/stripe/cancel-payment.ts` (referenced in audit)  
**Severity:** 🟠 **HIGH**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as CancelPaymentRequest` without validation
- Should use Zod schema

**Fix Required:**
- Create Zod schema
- Use `validateRequestBody` helper

**Impact:** Invalid cancel payment requests could be processed

---

## 🟡 P2: MEDIUM PRIORITY BUGS (Type Safety & Code Quality)

### Bug #48: Unsafe Type Assertion in Paystack Initialize
**File:** `pages/api/paystack/initialize.ts` (referenced in audit)  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as InitializeRequest` without validation

**Fix Required:**
- Add Zod schema validation

**Impact:** Type safety issues

---

### Bug #49: Missing Type Safety in Analytics Route
**File:** `pages/api/analytics.ts:215`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as AnalyticsRequest` without validation
- Multiple type assertions in error responses

**Current Code:**
```typescript
const { event, userId, sessionId, timestamp } = req.body as AnalyticsRequest;
// ❌ No runtime validation
```

**Fix Required:**
- Add Zod schema validation
- Validate all analytics events

**Impact:** Invalid analytics data could be stored

---

### Bug #50: Missing Validation in User Display Currency
**File:** `pages/api/user/display-currency.ts:187`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as Partial<SetDisplayCurrencyBody>` without validation
- Partial type allows undefined values without checking

**Fix Required:**
- Add Zod schema with required fields
- Validate currency codes against allowed list

**Impact:** Invalid currency data could be set

---

### Bug #51: Missing Validation in Draft Withdraw
**File:** `pages/api/drafts/[draftId]/withdraw.ts:57`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as WithdrawRequest` without validation
- Should validate draftId and userId

**Fix Required:**
- Add Zod schema validation
- Verify user owns the draft

**Impact:** Invalid withdrawal requests could be processed

---

### Bug #52: Missing Validation in Paymongo Payout
**File:** `pages/api/paymongo/payout.ts:75`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as CreatePayoutBody` without validation

**Fix Required:**
- Add Zod schema validation

**Impact:** Type safety issues

---

### Bug #53: Missing Validation in Xendit Disbursement
**File:** `pages/api/xendit/disbursement.ts:75`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as CreateDisbursementBody` without validation

**Fix Required:**
- Add Zod schema validation

**Impact:** Type safety issues

---

### Bug #54: Missing Validation in PayPal Orders
**File:** `pages/api/paypal/orders.ts:39`  
**Severity:** 🟡 **MEDIUM**  
**Status:** ⚠️ **NEEDS FIX**

**Issue:**
- Uses `req.body as CreateOrderBody` without validation
- Risk context is optional but not validated

**Fix Required:**
- Add Zod schema validation
- Validate risk context structure if provided

**Impact:** Invalid order data could be processed

---

## Summary

### Bug Count by Priority
- **P0 (Critical):** 8 bugs
- **P1 (High):** 8 bugs  
- **P2 (Medium):** 7 bugs
- **Total:** 23 bugs

### Bug Count by Category
- **Security Vulnerabilities:** 6 bugs (#32, #35, #36, #37, #38, #39)
- **Missing Validation:** 12 bugs (#34, #40, #42, #44, #46, #47, #48, #49, #50, #51, #52, #53, #54)
- **Error Handling:** 3 bugs (#33, #40, #43)
- **Type Safety:** 2 bugs (#41, #45)

### Recommended Fix Order

1. **Week 1:** Fix all P0 bugs (#32-39)
2. **Week 2:** Fix P1 validation bugs (#40-47)
3. **Week 3:** Fix P2 type safety bugs (#48-54)

### Estimated Effort
- **P0 Bugs:** 24-32 hours
- **P1 Bugs:** 16-24 hours
- **P2 Bugs:** 12-16 hours
- **Total:** 52-72 hours

---

**Report Generated:** January 27, 2026  
**Next Review:** After P0 bugs are fixed
