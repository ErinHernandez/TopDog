# 23 Bugs Fix Plan - Implementation Guide
**Date:** January 27, 2026  
**Status:** 📋 Ready for Implementation  
**Estimated Total Time:** 52-72 hours  
**Target Completion:** 3 weeks

---

## Executive Summary

This plan provides step-by-step instructions to fix all 23 bugs identified in the codebase. Bugs are organized by priority with clear implementation steps, code examples, and testing strategies.

### Fix Strategy

1. **Week 1 (P0):** Fix all 8 critical security bugs
2. **Week 2 (P1):** Fix all 8 high-priority validation bugs
3. **Week 3 (P2):** Fix all 7 medium-priority type safety bugs

### Dependencies

- Zod schemas need to be created first (can be done in parallel)
- Rate limiters need to be configured
- Background job queue utility needed for Bug #33

---

## Phase 1: P0 Critical Bugs (Week 1) - 24-32 hours

### Bug #32: Missing Input Validation in Export Route

**File:** `pages/api/export/[...params].ts`  
**Time Estimate:** 3-4 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Create ownership verification helper** (`lib/export/ownershipVerification.ts`):
```typescript
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function verifyDraftOwnership(
  draftId: string,
  userId: string
): Promise<boolean> {
  const draftRef = doc(db, 'draftRooms', draftId);
  const draftDoc = await getDoc(draftRef);
  
  if (!draftDoc.exists()) {
    return false;
  }
  
  const data = draftDoc.data();
  const participants = data.participants || [];
  
  return participants.some(
    (p: { userId?: string; id?: string }) => 
      p.userId === userId || p.id === userId
  );
}

export async function verifyUserOwnership(
  requestedUserId: string,
  authenticatedUserId: string
): Promise<boolean> {
  return requestedUserId === authenticatedUserId;
}

export async function verifyTournamentAccess(
  tournamentId: string,
  userId: string
): Promise<boolean> {
  // Add tournament ownership check if needed
  // For now, tournaments may be public
  return true;
}
```

2. **Update export route** (`pages/api/export/[...params].ts`):
```typescript
import { verifyDraftOwnership, verifyUserOwnership } from '@/lib/export/ownershipVerification';

// In handler, after line 186:
// Add ownership verification for each export type
switch (exportType) {
  case 'draft':
    if (!id) {
      throw new Error('Draft ID is required');
    }
    const ownsDraft = await verifyDraftOwnership(id, authenticatedReq.user.uid);
    if (!ownsDraft) {
      await logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        'high',
        { 
          endpoint: '/api/export',
          exportType: 'draft',
          reason: 'unauthorized_draft_access',
          draftId: id,
          userId: authenticatedReq.user.uid
        },
        authenticatedReq.user.uid,
        clientIP
      );
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
    }
    break;
    
  case 'user':
    if (!id) {
      throw new Error('User ID is required');
    }
    const ownsUser = await verifyUserOwnership(id, authenticatedReq.user.uid);
    if (!ownsUser) {
      await logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        'high',
        { 
          endpoint: '/api/export',
          exportType: 'user',
          reason: 'unauthorized_user_access',
          requestedUserId: id,
          authenticatedUserId: authenticatedReq.user.uid
        },
        authenticatedReq.user.uid,
        clientIP
      );
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
    }
    break;
}
```

3. **Testing:**
   - Test exporting own draft → should succeed
   - Test exporting other user's draft → should fail with 403
   - Test exporting own user data → should succeed
   - Test exporting other user's data → should fail with 403

---

### Bug #33: Unhandled Promise in Draft Submit-Pick

**File:** `pages/api/draft/submit-pick.ts:354`  
**Time Estimate:** 4-5 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Create background job queue utility** (`lib/background/queue.ts`):
```typescript
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { serverLogger } from '@/lib/logger/serverLogger';

export interface BackgroundJob {
  type: string;
  payload: Record<string, unknown>;
  retries?: number;
  maxRetries?: number;
}

export async function queueBackgroundJob(job: BackgroundJob): Promise<void> {
  try {
    await addDoc(collection(db, 'backgroundJobs'), {
      ...job,
      status: 'pending',
      createdAt: serverTimestamp(),
      retries: job.retries || 0,
      maxRetries: job.maxRetries || 3,
    });
  } catch (error) {
    serverLogger.error('Failed to queue background job', error as Error, {
      component: 'background-queue',
      jobType: job.type,
    });
    // Don't throw - this is fire-and-forget
  }
}

export async function queueCollusionAnalysis(roomId: string): Promise<void> {
  return queueBackgroundJob({
    type: 'collusion-analysis',
    payload: { roomId },
    maxRetries: 3,
  });
}
```

