# API Response & Handler Quick Reference

## Import Statements

```typescript
// Response envelope functions
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimited,
  sendServerError,
  generateRequestId,
} from '@/lib/apiResponse';

// Handler creation
import {
  createApiHandler,
  createGetHandler,
  createPostHandler,
  createAuthenticatedPostHandler,
  createRateLimitedHandler,
  type ApiHandlerConfig,
  type HandlerContext,
} from '@/lib/apiHandler';
```

## Response Functions Cheat Sheet

### Success Response
```typescript
sendSuccess(res, data, statusCode?)
// Example:
sendSuccess(res, { userId: '123', email: 'user@example.com' }, 200);
```

### Error Response
```typescript
sendError(res, code, message, statusCode?, details?)
// Example:
sendError(res, 'INVALID_EMAIL', 'Email format is invalid', 400, { field: 'email' });
```

### Validation Error
```typescript
sendValidationError(res, errors)
// Example:
sendValidationError(res, [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Must be at least 8 characters' }
]);
```

### Not Found
```typescript
sendNotFound(res, resource)
// Example:
sendNotFound(res, 'User');
```

### Unauthorized (401)
```typescript
sendUnauthorized(res, message?)
// Example:
sendUnauthorized(res, 'Invalid authentication token');
```

### Forbidden (403)
```typescript
sendForbidden(res, message?)
// Example:
sendForbidden(res, 'You do not have permission to delete this resource');
```

### Rate Limited (429)
```typescript
sendRateLimited(res, retryAfter?)
// Example:
sendRateLimited(res, 60000); // Retry after 60 seconds
```

### Server Error (500)
```typescript
sendServerError(res, error)
// Example:
sendServerError(res, new Error('Database connection failed'));
```

## Handler Creation Cheat Sheet

### Simple GET Handler
```typescript
import { createGetHandler } from '@/lib/apiHandler';

export default createGetHandler(async (req, res, context) => {
  res.json({ message: 'Success' });
});
```

### Simple POST Handler
```typescript
import { createPostHandler } from '@/lib/apiHandler';

export default createPostHandler(async (req, res, context) => {
  res.json({ created: true });
});
```

### Authenticated POST Handler
```typescript
import { createAuthenticatedPostHandler } from '@/lib/apiHandler';

export default createAuthenticatedPostHandler(async (req, res, context) => {
  res.json({ userId: context.userId });
});
```

### Rate-Limited Handler
```typescript
import { createRateLimitedHandler } from '@/lib/apiHandler';

export default createRateLimitedHandler(
  async (req, res, context) => {
    res.json({ success: true });
  },
  10,      // maxRequests
  60000    // windowMs (1 minute)
);
```

### Full Featured Handler
```typescript
import { z } from 'zod';
import { createApiHandler } from '@/lib/apiHandler';

export default createApiHandler({
  methods: ['POST', 'PUT'],
  auth: 'user',
  rateLimit: { maxRequests: 50, windowMs: 3600000 },
  schema: z.object({
    email: z.string().email(),
    name: z.string().min(1)
  }),
  handler: async (req, res, context) => {
    const { email, name } = context.validatedData as any;

    context.logger.info('Updating user', {
      userId: context.userId,
      email
    });

    res.json({ success: true, email, name });
  }
});
```

## Handler Context Usage

```typescript
interface HandlerContext {
  requestId: string;      // UUID for correlation
  userId?: string;        // Auth'd user ID
  userEmail?: string;     // Auth'd user email
  authLevel: AuthLevel;   // 'user'|'admin'|'system'|'none'
  logger: HandlerLogger;  // Structured logger
  validatedData?: unknown; // Validated request data
}

// Usage:
context.logger.info('Processing request', { userId: context.userId });
context.requestId; // For distributed tracing
```

## Logging Examples

```typescript
// Info level
context.logger.info('Processing payment', { amount: 100, currency: 'USD' });

// Warning level
context.logger.warn('Unusual pattern detected', { metric: 'high_latency' });

// Error level
context.logger.error('Payment failed', error, { transactionId: 'tx_123' });

// Debug level (dev only)
context.logger.debug('Request payload', { body: req.body });
```

