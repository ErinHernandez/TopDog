# Middleware Unit Tests

Comprehensive unit test suite for the Idesaign backend middleware stack (Phase 0).

## Test Files

### middlewareChain.test.ts
Tests the core middleware composition system.
- **Coverage**: `withMiddleware()`, `createMiddlewareStack()`
- **Tests**: 12 cases
- **Key scenarios**:
  - Middleware execution order
  - Handler invocation timing
  - Error propagation and chain interruption
  - Request short-circuiting
  - Async middleware support
  - Stack reusability

### cors.test.ts
Tests the CORS middleware factory.
- **Coverage**: `createCorsMiddleware()`
- **Tests**: 9 cases
- **Key scenarios**:
  - CORS header setting
  - OPTIONS preflight handling
  - Environment-based origin configuration
  - Custom CORS options
  - Origin validation

### validation.test.ts
Tests the Zod validation middleware.
- **Coverage**: `createValidationMiddleware()`
- **Tests**: 12 cases
- **Key scenarios**:
  - Body and query validation
  - Error formatting and details
  - Nested object/field validation
  - Type coercion
  - Request attachment of validated data

### errorHandler.test.ts
Tests the error handling middleware and error classes.
- **Coverage**: `createErrorHandler()`, error classes (Validation, NotFound, Forbidden, Conflict)
- **Tests**: 21 cases
- **Key scenarios**:
  - RequestId generation and tracking
  - HTTP status code mapping (400, 403, 404, 409, 500)
  - Error logging with context
  - Response formatting
  - Error class inheritance

### requestLogger.test.ts
Tests the request logging middleware.
- **Coverage**: `createRequestLogger()`
- **Tests**: 14 cases
- **Key scenarios**:
  - Method, path, and status logging
  - Duration measurement
  - User tracking
  - Proper middleware ordering
  - Timestamp formatting

### rateLimitingMiddleware.test.ts
Tests the in-memory rate limiting middleware.
- **Coverage**: `createRateLimitMiddleware()`, `InMemoryRateLimiter`
- **Tests**: 22 cases
- **Key scenarios**:
  - Request limiting and window management
  - Rate limit headers (X-RateLimit-*)
  - Retry-After calculation
  - Key extraction strategies (UID, IP, custom)
  - Window expiration and reset

## Running Tests

```bash
# Run all middleware tests
vitest __tests__/unit/middleware

# Run specific test file
vitest __tests__/unit/middleware/middlewareChain.test.ts

# Run with coverage
vitest --coverage __tests__/unit/middleware
```

## Test Structure

Each test file follows this pattern:
1. Module documentation
2. Hoisted mocks (vi.hoisted)
3. Mock utilities (createMockReq, createMockRes)
4. Test suites organized by function/class
5. Setup/teardown in beforeEach/afterEach

## Mock Pattern

All tests use a consistent mocking pattern:

```typescript
function createMockReq(overrides = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    body: {},
    query: {},
    url: '/api/test',
    ...overrides,
  } as NextApiRequest;
}

function createMockRes(): NextApiResponse {
  // Mock implementation with status(), json(), setHeader(), end()
  // using vi.fn() for spy/assertion
}
```

## Coverage Summary

- **Total test cases**: 100+
- **Middleware functions tested**: 6
- **Error classes tested**: 4
- **API handler factories**: Tested in companion file

## Key Testing Principles

1. **Isolation**: Each test is independent and can run in any order
2. **Clarity**: Test names describe what is being tested
3. **Completeness**: Happy path, error cases, and edge cases
4. **Realism**: Mocks replicate actual Next.js request/response objects
5. **Maintainability**: Shared mock utilities reduce duplication

## Notes

- Tests use TypeScript strict mode with `import type` for type-only imports
- All tests compatible with Vitest v4
- Mocks for external dependencies (Firebase, etc.) are properly isolated
- Console mocks prevent noise during test runs
- Async operations properly awaited