2. **Create background job processor** (`lib/background/processor.ts`):
```typescript
// This would run as a Cloud Function or scheduled job
// For now, document the pattern
export async function processBackgroundJobs(): Promise<void> {
  // Query pending jobs
  // Process with retry logic
  // Update job status
}
```

3. **Update submit-pick route** (`pages/api/draft/submit-pick.ts`):
```typescript
import { queueCollusionAnalysis } from '@/lib/background/queue';

// Replace lines 352-369:
if (result.isLastPick) {
  try {
    // Queue background job instead of direct call
    await queueCollusionAnalysis(roomId);
    logger.info('Queued collusion analysis', {
      component: 'draft',
      operation: 'submit-pick',
      roomId,
    });
  } catch (error) {
    // Log but don't fail - draft is already complete
    logger.error('Failed to queue collusion analysis', error as Error, {
      component: 'draft',
      operation: 'submit-pick',
      roomId,
    });
  }
}
```

4. **Alternative: Use fire-and-forget wrapper** (simpler approach):
```typescript
// lib/utils/fireAndForget.ts
export function fireAndForget<T>(
  promise: Promise<T>,
  onError?: (error: Error) => void
): void {
  promise.catch((error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('Fire-and-forget promise failed:', error);
    }
  });
}

// In submit-pick.ts:
import { fireAndForget } from '@/lib/utils/fireAndForget';

if (result.isLastPick) {
  fireAndForget(
    collusionFlagService.markDraftCompleted(roomId),
    (error) => {
      logger.error('Failed to mark draft as completed for collusion analysis', error, {
        component: 'draft',
        operation: 'submit-pick',
        roomId,
      });
    }
  );
}
```

**Recommendation:** Use the fire-and-forget wrapper for now (simpler), implement queue later if needed.

5. **Testing:**
   - Test draft completion → should queue job
   - Test with collusion service down → should not fail draft
   - Verify job is queued in Firestore

---

### Bug #34: Unsafe API Parsing in NFL Fantasy Index

**File:** `pages/api/nfl/fantasy/index.ts`  
**Time Estimate:** 2-3 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const fantasyPlayerSchema = z.object({
  Position: z.string().optional(),
  position: z.string().optional(),
  Name: z.string().optional(),
  name: z.string().optional(),
  Team: z.string().optional(),
  team: z.string().optional(),
  AverageDraftPositionPPR: z.number().optional(),
  adpPPR: z.number().optional(),
  AverageDraftPosition: z.number().optional(),
  adp: z.number().optional(),
  ProjectedFantasyPointsPPR: z.number().optional(),
  projectedPointsPPR: z.number().optional(),
  ProjectedFantasyPoints: z.number().optional(),
  projectedPoints: z.number().optional(),
  PositionRank: z.number().optional(),
  positionRank: z.number().optional(),
  ByeWeek: z.number().optional(),
  byeWeek: z.number().optional(),
  AverageDraftPositionRank: z.number().optional(),
  overallRank: z.number().optional(),
}).passthrough(); // Allow additional fields

export const fantasyPlayersResponseSchema = z.array(fantasyPlayerSchema);
```

2. **Update NFL fantasy route** (`pages/api/nfl/fantasy/index.ts`):
```typescript
import { fantasyPlayersResponseSchema } from '@/lib/validation/schemas';

// Replace validateExternalApiResponse function (lines 45-100):
// Fetch from external API
const rawData = await getFantasyPlayers(apiKey, { limit: 500 });

