# API Route Template Guide

**Last Updated:** January 2025  
**Purpose:** Standardize new API routes with best practices

---

## Overview

This guide explains how to use the API route template (`pages/api/_template.ts`) to create new API routes with consistent error handling, logging, and security.

---

## Quick Start

1. **Copy the template:**
   ```bash
   cp pages/api/_template.ts pages/api/your-endpoint.ts
   ```

2. **Customize for your endpoint:**
   - Update the JSDoc comment with your endpoint description
   - Define your request/response types
   - Implement your business logic
   - Add middleware as needed (rate limiting, auth, CSRF)

3. **Test your endpoint:**
   ```bash
   npm run dev
   # Test at http://localhost:3000/api/your-endpoint
   ```

---

## Template Features

### ✅ Standardized Error Handling

All routes use `withErrorHandling` wrapper which provides:
- Consistent error responses
- Structured logging
- Request ID tracking
- Automatic error categorization

### ✅ Request Validation

- **Method validation:** Ensures only allowed HTTP methods
- **Query parameter validation:** Validates required query params
- **Body validation:** Validates required request body fields

### ✅ Structured Logging

All routes use `logger` from `lib/structuredLogger`:
- JSON logs in production
- Pretty-printed logs in development
- Automatic request context

### ✅ Environment Variable Validation

Use `requireEnvVar` to ensure required environment variables are set:
```typescript
const apiKey = requireEnvVar('YOUR_API_KEY', logger);
```

---

## Middleware Options

### Rate Limiting

For endpoints that need rate limiting:

```typescript
import { createApiRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';

const rateLimiter = createApiRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
});

export default withRateLimit(handler, rateLimiter);
```

### Authentication

For endpoints that require authentication:

```typescript
import { withAuth } from '../../lib/apiAuth';

export default withAuth(handler, {
  required: true, // or false for optional auth
  allowAnonymous: false,
});
```

### CSRF Protection

For endpoints that need CSRF protection:

```typescript
import { withCSRFProtection } from '../../lib/csrfProtection';

export default withCSRFProtection(handler);
```

### Combining Middlewares

You can combine multiple middlewares:

```typescript
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, rateLimiter),
    { required: true }
  )
);
```

---

## Response Format

### Success Response

Use `createSuccessResponse`:

```typescript
const response = createSuccessResponse({
  data: yourData,
  count: items.length,
}, 200, logger);

return res.status(response.statusCode).json(response.body);
```

**Response format:**
```json
{
  "ok": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Response

Errors are automatically handled by `withErrorHandling`, but you can create custom errors:

```typescript
const errorResponse = createErrorResponse(
  ErrorType.NOT_FOUND,
  'Resource not found',
  { resourceId: id },
  logger.requestId
);

return res.status(errorResponse.statusCode).json(errorResponse.body);
```

**Response format:**
```json
{
  "ok": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Resource not found",
    "details": { "resourceId": "123" }
  },
  "requestId": "req_1234567890_abc",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Error Types

Available error types from `ErrorType`:

- `VALIDATION` - Invalid request parameters
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `METHOD_NOT_ALLOWED` - HTTP method not allowed
- `RATE_LIMIT` - Rate limit exceeded
- `EXTERNAL_API` - External API error
- `DATABASE` - Database error
- `INTERNAL` - Internal server error
- `CONFIGURATION` - Configuration error
- `STRIPE` - Stripe API error

---

## Logging Best Practices

### What to Log

✅ **Do log:**
- Request method and path
- Query parameters (non-sensitive)
- Request metadata (user ID, IP, etc.)
- Business logic events
- Errors with context

❌ **Don't log:**
- Sensitive data (passwords, tokens, credit cards)
- Full request bodies (log summaries instead)
- Personal information (PII) unless necessary

### Log Levels

- `logger.debug()` - Detailed debugging info (dev only)
- `logger.info()` - Normal operations
- `logger.warn()` - Warnings (non-critical issues)
- `logger.error()` - Errors (with Error object)

### Example

```typescript
logger.info('Processing payment', {
  userId: user.id,
  amount: payment.amount,
  currency: payment.currency,
  // Don't log: payment.cardNumber, payment.cvv
});

logger.error('Payment failed', error, {
  userId: user.id,
  paymentIntentId: paymentIntent.id,
});
```

---

## Examples

### Simple GET Endpoint

```typescript
export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    
    logger.info('Fetching data');
    
    const data = await fetchData();
    
    const response = createSuccessResponse({ data }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

### POST Endpoint with Validation

```typescript
export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    validateBody(req, ['userId', 'amount'], logger);
    
    const { userId, amount } = req.body;
    
    logger.info('Processing request', { userId });
    
    const result = await processRequest(userId, amount);
    
    const response = createSuccessResponse({ result }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

### Protected Endpoint with Rate Limiting

```typescript
import { withAuth } from '../../lib/apiAuth';
import { createApiRateLimiter, withRateLimit } from '../../lib/rateLimitConfig';

const rateLimiter = createApiRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    // ... your logic
  });
}

export default withAuth(
  withRateLimit(handler, rateLimiter),
  { required: true }
);
```

---

## Checklist

When creating a new API route, ensure:

- [ ] Uses `withErrorHandling` wrapper
- [ ] Validates HTTP method
- [ ] Validates required parameters/body
- [ ] Uses structured logging (`logger`)
- [ ] Returns standardized responses (`createSuccessResponse`/`createErrorResponse`)
- [ ] Includes rate limiting if needed
- [ ] Includes authentication if needed
- [ ] Includes CSRF protection if needed
- [ ] Doesn't log sensitive data
- [ ] Has proper TypeScript types
- [ ] Has JSDoc documentation

---

## Related Documentation

- `lib/apiErrorHandler.js` - Error handling utilities
- `lib/structuredLogger.ts` - Structured logging
- `lib/rateLimitConfig.ts` - Rate limiting configuration
- `lib/apiAuth.ts` - Authentication middleware
- `lib/csrfProtection.ts` - CSRF protection
- `docs/API_VERSIONING_POLICY.md` - API versioning guide

---

**Last Updated:** January 2025  
**Template Location:** `pages/api/_template.ts`
