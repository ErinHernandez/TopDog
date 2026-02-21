#!/bin/bash

# P0 Payment Routes Verification Script
# Checks critical security and reliability features in payment routes

echo "=========================================="
echo "P0 PAYMENT ROUTES VERIFICATION"
echo "=========================================="
echo ""

# 1. Check all 4 routes exist and are standardized
echo "1. Route Standardization Check"
echo "---"
STANDARDIZED=0
NOT_STANDARDIZED=0
MISSING=0

for route in \
  "pages/api/paystack/transfer/recipient.ts" \
  "pages/api/paystack/transfer/initiate.ts" \
  "pages/api/paymongo/payout.ts" \
  "pages/api/xendit/disbursement.ts"; do
  
  if [ -f "$route" ]; then
    if grep -q "withErrorHandling" "$route"; then
      echo "✅ $route - Standardized"
      STANDARDIZED=$((STANDARDIZED + 1))
    else
      echo "❌ $route - NOT STANDARDIZED"
      NOT_STANDARDIZED=$((NOT_STANDARDIZED + 1))
    fi
  else
    echo "❌ $route - FILE NOT FOUND"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo "Summary: $STANDARDIZED standardized, $NOT_STANDARDIZED not standardized, $MISSING missing"
echo ""

# 2. Check for idempotency handling
echo "2. Idempotency Check"
echo "---"
IDEMPOTENT=0
NO_IDEMPOTENCY=0

for route in \
  "pages/api/paystack/transfer/initiate.ts" \
  "pages/api/paymongo/payout.ts" \
  "pages/api/xendit/disbursement.ts"; do
  
  if [ -f "$route" ]; then
    if grep -qi "idempotency\|reference" "$route" 2>/dev/null; then
      echo "✅ $route - Has idempotency/reference"
      IDEMPOTENT=$((IDEMPOTENT + 1))
    else
      echo "⚠️  $route - No idempotency found (VERIFY MANUALLY)"
      NO_IDEMPOTENCY=$((NO_IDEMPOTENCY + 1))
    fi
  else
    echo "❌ $route - FILE NOT FOUND"
    NO_IDEMPOTENCY=$((NO_IDEMPOTENCY + 1))
  fi
done

echo ""
echo "Summary: $IDEMPOTENT with idempotency, $NO_IDEMPOTENCY without"
echo ""

# 3. Check for transaction usage
echo "3. Transaction/Atomicity Check"
echo "---"
HAS_TRANSACTION=0
NO_TRANSACTION=0

for route in \
  "pages/api/paystack/transfer/initiate.ts" \
  "pages/api/paymongo/payout.ts" \
  "pages/api/xendit/disbursement.ts"; do
  
  if [ -f "$route" ]; then
    if grep -qi "transaction\|runTransaction" "$route" 2>/dev/null; then
      echo "✅ $route - Uses transactions"
      HAS_TRANSACTION=$((HAS_TRANSACTION + 1))
    else
      echo "⚠️  $route - No transaction found (CRITICAL - VERIFY)"
      NO_TRANSACTION=$((NO_TRANSACTION + 1))
    fi
  else
    echo "❌ $route - FILE NOT FOUND"
    NO_TRANSACTION=$((NO_TRANSACTION + 1))
  fi
done

echo ""
echo "Summary: $HAS_TRANSACTION with transactions, $NO_TRANSACTION without"
echo ""

# 4. Check webhook signature verification
echo "4. Webhook Signature Verification"
echo "---"
HAS_SIGNATURE=0
NO_SIGNATURE=0

for webhook in \
  "pages/api/paystack/webhook.ts" \
  "pages/api/paymongo/webhook.ts" \
  "pages/api/xendit/webhook.ts" \
  "pages/api/stripe/webhook.ts"; do
  
  if [ -f "$webhook" ]; then
    if grep -qi "signature\|verify\|hmac\|hash\|callback.*token" "$webhook" 2>/dev/null; then
      echo "✅ $webhook - Has signature verification"
      HAS_SIGNATURE=$((HAS_SIGNATURE + 1))
    else
      echo "❌ $webhook - NO SIGNATURE VERIFICATION (SECURITY RISK)"
      NO_SIGNATURE=$((NO_SIGNATURE + 1))
    fi
  else
    echo "⚠️  $webhook - File not found"
    NO_SIGNATURE=$((NO_SIGNATURE + 1))
  fi
