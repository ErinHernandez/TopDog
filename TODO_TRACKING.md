# TODO Tracking & Tickets

**Last Updated:** January 23, 2025  
**Total Items:** 17 TODOs

---

## P1-HIGH Priority (This Sprint)

### 1. Stripe Exchange Rate Conversion
- **File:** `lib/stripe/stripeService.ts:556`
- **Status:** ⏳ Pending
- **Priority:** High (payment feature)
- **Effort:** 4-8 hours
- **Ticket:** TODO-001
- **Assignee:** TBD
- **Due Date:** This sprint
- **Description:** Implement proper exchange rate conversion for non-USD withdrawals
- **Steps:**
  1. Add exchange rate API integration (Fixer.io or ExchangeRate-API)
  2. Calculate USD equivalent for withdrawals
  3. Update withdrawal logic in `stripeService.ts`
  4. Add tests for exchange rate conversion
  5. Handle edge cases (API failures, invalid rates)

### 2. Paymongo Payout - Save for Future
- **File:** `pages/api/paymongo/payout.ts:203`
- **Status:** ⏳ Pending
- **Priority:** Medium (feature enhancement)
- **Effort:** 6-8 hours
- **Ticket:** TODO-002
- **Assignee:** TBD
- **Due Date:** Next sprint
- **Description:** Implement "save payment method for future" feature
- **Steps:**
  1. Store payment method tokens in Firestore
  2. Add UI option to save payment method
  3. Retrieve saved methods for user
  4. Use saved method for future payouts
  5. Add tests

### 3. Xendit Disbursement - Save for Future
- **File:** `pages/api/xendit/disbursement.ts:198`
- **Status:** ⏳ Pending
- **Priority:** Medium (feature enhancement)
- **Effort:** 6-8 hours
- **Ticket:** TODO-003
- **Assignee:** TBD
- **Due Date:** Next sprint
- **Description:** Implement "save payment method for future" feature (similar to Paymongo)
- **Steps:**
  1. Store payment method tokens in Firestore
  2. Add UI option to save payment method
  3. Retrieve saved methods for user
  4. Use saved method for future disbursements
  5. Add tests

### 4-6. Logger DEBUG Constants (Low Impact)
- **Files:** 
  - `lib/clientLogger.ts:22`
  - `lib/apiErrorHandler.ts:51`
  - `lib/apiErrorHandler.js:39`
- **Status:** ⏳ Backlog
- **Priority:** Low (code cleanup)
- **Effort:** 1 hour
- **Ticket:** TODO-004
- **Description:** These are enum definitions, not actual TODOs. Can be ignored or cleaned up.

---

## P2-MEDIUM Priority (This Quarter)

### 1. Firebase Adapter
- **File:** `components/vx2/draft-logic/adapters/index.ts:25`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 4-6 hours
- **Ticket:** TODO-101
- **Description:** Implement Firebase adapter for draft logic

### 2. Local Adapter
- **File:** `components/vx2/draft-logic/adapters/index.ts:29`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 4-6 hours
- **Ticket:** TODO-102
- **Description:** Implement local adapter for offline support

### 3. Withdrawal Logic
- **File:** `components/vx2/draft-room/components/DraftRoomVX2.tsx:455`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 4-6 hours
- **Ticket:** TODO-103
- **Description:** Add withdrawal-specific logic (remove from participants, refund entry fee)

### 4. Pre-draft Countdown
- **File:** `components/vx2/draft-room/hooks/useDraftRoom.ts:531`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 2-4 hours
- **Ticket:** TODO-104
- **Description:** Add pre-draft countdown state if needed

### 5. Paystack Balance Check
- **File:** `lib/paystack/paystackService.ts:352`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 2-4 hours
- **Ticket:** TODO-105
- **Description:** Convert to USD equivalent for balance check

### 6. Analytics Backend
- **File:** `lib/analytics/deviceTracking.ts:366`
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 4-6 hours
- **Ticket:** TODO-106
- **Description:** Send to analytics backend

### 7-8. Draft Room Modals
- **Files:** 
  - `pages/draft/topdog/DraftRoomNew.tsx:51` - Open player modal
  - `pages/draft/topdog/DraftRoomNew.tsx:57` - Show team modal
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Effort:** 6-8 hours
- **Ticket:** TODO-107
- **Description:** Implement draft room modal functionality

### 9-10. Logger WARN Constants
- **Files:** Logger constants (low impact)
- **Status:** ⏳ Backlog
- **Priority:** Low
- **Effort:** 1 hour
- **Ticket:** TODO-108
- **Description:** Code cleanup

---

## P3-LOW Priority (Backlog)

### 1. Logger WARN Constant
- **File:** `lib/clientLogger.ts:24`
- **Status:** ⏳ Backlog
- **Priority:** Low
- **Effort:** 1 hour
- **Ticket:** TODO-201
- **Description:** Code cleanup

---

## Progress Tracking

### This Sprint
- [ ] TODO-001: Stripe Exchange Rate Conversion (4-8 hours)

### Next Sprint
- [ ] TODO-002: Paymongo Save for Future (6-8 hours)
- [ ] TODO-003: Xendit Save for Future (6-8 hours)

### This Quarter
- [ ] TODO-101: Firebase Adapter (4-6 hours)
- [ ] TODO-102: Local Adapter (4-6 hours)
- [ ] TODO-103: Withdrawal Logic (4-6 hours)
- [ ] TODO-104: Pre-draft Countdown (2-4 hours)
- [ ] TODO-105: Paystack Balance Check (2-4 hours)
- [ ] TODO-106: Analytics Backend (4-6 hours)
- [ ] TODO-107: Draft Room Modals (6-8 hours)

### Backlog
- [ ] TODO-004: Logger DEBUG Constants (1 hour)
- [ ] TODO-108: Logger WARN Constants (1 hour)
- [ ] TODO-201: Logger WARN Constant (1 hour)

---

## Summary

| Priority | Count | Total Effort | Status |
|----------|-------|--------------|--------|
| P1-HIGH | 3 active | 16-24 hours | This sprint |
| P2-MEDIUM | 7 active | 26-40 hours | This quarter |
| P3-LOW | 3 items | 3 hours | Backlog |
| **Total** | **13 active** | **45-67 hours** | |

---

**Note:** Logger constants (4 items) are low-impact and can be addressed during code reviews.