// SECURITY: Validate external API response using Zod
let allPlayers: FantasyPlayer[];
try {
  const validationResult = fantasyPlayersResponseSchema.safeParse(rawData);
  
  if (!validationResult.success) {
    logger.error('External API response validation failed', new Error('Invalid response structure'), {
      errors: validationResult.error.issues,
    });
    throw new Error('Invalid response from external data provider');
  }
  
  allPlayers = validationResult.data.map((item) => ({
    position: item.Position || item.position,
    name: item.Name || item.name,
    team: item.Team || item.team,
    adpPPR: item.AverageDraftPositionPPR || item.adpPPR,
    adp: item.AverageDraftPosition || item.adp,
    projectedPointsPPR: item.ProjectedFantasyPointsPPR || item.projectedPointsPPR,
    projectedPoints: item.ProjectedFantasyPoints || item.projectedPoints,
    positionRank: item.PositionRank || item.positionRank,
    byeWeek: item.ByeWeek || item.byeWeek,
    overallRank: item.AverageDraftPositionRank || item.overallRank,
  }));
} catch (validationError) {
  logger.error('External API response validation failed', validationError as Error);
  throw new Error('Invalid response from external data provider');
}
```

3. **Testing:**
   - Test with valid API response → should succeed
   - Test with malformed response → should fail gracefully
   - Test with missing fields → should handle gracefully

---

### Bug #35: Weak Admin Auth in Integrity Drafts Route

**File:** `pages/api/admin/integrity/drafts/[draftId].ts`  
**Time Estimate:** 1-2 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Update admin integrity route** (`pages/api/admin/integrity/drafts/[draftId].ts`):
```typescript
// Replace lines 23-32:
const admin = await verifyAdminAccess(req.headers.authorization);
if (!admin.isAdmin) {
  // Generic error - don't leak that this is an admin endpoint
  const requestId = res.getHeader('X-Request-ID') as string;
  if (!requestId) {
    logger.warn('Missing request ID in admin route');
  }
  
  const errorResponse = createErrorResponse(
    ErrorType.UNAUTHORIZED,
    'Unauthorized', // Generic message
    {}, // Empty details - don't leak endpoint info
    requestId || 'unknown'
  );
  return res.status(errorResponse.statusCode).json(errorResponse.body);
}