done

echo ""
echo "Summary: $HAS_SIGNATURE with signatures, $NO_SIGNATURE without"
echo ""

# 5. Check for console.log (should be none)
echo "5. Console Statement Check"
echo "---"
CONSOLE_COUNT=0
CLEAN_ROUTES=0

for route in \
  "pages/api/paystack/transfer/recipient.ts" \
  "pages/api/paystack/transfer/initiate.ts" \
  "pages/api/paymongo/payout.ts" \
  "pages/api/xendit/disbursement.ts"; do
  
  if [ -f "$route" ]; then
    CONSOLE_IN_ROUTE=$(grep -c "console\." "$route" 2>/dev/null || echo "0")
    if [ "$CONSOLE_IN_ROUTE" -gt 0 ]; then
      echo "❌ $route - Has $CONSOLE_IN_ROUTE console statements"
      CONSOLE_COUNT=$((CONSOLE_COUNT + CONSOLE_IN_ROUTE))
    else
      echo "✅ $route - No console statements"
      CLEAN_ROUTES=$((CLEAN_ROUTES + 1))
    fi
  fi
done

if [ $CONSOLE_COUNT -eq 0 ]; then
  echo ""
  echo "✅ All routes clean - no console statements"
else
  echo ""
  echo "⚠️  Total console statements found: $CONSOLE_COUNT"
fi

echo ""
echo "Summary: $CLEAN_ROUTES clean routes, $CONSOLE_COUNT console statements"
echo ""

# 6. Check for balance validation
echo "6. Balance Validation Check"
echo "---"
HAS_BALANCE_CHECK=0
NO_BALANCE_CHECK=0

for route in \
  "pages/api/paystack/transfer/initiate.ts" \
  "pages/api/paymongo/payout.ts" \
  "pages/api/xendit/disbursement.ts"; do
  
  if [ -f "$route" ]; then
    if grep -qi "balance\|insufficient" "$route" 2>/dev/null; then
      echo "✅ $route - Has balance checks"
      HAS_BALANCE_CHECK=$((HAS_BALANCE_CHECK + 1))
    else
      echo "⚠️  $route - No balance validation found"
      NO_BALANCE_CHECK=$((NO_BALANCE_CHECK + 1))
    fi
  else
    echo "❌ $route - FILE NOT FOUND"
    NO_BALANCE_CHECK=$((NO_BALANCE_CHECK + 1))
  fi
done

echo ""
echo "Summary: $HAS_BALANCE_CHECK with balance checks, $NO_BALANCE_CHECK without"
echo ""

# 7. Final Summary
echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo ""
echo "Route Standardization: $STANDARDIZED/4 standardized"
echo "Idempotency: $IDEMPOTENT/3 with idempotency"
echo "Transactions: $HAS_TRANSACTION/3 with transactions"
echo "Webhook Signatures: $HAS_SIGNATURE/4 with verification"
echo "Console Statements: $CONSOLE_COUNT found (should be 0)"
echo "Balance Checks: $HAS_BALANCE_CHECK/3 with checks"
echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="

# Exit with error code if critical issues found
CRITICAL_ISSUES=0
if [ "$NOT_STANDARDIZED" -gt 0 ]; then
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi
if [ "$NO_SIGNATURE" -gt 0 ]; then
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi
if [ "$CONSOLE_COUNT" -gt 0 ]; then
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
  echo ""
  echo "⚠️  CRITICAL ISSUES FOUND - Please review above"
  exit 1
else
  echo ""
  echo "✅ All critical checks passed!"
  exit 0
fi
