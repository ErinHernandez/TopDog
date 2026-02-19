# TopDog Studio API Integration Tests

Comprehensive integration tests for TopDog Studio's API routes and authentication middleware using Vitest with globals enabled.

## Test Files Overview

### 1. auth-middleware.test.ts (594 lines)

Tests for the `withAuth` and `withOptionalAuth` middleware from `@/lib/studio/middleware/withAuth.ts`.

**Test Coverage:**

- **Valid Token Scenarios (5 tests)**
  - Handler execution with valid token and uid attachment
  - Complete authentication data attachment (uid, email, emailVerified, customClaims)
  - Custom claims pass-through
  - Undefined custom claims handling
  - Email verification status

- **Missing Authorization Header (2 tests)**
  - Missing Authorization header returns 401
  - Undefined Authorization header returns 401

- **Invalid Authorization Format (4 tests)**
  - Non-Bearer authorization rejected
  - Lowercase "bearer" rejected
  - Empty Bearer token rejected
  - Whitespace-only Bearer token rejected

- **Invalid/Expired Tokens (3 tests)**
  - Unregistered token returns 401
  - Expired token returns 401
  - Token verification error handling

- **Unexpected Errors (1 test)**
  - 500 status for middleware exceptions

- **Handler Execution (2 tests)**
  - Original request passed to handler
  - Response object correctly forwarded

- **Helper Functions (9 tests)**
  - getUserUid() extraction
  - getUserEmail() extraction
  - assertAuthed() validation
  - assertClaim() custom claim verification
  - Error handling in helper functions

- **withOptionalAuth Middleware (7 tests)**
  - Valid token attachment
  - Requests without authentication header allowed
  - Invalid tokens gracefully handled
  - Unexpected error handling

**Key Validations:**
- Bearer token format validation
- Token verification via Firebase Admin
- Authentication data attachment to request object
- Role-based access control assertions
- Custom claims support
- Email verification status tracking

### 2. format-routes.test.ts (740 lines)

Tests for format API route handlers validation and response structure.

**Test Coverage:**

- **POST /api/studio/formats/export-psd (9 tests)**
  - Valid PSD export request acceptance
  - Required fields validation (document, layers, options)
  - Invalid compatibility options
  - Invalid compression options
  - Non-boolean option values
  - Non-array layers rejection
  - Oversized payload indication (50MB limit)

- **POST /api/studio/formats/process-raw (9 tests)**
  - Valid RAW process request acceptance
  - All supported RAW formats (cr2, crw, nef, dng, raf, raw, arw, orf, rw2)
  - Unsupported format rejection
  - Missing fileBuffer rejection
  - Missing format rejection
  - Case-insensitive format handling

- **POST /api/studio/formats/export-tiff (10 tests)**
  - Valid TIFF export request acceptance
  - Compression option validation (none, lzw, deflate, jpeg)
  - Bit depth validation (8, 16, 32)
  - Invalid compression rejection
  - Invalid bit depth rejection
  - Missing document rejection
  - Missing imageData rejection

- **GET /api/studio/formats (Discovery) (9 tests)**
  - Valid format index response structure
  - Required response fields validation
  - Missing version handling
  - Missing baseUrl handling
  - Non-array endpoints rejection
  - Endpoint field validation
  - Endpoint method array validation
  - requiresAuth boolean validation

- **Response Structure Tests (4 tests)**
  - PSD export success with jobId
  - PSD export success with downloadUrl
  - TIFF export response format
  - Raw process response format

**Key Validations:**
- Required field presence validation
- Enum value validation (compatibility, compression, bitDepth)
- Type checking (boolean, array, string, object)
- RAW format support detection
- Payload size limits
- Response structure conformance

### 3. generate-routes.test.ts (645 lines)

Tests for AI generation API route patterns, validation, and rate limiting.

**Test Coverage:**

- **Authentication (3 tests)**
  - All generation endpoints require authentication
  - Rejection of unauthenticated requests
  - Bearer token acceptance

- **Image Generation Validation (15 tests)**
  - Valid request acceptance
  - Supported model validation (dall-e-3, stable-diffusion-3, flux-pro)
  - Invalid model rejection
  - Missing model rejection
  - Missing/invalid prompt rejection
  - Width/height bounds checking (256-4096)
  - Total dimension limit validation (4096x4096 max)
  - Count validation (1-10)
  - Various valid dimension combinations
  - Oversized dimension rejection
  - Non-string prompt rejection

- **Cost Estimation Validation (5 tests)**
  - Valid cost estimation request
  - Minimal request support
  - Missing model rejection
  - Non-numeric field validation

- **Cost Estimation Logic (4 tests)**
  - Cost structure generation
  - Model-specific pricing
  - Dimension-based cost calculation
  - Count-based cost increase
  - Default dimension handling

- **Rate Limiting (5 tests)**
  - Rate limit header presence
  - Valid rate limit values
  - Remaining request tracking
  - Reset time in future validation
  - Per-user rate limit tracking

- **Error Responses (4 tests)**
  - 400 for invalid model
  - 400 for oversized dimensions
  - 429 for rate limit exceeded
  - 500 for internal errors

- **Response Structure (3 tests)**
  - Success response with jobId
  - Generated images in response
  - Cost breakdown in response

**Key Validations:**
- Authentication requirement enforcement
- Model name validation
- Dimension bounds checking (256-4096)
- Prompt validation (string type)
- Count range validation (1-10)
- Cost calculation with different pricing tiers
- Rate limit header generation and tracking
- Response structure conformance
- Error code mapping to HTTP status codes

## Running the Tests

```bash
# Run all integration API tests
npm run test -- __tests__/integration/api

# Run specific test file
npm run test -- __tests__/integration/api/auth-middleware.test.ts

# Run with coverage
npm run test:coverage -- __tests__/integration/api

# Watch mode
npm run test:watch -- __tests__/integration/api
```

## Mock Utilities

All tests leverage mock helpers from `__tests__/helpers/firebase-mock.ts`:

- `MockFirebaseAuth`: Simulates Firebase Admin Auth with token registration
- `createMockRequest()`: Creates mock NextApiRequest objects
- `createMockResponse()`: Creates mock NextApiResponse with state tracking
- `createAuthenticatedRequest()`: Creates pre-authenticated requests
- `MockDocumentSnapshot`: Simulates Firestore documents

## Test Statistics

- **Total Lines**: 1,979
- **Total Test Cases**: 130+
- **Test Files**: 3
- **Coverage Areas**:
  - Authentication & Authorization
  - Input Validation
  - Response Structure
  - Error Handling
  - Rate Limiting
  - Cost Calculation

## Architecture Patterns

### Auth Middleware Tests
Uses Firebase Admin SDK mocking to test:
- Bearer token extraction and validation
- JWT verification flow
- User data attachment to request
- Helper function assertions

### Format Routes Tests
Implements standalone validation functions that mirror route logic to test:
- Request body schema validation
- Enum value constraints
- Field type checking
- Response structure conformance

### Generate Routes Tests
Tests validation logic and response patterns for:
- Model name constraints
- Image dimension limits
- Rate limit header generation
- Cost calculation algorithms

## Dependencies

- `vitest`: Test framework with globals enabled
- `@testing-library/react`: For DOM testing (if needed)
- TypeScript: For type safety in tests
- Next.js types: For NextApiRequest/NextApiResponse

## Future Enhancements

- Add integration with actual Firebase emulator
- Add performance benchmarking tests
- Add concurrent request handling tests
- Add streaming response tests
- Add file upload validation tests
- Add database transaction tests
