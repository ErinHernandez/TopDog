# Paystack Transfer Fee Validation

**Last Updated:** January 12, 2025  
**Status:** ✅ Implemented

---

## Overview

Comprehensive fee validation for Paystack transfers ensures fees are calculated correctly and within expected ranges for each currency.

---

## Fee Structure by Currency

### Nigeria (NGN)

| Amount Range | Fee (kobo) | Fee (₦) |
|--------------|------------|---------|
| ≤ ₦5,000 | 1,000 | ₦10 |
| ₦5,001 - ₦50,000 | 2,500 | ₦25 |
| > ₦50,000 | 5,000 | ₦50 |

**Validation Range:** ₦10-₦50 (with 10% tolerance)

### Ghana (GHS)

| Recipient Type | Fee (pesewas) | Fee (GH₵) |
|----------------|---------------|-----------|
| Mobile Money | 100 | GH₵1 |
| Bank Account | 800 | GH₵8 |

**Validation Range:** GH₵1 (mobile) or GH₵8 (bank) (with 10% tolerance)

### South Africa (ZAR)

| Amount | Fee (cents) | Fee (R) |
|--------|-------------|---------|
| All amounts | 300 | R3 |

**Validation Range:** R3 (with 10% tolerance)

### Kenya (KES)

| Amount Range | Fee (cents) | Fee (KSh) |
|--------------|-------------|-----------|
| ≤ KSh1,500 | 2,000 | KSh20 |
| KSh1,501 - KSh20,000 | 4,000 | KSh40 |
| > KSh20,000 | 6,000 | KSh60 |

**Validation Range:** KSh20-KSh60 (with 10% tolerance)

---

## Validation Implementation

### Function: `validateTransferFee`

**Location:** `lib/paystack/currencyConfig.ts`

**Parameters:**
- `feeSmallestUnit` (number): Calculated fee in smallest unit
- `amountSmallestUnit` (number): Transfer amount in smallest unit
- `currency` (string): Currency code (NGN, GHS, ZAR, KES)
- `recipientType` (optional): 'bank' | 'mobile_money'

**Returns:**
```typescript
{
  isValid: boolean;
  expectedRange?: { min: number; max: number };
  error?: string;
}
```

**Usage:**
```typescript
const feeValidation = validateTransferFee(
  calculatedFee,
  transferAmount,
  'NGN',
  'bank'
);

if (!feeValidation.isValid) {
  logger.warn('Fee outside expected range', {
    calculatedFee,
    expectedRange: feeValidation.expectedRange,
    error: feeValidation.error,
  });
}
```

---

## Error Codes

### Fee-Related Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `fee_calculation_error` | 400 | Transfer fee calculation failed (negative fee) |
| `fee_validation_warning` | N/A | Fee outside expected range (logged, not rejected) |

### Payment Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `invalid_amount` | 400 | Amount must be positive |
| `invalid_currency` | 400 | Unsupported currency |
| `insufficient_balance` | 400 | User balance too low |
| `recipient_not_found` | 400 | Recipient account not found |
| `currency_mismatch` | 400 | Recipient currency doesn't match request |
| `withdrawal_in_progress` | 400 | A withdrawal is already in progress |
| `exchange_rate_failed` | 502 | Unable to get exchange rate |
| `fee_calculation_error` | 400 | Transfer fee calculation failed |

---

## Fee Monitoring

Fees are validated against expected ranges but not strictly enforced to allow for:
- Future fee structure changes by Paystack
- Currency-specific variations
- Temporary fee adjustments

**Monitoring Actions:**
1. Warning logged if fee exceeds expected maximum by > 10%
2. Fee validation results stored in transaction metadata
3. Fee discrepancies tracked for reconciliation

---

## Rollback Procedures

### If Transfer Succeeds but Database Update Fails

1. **Log Critical Error**
   - Transfer ID logged with `CRITICAL` severity
   - Transaction ID recorded
   - Full transfer details captured

2. **Queue for Manual Reconciliation**
   - Transaction marked with `requiresManualReview: true`
   - Transfer details stored in metadata
   - Alert operations team

3. **Do NOT Auto-Retry**
   - Avoids double-charge risk
   - Manual verification required

### If Database Updated but Transfer Fails

1. **Restore Balance Immediately**
   - Balance restored to original amount
   - USD amount restored (if converted)
   - Pending withdrawal reference cleared

2. **Mark Transfer as Failed**
   - Transaction status set to 'failed'
   - Error message recorded
   - Failure reason stored

3. **Log Full Context**
   - Error logged with full context
   - User ID, amount, recipient tracked
   - Transfer code recorded if available

4. **Notify User**
   - User notified of failure
   - Refund confirmed
   - Retry instructions provided

---

## Fee Limits Constants

```typescript
// Fee limits for monitoring (in smallest unit)
export const FEE_LIMITS = {
  paystack: {
    NGN: { min: 1000, max: 5000 },      // ₦10-₦50
    GHS: { min: 100, max: 800 },        // GH₵1 or GH₵8
    ZAR: { min: 300, max: 300 },        // R3
    KES: { min: 2000, max: 6000 },      // KSh20-KSh60
  },
};
```

---

## Testing

### Test Cases

1. **Valid Fees**
   - Test each currency with valid amounts
   - Verify fee calculation matches expected
   - Verify validation passes

2. **Edge Cases**
   - Test boundary amounts (exactly ₦5,000, ₦50,000)
   - Test minimum amounts
   - Test maximum amounts

3. **Invalid Fees**
   - Test negative fees (should fail)
   - Test fees way outside range (should warn)
   - Test unsupported currencies

### Test Commands

```bash
# Test transfer with calculated fee
# Fee should be validated automatically

# Test fee validation directly
# Unit tests should cover validateTransferFee function
```

---

**Implementation:** `lib/paystack/currencyConfig.ts`  
**Usage:** `pages/api/paystack/transfer/initiate.ts`