## Auth Levels

- `'none'` - No authentication required (public endpoints)
- `'user'` - Standard authenticated user required
- `'admin'` - Admin-only endpoint
- `'system'` - Internal/system-only endpoint

## Response Format

All responses include:
- `success` (boolean) - Whether request succeeded
- `data` (optional) - Response data for success
- `error` (optional) - Error details for failure
- `meta` (object) - Metadata including:
  - `timestamp` - ISO 8601 timestamp
  - `requestId` - UUID v4 for correlation
  - `version` - API version

## Common Patterns

### Validation with Zod
```typescript
schema: z.object({
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
  newsletter: z.boolean().optional()
})
```

### Custom Error Handling
```typescript
handler: async (req, res, context) => {
  try {
    // Your logic
  } catch (error) {
    context.logger.error('Failed to process', error as Error);
    sendError(res, 'PROCESS_FAILED', 'Failed to process request', 500);
  }
}
```

### Conditional Auth
```typescript
auth: req.method === 'POST' ? 'user' : 'none'
// Note: Use createApiHandler for dynamic auth
```

### Multiple HTTP Methods
```typescript
methods: ['GET', 'POST', 'PUT', 'DELETE']
// Handler receives all methods - check req.method if needed
```

## Environment Variables

Set to customize API response version:

```bash
API_VERSION=2.0.0
```

Default: `1.0.0` (from package.json)

## Response Headers Added Automatically

- `X-Request-ID` - Unique request identifier
- `X-RateLimit-Limit` - Max requests (if rate limited)
- `X-RateLimit-Remaining` - Remaining requests (if rate limited)
- `X-RateLimit-Reset` - Reset timestamp (if rate limited)
- `Retry-After` - Retry time in seconds (if rate limited)
- `Content-Type` - `application/json`

## Error Codes

Common error codes used throughout the API:

- `VALIDATION_ERROR` - Input validation failed (400)
- `UNAUTHORIZED` - Authentication required/failed (401)
- `FORBIDDEN` - Permission denied (403)
- `NOT_FOUND` - Resource not found (404)
- `METHOD_NOT_ALLOWED` - HTTP method not supported (405)
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded (429)
- `INTERNAL_SERVER_ERROR` - Server error (500)

## Testing Example

```typescript
// Jest test
import { createApiHandler } from '@/lib/apiHandler';
import { createMocks } from 'node-mocks-http';

it('returns success response', async () => {
  const handler = createGetHandler(async (req, res) => {
    res.json({ message: 'hello' });
  });

  const { req, res } = createMocks();
  await handler(req, res);

  expect(res._getStatusCode()).toBe(200);
  expect(res._getJSONData().success).toBe(true);
});
```

## Migration Checklist

For each endpoint:
- [ ] Replace handler with `createApiHandler`
- [ ] Add `methods` array
- [ ] Add `schema` if validating input
- [ ] Add `auth` if protected
- [ ] Use `context.validatedData` if schema
- [ ] Update response calls to use `res.json()`
- [ ] Test endpoint with curl/postman
- [ ] Verify X-Request-ID in response
- [ ] Check logs include requestId

## Performance Tips

1. Use `context.logger.debug()` for verbose output (dev only)
2. Add `requestId` to async operations for tracing
3. Include `duration` in logged context for slowness tracking
4. Use rate limiting for expensive operations
5. Cache validation schemas outside handler

## Debugging

### Check Request ID in Logs
```bash
# Find logs for specific request
grep "550e8400-e29b-41d4-a716-446655440000" logs/api.log
```

### Enable Debug Logging
```bash
NODE_ENV=development npm run dev
```

### Check Response Headers
```bash
curl -i https://api.example.com/endpoint
# Look for X-Request-ID header
```

## Links

- Full API Response Guide: `/API_RESPONSE_MIGRATION.md`
- apiResponse.ts: `/lib/apiResponse.ts`
- apiHandler.ts: `/lib/apiHandler.ts`
- serverLogger: `/lib/logger/serverLogger.ts`
- apiAuth: `/lib/apiAuth.ts`
- rateLimiter: `/lib/rateLimiter.ts`