// Add explicit type check
if (typeof admin.uid !== 'string' || !admin.uid) {
  logger.warn('Invalid admin object', { admin });
  const errorResponse = createErrorResponse(
    ErrorType.UNAUTHORIZED,
    'Unauthorized',
    {},
    res.getHeader('X-Request-ID') as string || 'unknown'
  );
  return res.status(errorResponse.statusCode).json(errorResponse.body);
}
```

2. **Update error response for draft not found** (lines 78-86):
```typescript
if (!detail.riskScores && !detail.integrityFlags) {
  // Generic error - don't leak draftId or analysis status
  const errorResponse = createErrorResponse(
    ErrorType.NOT_FOUND,
    'Resource not found', // Generic message
    {}, // Don't include draftId
    res.getHeader('X-Request-ID') as string || 'unknown'
  );
  // Log details server-side only
  logger.warn('Draft not found or not analyzed', {
    draftId,
    adminId: admin.uid,
  });
  return res.status(errorResponse.statusCode).json(errorResponse.body);
}
```

3. **Testing:**
   - Test with valid admin token → should succeed
   - Test with invalid token → should return generic error
   - Test with non-existent draft → should return generic error
   - Verify no information leakage in error messages

---

### Bug #36: Missing Rate Limit in PayPal Withdraw

**File:** `pages/api/paypal/withdraw.ts`  
**Time Estimate:** 1-2 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Add rate limiter configuration** (`lib/rateLimitConfig.ts`):
```typescript
// Add to existing rate limiters:
export const paypalWithdrawLimiter = createRateLimiter({
  name: 'paypal-withdraw',
  maxRequests: 5, // 5 withdrawals per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
```

2. **Update PayPal withdraw route** (`pages/api/paypal/withdraw.ts`):
```typescript
import { withRateLimit } from '@/lib/rateLimitConfig';
import { paypalWithdrawLimiter } from '@/lib/rateLimitConfig';

// Update export (line 106-107):
export default withCSRFProtection(
  withRateLimit(handler, paypalWithdrawLimiter) as unknown as CSRFHandler
);
```

3. **Testing:**
   - Test single withdrawal → should succeed
   - Test 5 withdrawals in 1 hour → should succeed
   - Test 6th withdrawal → should return 429
   - Verify rate limit headers in response

---

### Bug #37: Weak Amount Validation in PayPal Withdraw

**File:** `pages/api/paypal/withdraw.ts:44`  
**Time Estimate:** 2-3 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const paypalWithdrawRequestSchema = z.object({
  amountCents: z
    .number()
    .int('Amount must be a whole number in cents')
    .positive('Amount must be positive')
    .min(100, 'Minimum withdrawal is $1.00') // $1.00 = 100 cents
    .max(1_000_000, 'Maximum withdrawal is $10,000.00'), // $10,000 = 1,000,000 cents
  linkedAccountId: z
    .string()
    .min(1, 'Linked account ID is required')
    .max(200, 'Linked account ID too long'),
  confirmationMethod: z.enum(['email', 'sms']).optional(),
});
```

2. **Update PayPal withdraw route** (`pages/api/paypal/withdraw.ts`):
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { paypalWithdrawRequestSchema } from '@/lib/validation/schemas';

// Replace lines 41-51:
const body = validateRequestBody(req, paypalWithdrawRequestSchema, logger);
const { amountCents, linkedAccountId, confirmationMethod } = body;

// Additional balance check (keep existing logic)
const userData = userDoc.data();
const currentBalance = userData.balanceCents || 0;

if (amountCents > currentBalance) {
  return res.status(400).json({
    error: 'Insufficient balance',
    currentBalance,
    requestedAmount: amountCents,
  });
}
```

3. **Testing:**
   - Test with valid amount → should succeed
   - Test with amount < $1 → should fail validation
   - Test with amount > $10,000 → should fail validation
   - Test with negative amount → should fail validation
   - Test with non-integer amount → should fail validation
   - Test with amount > balance → should fail with insufficient balance

---

### Bug #38: IDOR Vulnerability in Slow Drafts

**File:** `pages/api/slow-drafts/index.ts:200`  
**Time Estimate:** 2-3 hours  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Update slow drafts route** (`pages/api/slow-drafts/index.ts`):
```typescript
// Remove userId query parameter entirely (lines 198-211)
// Always use authenticated user ID

// Replace lines 198-211:
// SECURITY: Always use authenticated user ID - never trust query params
const userId = authenticatedUserId;

// Remove this entire block:
// const { userId: requestedUserId } = req.query;
// if (requestedUserId && typeof requestedUserId === 'string') {
//   if (!verifyUserAccess(authenticatedUserId, requestedUserId)) {
//     return res.status(403).json({ ... });
//   }
// }

// Add explicit ownership check for each draft (after line 257):
if (!userParticipant) continue;

// SECURITY: Double-check ownership before including draft
if (userParticipant.userId !== userId && userParticipant.id !== userId) {
  logger.warn('Draft ownership mismatch detected', {
    userId,
    participantUserId: userParticipant.userId,
    participantId: userParticipant.id,
    roomId: docSnap.id,
  });
  continue; // Skip this draft - ownership doesn't match
}
```

2. **Update query to filter by user** (if possible):
```typescript
// Ideally, filter at query level if Firestore supports it
// For now, filter in memory but add explicit checks
```

3. **Testing:**
   - Test with authenticated user → should only see own drafts
   - Test with userId query param → should ignore it
   - Verify no drafts from other users are returned
   - Test with invalid participant data → should skip draft

---

### Bug #39: Error Info Leakage in Admin Integrity Route

**File:** `pages/api/admin/integrity/drafts/[draftId].ts:78`  
**Time Estimate:** 1 hour  
**Priority:** 🔴 CRITICAL

#### Implementation Steps

1. **Update error response** (already covered in Bug #35):
```typescript
// Use generic error messages
// Don't include draftId in error responses
// Log details server-side only
```

2. **Testing:**
   - Test with non-existent draft → should return generic error
   - Verify no draftId in error response
   - Verify details logged server-side

---

## Phase 2: P1 High Priority Bugs (Week 2) - 16-24 hours

### Bug #40: Missing requestId in Export Error Response

**File:** `pages/api/export/[...params].ts:240`  
**Time Estimate:** 15 minutes  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Update export route** (`pages/api/export/[...params].ts`):
```typescript
// Line 240-245:
const errorResponse = createErrorResponse(
  ErrorType.NOT_FOUND,
  'No data found for export',
  { exportType, id },
  res.getHeader('X-Request-ID') as string // Add requestId
);
return res.status(errorResponse.statusCode).json(errorResponse.body);
```

2. **Testing:**
   - Test export with non-existent data → verify requestId in error response

---

### Bug #41: Unsafe Type Assertion in Export Route

**File:** `pages/api/export/[...params].ts:245`  
**Time Estimate:** 30 minutes  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Update export route** (`pages/api/export/[...params].ts`):
```typescript
// Line 245:
// Remove double type assertion
return res.status(errorResponse.statusCode).json(errorResponse.body);
// errorResponse.body is already properly typed
```

2. **Testing:**
   - Test error responses → verify correct structure

---

### Bug #42: Missing Zod Validation in PayPal Withdraw

**File:** `pages/api/paypal/withdraw.ts:41`  
**Time Estimate:** 1 hour  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Already covered in Bug #37** - use the same schema

2. **Testing:**
   - Test with invalid data → should fail validation
   - Test with valid data → should succeed

---

### Bug #43: Missing Error Handling in Slow Drafts Query

**File:** `pages/api/slow-drafts/index.ts:240`  
**Time Estimate:** 1-2 hours  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Update slow drafts route** (`pages/api/slow-drafts/index.ts`):
```typescript
// Add specific error handling around Firestore query (line 240):
try {
  const snapshot = await getDocs(q);
  // ... existing code
} catch (firestoreError) {
  const error = firestoreError as { code?: string; message?: string };
  
  // Handle permission errors gracefully
  if (error.code === 'permission-denied' || 
      (error.message && error.message.includes('Missing or insufficient permissions'))) {
    logger.warn('Firestore permission error in slow drafts query', firestoreError as Error, {
      component: 'slow-drafts',
      userId,
    });
    return res.status(403).json({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
  }
  
  // Re-throw other errors to be caught by outer try-catch
  throw firestoreError;
}
```

2. **Testing:**
   - Test with permission error → should return 403
   - Test with other Firestore errors → should be handled by outer catch
   - Verify no database structure leaked in errors

---

### Bug #44: Missing Input Validation in Paystack Transfer Routes

**File:** `pages/api/paystack/transfer/recipient.ts:158`  
**Time Estimate:** 3-4 hours  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Create Zod schemas** (`lib/validation/schemas.ts`):
```typescript
export const paystackCreateRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  accountNumber: z.string().min(10).max(20),
  bankCode: z.string().min(3).max(10),
  accountName: z.string().min(1).max(200),
});

export const paystackDeleteRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  recipientCode: z.string().min(1).max(100),
});
```

2. **Update Paystack recipient route** (`pages/api/paystack/transfer/recipient.ts`):
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { paystackCreateRecipientSchema, paystackDeleteRecipientSchema } from '@/lib/validation/schemas';

// Replace line 158:
const body = validateRequestBody(req, paystackCreateRecipientSchema, logger);
const { userId, accountNumber, bankCode, accountName } = body;

// For DELETE (line 488):
const body = validateRequestBody(req, paystackDeleteRecipientSchema, logger);
const { userId, recipientCode } = body;
```

