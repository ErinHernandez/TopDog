# Technical Debt Triage Report
Generated: 2026-01-14T19:25:22.356Z

## Summary
| Priority | Count | Action Required |
|----------|-------|-----------------|
| P0-CRITICAL | 0 | Immediate - Block releases |
| P1-HIGH | 6 | This sprint |
| P2-MEDIUM | 10 | This quarter |
| P3-LOW | 1 | Backlog |

**Total: 17 items**

---

## P0-CRITICAL (0 items)

_No items_

## P1-HIGH (6 items)

### 1. ./lib/clientLogger.ts:22
```
DEBUG: 'DEBUG',
```

### 2. ./lib/apiErrorHandler.ts:51
```
DEBUG: 'DEBUG',
```

### 3. ./lib/apiErrorHandler.js:39
```
DEBUG: 'DEBUG',
```

### 4. ./lib/stripe/stripeService.ts:556
```
// TODO: Implement proper exchange rate conversion for non-USD withdrawals
```

### 5. ./pages/api/paymongo/payout.ts:203
```
// TODO: Save for future if requested
```

### 6. ./pages/api/xendit/disbursement.ts:198
```
// TODO: Save for future if requested
```

## P2-MEDIUM (10 items)

### 1. ./components/vx2/draft-logic/adapters/index.ts:25
```
// TODO: Implement Firebase adapter
```

### 2. ./components/vx2/draft-logic/adapters/index.ts:29
```
// TODO: Implement local adapter
```

### 3. ./components/vx2/draft-room/components/DraftRoomVX2.tsx:455
```
// TODO: Add withdrawal-specific logic here (e.g., remove from participants, refund entry fee)
```

### 4. ./components/vx2/draft-room/hooks/useDraftRoom.ts:531
```
preDraftCountdown: 0, // TODO: Add pre-draft countdown state if needed
```

### 5. ./lib/apiErrorHandler.ts:49
```
WARN: 'WARN',
```

### 6. ./lib/paystack/paystackService.ts:352
```
// TODO: Convert to USD equivalent for balance check
```

### 7. ./lib/apiErrorHandler.js:37
```
WARN: 'WARN',
```

### 8. ./lib/analytics/deviceTracking.ts:366
```
// TODO: Send to analytics backend
```

### 9. ./pages/draft/topdog/DraftRoomNew.tsx:51
```
// TODO: Open player modal
```

### 10. ./pages/draft/topdog/DraftRoomNew.tsx:57
```
// TODO: Show team modal or select team
```

## P3-LOW (1 items)

### 1. ./lib/clientLogger.ts:24
```
WARN: 'WARN',
```

