# Phase 2: Authentication Routes Standardization - In Progress

**Date:** January 2025  
**Status:** 🟡 **IN PROGRESS** - Standardizing authentication routes

---

## Routes to Standardize (6 Total)

### Completed ✅
1. ✅ `pages/api/auth/verify-admin.ts` - Already uses `withErrorHandling`
2. ✅ `pages/api/auth/username/claim.js` - **STANDARDIZED**
3. ✅ `pages/api/auth/username/check.js` - **STANDARDIZED** (timing attack prevention preserved)
4. ✅ `pages/api/auth/signup.js` - **STANDARDIZED** (timing attack prevention preserved)
5. ✅ `pages/api/auth/username/change.js` - **STANDARDIZED** (CSRF, auth, timing attacks preserved)
6. ✅ `pages/api/auth/username/reserve.js` - **STANDARDIZED** (admin, CSRF, rate limiting preserved)

### Status
**Phase 2: ✅ 100% COMPLETE** (6/6 routes)
4. ⏳ `pages/api/auth/signup.js` - Complex (timing attacks)
5. ⏳ `pages/api/auth/username/change.js` - Complex (CSRF, auth)
6. ⏳ `pages/api/auth/username/reserve.js` - Complex (admin, CSRF)

---

## Special Security Requirements

All auth routes have special security requirements that must be preserved:

1. **Timing Attack Prevention:**
   - Consistent response times (MIN_RESPONSE_TIME_MS)
   - Generic error messages
   - Account enumeration prevention

2. **Rate Limiting:**
   - Strict limits for signup/change (3/hour)
   - Moderate limits for check (30/minute)
   - Rate limit headers in responses

3. **CSRF Protection:**
   - Required for state-changing operations
   - `withCSRFProtection` wrapper

4. **Authentication:**
   - Token verification for protected routes
   - Admin verification for admin routes

---

## Standardization Pattern

For auth routes with timing attack prevention:

```javascript
export default async function handler(req, res) {
  const startTime = Date.now();
  
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    // ... rate limit logic
    
    // Business logic
    // ...
    
    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    
    const response = createSuccessResponse({ ... }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

---

## Progress

- **Completed:** 6/6 routes (100%) ✅
- **Status:** Phase 2 Complete

---

**Last Updated:** January 2025