3. **Update other Paystack transfer routes** (similar pattern):
   - `pages/api/paystack/transfer/initiate.ts`
   - Any other transfer-related routes

4. **Testing:**
   - Test with invalid data → should fail validation
   - Test with valid data → should succeed

---

### Bug #45: Missing Rate Limiting in Xendit Routes

**File:** `pages/api/xendit/disbursement.ts`  
**Time Estimate:** 1 hour  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Add rate limiter** (`lib/rateLimitConfig.ts`):
```typescript
export const xenditDisbursementLimiter = createRateLimiter({
  name: 'xendit-disbursement',
  maxRequests: 10, // 10 disbursements per hour
  windowMs: 60 * 60 * 1000,
});
```

2. **Update Xendit disbursement route** (`pages/api/xendit/disbursement.ts`):
```typescript
import { withRateLimit } from '@/lib/rateLimitConfig';
import { xenditDisbursementLimiter } from '@/lib/rateLimitConfig';

// Wrap handler with rate limiting
export default withAuth(
  withRateLimit(handler, xenditDisbursementLimiter) as unknown as AuthApiHandler
);
```

3. **Testing:**
   - Test single disbursement → should succeed
   - Test 10 disbursements → should succeed
   - Test 11th → should return 429

---

### Bug #46: Missing Validation in Stripe Setup Intent

**File:** `pages/api/stripe/setup-intent.ts`  
**Time Estimate:** 2-3 hours  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const stripeSetupIntentRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  paymentMethodId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});
```

2. **Update Stripe setup intent route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { stripeSetupIntentRequestSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, stripeSetupIntentRequestSchema, logger);
const { userId, paymentMethodId, returnUrl } = body;
```

3. **Testing:**
   - Test with invalid data → should fail validation
   - Test with valid data → should succeed

---

### Bug #47: Missing Validation in Stripe Cancel Payment

