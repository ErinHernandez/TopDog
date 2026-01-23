# Collusion Detection System - Test Suite

## Test Files Created

1. **validation.test.ts** - Tests input validation utilities
   - Action and target type validation
   - ID format validation
   - String sanitization
   - Pagination parameter validation

2. **utils.test.ts** - Tests utility functions
   - User pair normalization
   - Pair ID creation/parsing
   - String utilities
   - Math utilities

3. **CollusionFlagService.test.ts** - Tests flag recording service
   - Flag recording logic
   - Transaction retry mechanism
   - Concurrent update handling
   - Error scenarios

4. **PostDraftAnalyzer.test.ts** - Tests post-draft analysis
   - Risk score calculations
   - Behavior pattern detection
   - Benefit score computation
   - Error handling

5. **CrossDraftAnalyzer.test.ts** - Tests cross-draft batch analysis
   - Batch processing
   - Error handling (continue on failure)
   - Pair aggregation
   - Risk level assignment

6. **AdpService.test.ts** - Tests ADP data service
   - Cache management
   - Cache expiration
   - Error handling
   - Data updates

7. **integration.test.ts** - Integration tests
   - API route validation
   - Rate limiting
   - Error handling
   - End-to-end workflows

## Running Tests

```bash
# Run all integrity tests
npm test -- __tests__/lib/integrity

# Run specific test file
npm test -- __tests__/lib/integrity/validation.test.ts

# Run with coverage
npm test -- __tests__/lib/integrity --coverage

# Run in watch mode
npm test -- __tests__/lib/integrity --watch
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for all service files
- **Integration Tests**: Cover all API routes
- **Edge Cases**: Test error scenarios, concurrent operations, invalid inputs

## Test Scenarios Covered

### Validation Tests
- ✅ Valid action/target type validation
- ✅ Invalid input rejection
- ✅ ID format validation
- ✅ String sanitization
- ✅ Pagination parameter validation

### Service Tests
- ✅ Flag recording with retry logic
- ✅ Transaction conflict handling
- ✅ Risk score calculations
- ✅ Batch processing with error handling
- ✅ Cache expiration and refresh

### Integration Tests
- ✅ API route validation
- ✅ Rate limiting enforcement
- ✅ Error handling and logging
- ✅ Admin authentication

## Manual Testing Checklist

After running automated tests, perform manual testing:

- [ ] Deploy Firestore indexes and verify they build
- [ ] Create test draft with co-located users
- [ ] Verify flags are recorded correctly
- [ ] Run post-draft analysis manually
- [ ] Verify admin dashboard displays data
- [ ] Test admin action recording
- [ ] Test rate limiting by making many requests
- [ ] Verify error logs are structured correctly
