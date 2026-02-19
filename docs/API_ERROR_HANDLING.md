# API Error Handling & Logging Guide

This document describes the centralized error handling and logging system for API routes.

## Overview

All API routes should use the `withErrorHandling` wrapper from `lib/apiErrorHandler.js` to ensure:
- Consistent error responses
- Request ID tracking for debugging
- Structured logging with context
- Automatic error categorization
- Security-conscious error messages

## Basic Usage

### Simple Example

```javascript
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Processing request');

    // Your route logic here
    const data = await fetchSomeData(apiKey);

    // Return success response
    const response = createSuccessResponse(data, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

## Helper Functions

### `validateMethod(req, allowedMethods, logger)`
Validates that the request method is in the allowed list.

```javascript
validateMethod(req, ['GET', 'POST'], logger);
// Throws error if method not allowed
```

### `validateQueryParams(req, requiredParams, logger)`
Validates that all required query parameters are present.

```javascript
validateQueryParams(req, ['userId', 'draftId'], logger);
// Throws ValidationError if any params missing
```

### `validateBody(req, requiredFields, logger)`
Validates that all required body fields are present.

```javascript
validateBody(req, ['email', 'password'], logger);
// Throws ValidationError if any fields missing
```

### `requireEnvVar(varName, logger)`
Checks that an environment variable exists and returns its value.

```javascript
const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);
// Throws ConfigurationError if not found
```

## Error Types

The system automatically categorizes errors:

- `VALIDATION_ERROR` (400) - Invalid request parameters
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Permission denied
- `NOT_FOUND` (404) - Resource not found
- `METHOD_NOT_ALLOWED` (405) - Invalid HTTP method
- `RATE_LIMIT` (429) - Too many requests
- `EXTERNAL_API_ERROR` (502) - External service unavailable
- `DATABASE_ERROR` (503) - Database connection issues
- `CONFIGURATION_ERROR` (500) - Missing/invalid configuration
- `INTERNAL_SERVER_ERROR` (500) - Generic server error

## Throwing Custom Errors

You can throw errors that will be automatically categorized:

```javascript
// Validation error
const error = new Error('User ID is required');
error.name = 'ValidationError';
throw error;

// Not found error
const error = new Error('Player not found');
error.message = 'Player not found';
throw error; // Will be detected as NOT_FOUND if message contains "not found"
```

## Manual Error Responses

For cases where you need to return a specific error response:

```javascript
import { ErrorType, createErrorResponse } from '../../../lib/apiErrorHandler';

if (!player) {
  const errorResponse = createErrorResponse(
    ErrorType.NOT_FOUND,
    'Player not found',
    { playerId: id },
    res.getHeader('X-Request-ID')
  );
  return res.status(errorResponse.statusCode).json(errorResponse.body);
}
```

## Logging

The `logger` object provides structured logging methods:

```javascript
logger.info('Processing request', { userId: '123' });
logger.debug('Debug information', { count: 42 });
logger.warn('Warning message', { reason: 'something' });
logger.error('Error occurred', error, { context: 'additional info' });
```

Logs include:
- Timestamp
- Request ID (for tracking across logs)
- Route and method
- Duration
- Message and context

## Request ID

Each request gets a unique request ID that:
- Is included in response headers as `X-Request-ID`
- Is included in all log entries
- Is included in error responses
- Can be used by clients to track requests

## Success Responses

Use `createSuccessResponse` for consistent success responses:

```javascript
const response = createSuccessResponse(data, 200, logger);
return res.status(response.statusCode).json(response.body);
```

Response format:
```json
{
  "ok": true,
  "data": { ... },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Player not found",
    "requestId": "req_1234567890_abc123",
    "timestamp": "2025-01-15T12:00:00.000Z",
    "details": {
      "playerId": "12345"
    }
  }
}
```

## Migration Guide

### Before:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // ... logic ...
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
```

### After:
```javascript
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    // ... logic ...
    const response = createSuccessResponse(data, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

## Best Practices

1. **Always use `withErrorHandling`** - Wraps all route handlers
2. **Use helper functions** - `validateMethod`, `requireEnvVar`, etc.
3. **Use structured logging** - Include context with log messages
4. **Don't log sensitive data** - Passwords, tokens, etc. should never be logged
5. **Use appropriate error types** - Helps with monitoring and debugging
6. **Include request IDs** - Essential for debugging in production
7. **Log at appropriate levels** - Use `info` for normal operations, `warn` for issues, `error` for failures

## Development vs Production

- **Development**: All logs are printed, stack traces included, full error details
- **Production**: Only errors and warnings are logged, sensitive details filtered, concise output

Logging level is controlled by `process.env.NODE_ENV`.