**File:** `pages/api/stripe/cancel-payment.ts`  
**Time Estimate:** 2-3 hours  
**Priority:** 🟠 HIGH

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const stripeCancelPaymentRequestSchema = z.object({
  paymentIntentId: z.string().min(1).max(200),
  userId: firebaseUserIdSchema,
  reason: z.enum(['requested_by_customer', 'abandoned', 'fraudulent']).optional(),
});
```

2. **Update Stripe cancel payment route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { stripeCancelPaymentRequestSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, stripeCancelPaymentRequestSchema, logger);
const { paymentIntentId, userId, reason } = body;
```

3. **Testing:**
   - Test with invalid data → should fail validation
   - Test with valid data → should succeed

---

## Phase 3: P2 Medium Priority Bugs (Week 3) - 12-16 hours

### Bug #48: Unsafe Type Assertion in Paystack Initialize

**File:** `pages/api/paystack/initialize.ts`  
**Time Estimate:** 2 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const paystackInitializeRequestSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  currency: currencyCodeSchema.default('USD'),
  email: emailSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
```

2. **Update Paystack initialize route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { paystackInitializeRequestSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, paystackInitializeRequestSchema, logger);
```

3. **Testing:**
   - Test with invalid data → should fail validation

---

### Bug #49: Missing Type Safety in Analytics Route

**File:** `pages/api/analytics.ts:215`  
**Time Estimate:** 2-3 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const analyticsRequestSchema = z.object({
  event: z.string().min(1).max(100),
  userId: firebaseUserIdSchema.optional(),
  sessionId: z.string().uuid().optional(),
  timestamp: z.number().int().positive().optional(),
  properties: z.record(z.unknown()).optional(),
});
```

2. **Update analytics route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { analyticsRequestSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, analyticsRequestSchema, logger);
const { event, userId, sessionId, timestamp, properties } = body;
```

3. **Testing:**
   - Test with invalid event data → should fail validation
   - Test with valid data → should succeed

---

### Bug #50: Missing Validation in User Display Currency

**File:** `pages/api/user/display-currency.ts:187`  
**Time Estimate:** 2 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const setDisplayCurrencySchema = z.object({
  userId: firebaseUserIdSchema,
  country: countryCodeSchema,
  currency: currencyCodeSchema,
});

export const resetDisplayCurrencySchema = z.object({
  userId: firebaseUserIdSchema,
  country: countryCodeSchema,
});
```

2. **Update user display currency route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { setDisplayCurrencySchema, resetDisplayCurrencySchema } from '@/lib/validation/schemas';

// For SET (line 187):
const body = validateRequestBody(req, setDisplayCurrencySchema, logger);
const { userId, country, currency } = body;

// For RESET (line 258):
const body = validateRequestBody(req, resetDisplayCurrencySchema, logger);
const { userId, country } = body;
```

3. **Testing:**
   - Test with invalid currency code → should fail validation
   - Test with invalid country code → should fail validation
   - Test with valid data → should succeed

---

### Bug #51: Missing Validation in Draft Withdraw

**File:** `pages/api/drafts/[draftId]/withdraw.ts:57`  
**Time Estimate:** 2 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const draftWithdrawRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  draftId: z.string().min(1).max(200),
});
```

2. **Update draft withdraw route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { draftWithdrawRequestSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, draftWithdrawRequestSchema, logger);
const { userId, draftId } = body;

// Add ownership verification
const draftRef = doc(db, 'draftRooms', draftId);
const draftDoc = await getDoc(draftRef);
// ... verify ownership
```

3. **Testing:**
   - Test with invalid data → should fail validation
   - Test withdrawing from other user's draft → should fail
   - Test with valid data → should succeed

---

### Bug #52: Missing Validation in Paymongo Payout

**File:** `pages/api/paymongo/payout.ts:75`  
**Time Estimate:** 2 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const paymongoCreatePayoutSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  recipientId: z.string().min(1).max(200),
  currency: currencyCodeSchema.default('PHP'),
});
```

2. **Update Paymongo payout route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { paymongoCreatePayoutSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, paymongoCreatePayoutSchema, logger);
```

3. **Testing:**
   - Test with invalid data → should fail validation

---

### Bug #53: Missing Validation in Xendit Disbursement

