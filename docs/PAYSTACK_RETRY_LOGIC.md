# Paystack Retry Logic Documentation

**Date:** January 12, 2025  
**Status:** ✅ **IMPLEMENTED**  
**File:** `lib/paystack/retryUtils.ts`

---

## Overview

Generic retry utility with exponential backoff for Paystack API calls. Handles transient errors and network issues with automatic retries, improving system reliability and resilience.

---

## Features

### Automatic Retry
- **Exponential Backoff** - Delay increases exponentially with each retry
- **Configurable Retries** - Default 3 retries, customizable
- **Smart Error Detection** - Only retries transient errors
- **Paystack-Specific** - Optimized for Paystack API error patterns

### Error Classification
- **Retryable Errors:**
  - HTTP 408 (Request Timeout)
  - HTTP 429 (Too Many Requests)
  - HTTP 500 (Internal Server Error)
  - HTTP 502 (Bad Gateway)
  - HTTP 503 (Service Unavailable)
  - HTTP 504 (Gateway Timeout)
  - Network errors (ECONNRESET, ETIMEDOUT, etc.)

- **Non-Retryable Errors:**
  - HTTP 4xx client errors (except 408, 429)
  - Validation errors
  - Authentication errors
  - Authorization errors

---

## Usage

### Basic Usage

```typescript
import { withPaystackRetry } from './retryUtils';

// Automatically retries on transient errors
const result = await withPaystackRetry(
  () => paystackRequest('/transaction/verify', { method: 'GET' })
);
```

### Advanced Usage

```typescript
import { withRetry } from './retryUtils';

// Custom retry configuration
const result = await withRetry(
  () => paystackRequest('/transfer', { method: 'POST', body }),
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      const status = getErrorStatus(error);
      return status === 429 && attempt < 3;
    },
    logger: {
      warn: (message, context) => console.warn(message, context),
      error: (message, error, context) => console.error(message, error, context),
    },
  }
);
```

### Skip Retry

For idempotency-sensitive operations, you can skip retry:

```typescript
// Skip retry for operations that must not be retried
const result = await paystackRequest('/transfer', {
  method: 'POST',
  body: transferData,
  skipRetry: true, // Don't retry this request
});
```

---

## Configuration

### RetryOptions Interface

```typescript
interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Whether to retry on specific error codes */
  retryableErrors?: number[];
  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Optional logger for retry attempts */
  logger?: {
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, error: unknown, context?: Record<string, unknown>) => void;
  };
}
```

### Default Configuration

**withRetry:**
- `maxRetries`: 3
- `initialDelay`: 1000ms
- `maxDelay`: 10000ms
- `backoffMultiplier`: 2
- `retryableErrors`: [408, 429, 500, 502, 503, 504]

**withPaystackRetry:**
- Same as `withRetry` but with Paystack-specific `shouldRetry` logic
- Doesn't retry 4xx client errors (except 408, 429)
- Retries all 5xx server errors
- Retries network errors

---

## Retry Behavior

### Exponential Backoff Calculation

```
delay = min(initialDelay * (multiplier ^ attempt), maxDelay)
```

**Example with defaults (initialDelay: 1000ms, multiplier: 2, maxDelay: 10000ms):**
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay
- Attempt 4: 8000ms delay
- Attempt 5+: 10000ms delay (capped)

### Retry Flow

1. **Execute Function** - Try to execute the function
2. **Check Error** - If error occurs, check if it's retryable
3. **Check Retries** - If retryable and retries remaining, continue
4. **Wait** - Calculate backoff delay and wait
5. **Retry** - Retry the function
6. **Exhaust** - If all retries exhausted, throw last error

---

## Error Handling

### Retryable Errors

Automatically retried:
- HTTP 408 (Request Timeout)
- HTTP 429 (Too Many Requests)
- HTTP 500-504 (Server Errors)
- Network errors (connection reset, timeout, etc.)

### Non-Retryable Errors

Immediately thrown (not retried):
- HTTP 400-407 (Client Errors, except 408)
- HTTP 410-428 (Client Errors)
- HTTP 430-499 (Client Errors, except 429)
- Validation errors
- Authentication errors
- Authorization errors

---

## Integration

### Paystack Service

The `paystackRequest` function automatically uses retry logic:

```typescript
// Automatic retry on transient errors
const response = await paystackRequest<TransferData>('/transfer', {
  method: 'POST',
  body: transferData,
});

// Skip retry for idempotency-sensitive operations
const response = await paystackRequest<TransferData>('/transfer', {
  method: 'POST',
  body: transferData,
  skipRetry: true, // Don't retry
});
```

### All Paystack Operations

All Paystack API calls automatically benefit from retry logic:
- `initializeTransaction` - ✅ Retries on transient errors
- `verifyTransaction` - ✅ Retries on transient errors
- `createTransferRecipient` - ✅ Retries on transient errors
- `initiateTransfer` - ✅ Retries on transient errors (unless skipRetry: true)
- `getTransferStatus` - ✅ Retries on transient errors
- `resolveAccountNumber` - ✅ Retries on transient errors
- `getOrCreateCustomer` - ✅ Retries on transient errors

---

## Monitoring

### Logging

Retry attempts are logged with:
- Retry attempt number
- Total attempts
- Delay before retry
- Error status code
- Error message

### Error Tracking

Final errors (after all retries exhausted) are captured with:
- `component: 'paystack'`
- `operation: 'retry_exhausted'`
- `attempts: <number>`
- Full error context

---

## Best Practices

### When to Use Retry

✅ **Use retry for:**
- Read operations (GET requests)
- Idempotent operations (PUT requests with idempotency keys)
- Operations where retry is safe

❌ **Skip retry for:**
- Operations without idempotency protection
- Operations where duplicate attempts are problematic
- Operations where retry doesn't make sense

### Idempotency

For operations that should not be retried:
1. Use `skipRetry: true` option
2. Implement idempotency keys at application level
3. Verify operation status before retry

---

## Testing

### Unit Tests

```typescript
// Test retry on transient error
test('retries on 500 error', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      const error = new Error('Server Error') as Error & { status: number };
      error.status = 500;
      throw error;
    }
    return { success: true };
  };

  const result = await withPaystackRetry(fn);
  expect(result.success).toBe(true);
  expect(attempts).toBe(3);
});

// Test no retry on client error
test('does not retry on 400 error', async () => {
  const fn = async () => {
    const error = new Error('Bad Request') as Error & { status: number };
    error.status = 400;
    throw error;
  };

  await expect(withPaystackRetry(fn)).rejects.toThrow('Bad Request');
});
```

---

## Performance Impact

### Typical Scenario

- **No Error:** ~0ms overhead (no retry logic executed)
- **Transient Error (Retried):** +1-10s delay (depending on retry attempts)
- **Permanent Error:** ~0ms overhead (immediate failure)

### Resource Usage

- **Memory:** Minimal (just retry state)
- **CPU:** Minimal (exponential backoff calculation)
- **Network:** Extra requests only on transient errors

---

## Related Documentation

- `lib/paystack/paystackService.ts` - Paystack service implementation
- `docs/PAYMENT_ENHANCEMENTS_2025.md` - Payment enhancements summary
- `P0_P1_IMPLEMENTATION_PROGRESS.md` - Progress tracker

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **PRODUCTION READY**