**File:** `pages/api/xendit/disbursement.ts:75`  
**Time Estimate:** 2 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const xenditCreateDisbursementSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  bankCode: z.string().min(3).max(10),
  accountHolderName: z.string().min(1).max(200),
  accountNumber: z.string().min(10).max(20),
  description: z.string().max(500).optional(),
});
```

2. **Update Xendit disbursement route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { xenditCreateDisbursementSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, xenditCreateDisbursementSchema, logger);
```

3. **Testing:**
   - Test with invalid data → should fail validation

---

### Bug #54: Missing Validation in PayPal Orders

**File:** `pages/api/paypal/orders.ts:39`  
**Time Estimate:** 2-3 hours  
**Priority:** 🟡 MEDIUM

#### Implementation Steps

1. **Create Zod schema** (`lib/validation/schemas.ts`):
```typescript
export const paypalCreateOrderSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  currency: currencyCodeSchema.default('USD'),
  riskContext: z.object({
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional(),
    deviceId: z.string().max(200).optional(),
  }).optional(),
});
```

2. **Update PayPal orders route**:
```typescript
import { validateRequestBody } from '@/lib/apiErrorHandler';
import { paypalCreateOrderSchema } from '@/lib/validation/schemas';

const body = validateRequestBody(req, paypalCreateOrderSchema, logger);
const { amountCents, userId, currency, riskContext } = body;
```

3. **Testing:**
   - Test with invalid data → should fail validation
   - Test with valid risk context → should succeed
   - Test with invalid risk context → should fail validation

---

## Testing Strategy

### Unit Tests

Create test files for each fixed route:
- `__tests__/api/export.test.ts`
- `__tests__/api/draft/submit-pick.test.ts`
- `__tests__/api/paypal/withdraw.test.ts`
- etc.

### Integration Tests

Test end-to-end flows:
- Export flow with ownership checks
- Withdrawal flow with rate limiting
- Draft submission with background jobs

### Security Tests

- Test IDOR vulnerabilities
- Test rate limiting
- Test input validation
- Test error message leakage

---

## Implementation Checklist

### Week 1: P0 Bugs
- [ ] Bug #32: Export ownership verification
- [ ] Bug #33: Background job queue for collusion analysis
- [ ] Bug #34: Zod validation for NFL fantasy API
- [ ] Bug #35: Admin auth improvements
- [ ] Bug #36: Rate limiting for PayPal withdraw
- [ ] Bug #37: Amount validation for PayPal withdraw
- [ ] Bug #38: IDOR fix for slow drafts
- [ ] Bug #39: Error info leakage fix

### Week 2: P1 Bugs
- [ ] Bug #40: requestId in export errors
- [ ] Bug #41: Type assertion fix
- [ ] Bug #42: Zod validation for PayPal withdraw (done with #37)
- [ ] Bug #43: Error handling in slow drafts
- [ ] Bug #44: Paystack transfer validation
- [ ] Bug #45: Rate limiting for Xendit
- [ ] Bug #46: Stripe setup intent validation
- [ ] Bug #47: Stripe cancel payment validation

### Week 3: P2 Bugs
- [ ] Bug #48: Paystack initialize validation
- [ ] Bug #49: Analytics validation
- [ ] Bug #50: Display currency validation
- [ ] Bug #51: Draft withdraw validation
- [ ] Bug #52: Paymongo payout validation
- [ ] Bug #53: Xendit disbursement validation
- [ ] Bug #54: PayPal orders validation

---

## Success Criteria

### Security
- ✅ All IDOR vulnerabilities fixed
- ✅ All rate limiting in place
- ✅ All input validation using Zod
- ✅ No information leakage in errors

### Code Quality
- ✅ All unsafe type assertions replaced
- ✅ All error responses include requestId
- ✅ All background jobs properly queued
- ✅ All routes have proper error handling

### Testing
- ✅ Unit tests for all fixed routes
- ✅ Integration tests for critical flows
- ✅ Security tests passing
- ✅ All 1,125 existing tests still passing

---

## Notes

1. **Zod Schemas:** Create all schemas in `lib/validation/schemas.ts` first, then update routes
2. **Rate Limiters:** Configure all rate limiters in `lib/rateLimitConfig.ts`
3. **Background Jobs:** Start with fire-and-forget wrapper, implement queue later if needed
4. **Testing:** Write tests as you fix each bug
5. **Documentation:** Update API documentation for any changed error responses

---

**Plan Created:** January 27, 2026  
**Estimated Completion:** 3 weeks  
**Next Steps:** Begin Phase 1 (P0 bugs)
