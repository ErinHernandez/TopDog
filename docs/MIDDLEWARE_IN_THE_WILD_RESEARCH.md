# Middleware in the Wild: Industry Research & Best Practices

**Date:** January 23, 2026  
**Status:** Comprehensive Industry Research Complete  
**Scope:** Real-world middleware patterns, best practices, security considerations, and production strategies

---

## Executive Summary

This document compares the bestball-site middleware implementation against industry standards, real-world patterns, and production best practices. Research covers Next.js middleware patterns, A/B testing strategies, security vulnerabilities, performance optimizations, and testing approaches used by leading companies.

**Key Findings:**
- ✅ Implementation aligns well with industry patterns
- ⚠️ Next.js is migrating from `middleware.ts` to `proxy.ts` (November 2025)
- ⚠️ Critical security vulnerability (CVE-2025-29927) discovered in Next.js middleware
- ✅ A/B testing pattern matches industry standards
- ⚠️ Edge runtime caching limitations require stateless design
- ⚠️ Missing comprehensive test coverage (industry standard)

---

## Table of Contents

1. [Next.js Middleware Evolution](#nextjs-middleware-evolution)
2. [Industry Patterns & Best Practices](#industry-patterns--best-practices)
3. [A/B Testing Patterns in Production](#ab-testing-patterns-in-production)
4. [Security Vulnerabilities & Mitigations](#security-vulnerabilities--mitigations)
5. [Performance Optimization Strategies](#performance-optimization-strategies)
6. [Testing Strategies](#testing-strategies)
7. [Migration Patterns](#migration-patterns)
8. [User Identification & Hashing](#user-identification--hashing)
9. [Comparison: Your Implementation vs Industry](#comparison-your-implementation-vs-industry)
10. [Actionable Recommendations](#actionable-recommendations)

---

## Next.js Middleware Evolution

### The `middleware.ts` → `proxy.ts` Migration

**Timeline:** November 2025  
**Status:** Next.js renamed middleware to proxy

**Why the Change:**
- Clarifies purpose: runs at Edge with network boundary
- Discourages overuse (should be lightweight)
- Better reflects deployment model (CDN edge locations)

**Migration Path:**
```bash
# Next.js provides codemod for migration
npx @next/codemod@canary middleware-to-proxy
```

**What Changes:**
- File: `middleware.ts` → `proxy.ts`
- Function: `middleware()` → `proxy()`
- Functionality: Identical (just renaming)

**Impact on Your Codebase:**
- ⚠️ **Action Required:** Plan migration to `proxy.ts`
- ⚠️ **Timeline:** Should migrate before Next.js deprecates `middleware.ts`
- ✅ **Low Risk:** Codemod handles most changes automatically

**Recommendation:**
```typescript
// Future: proxy.ts
export function proxy(request: NextRequest) {
  // Same logic as current middleware
}
```

---

## Industry Patterns & Best Practices

### 1. Path Matching Optimization

**Industry Standard:**
```typescript
// ✅ GOOD: Precise matching
matcher: [
  '/about/:path*',
  '/dashboard/:path*',
]

// ✅ GOOD: Exclude unnecessary routes
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico).*)'
]

// ❌ BAD: Matching everything
matcher: ['/:path*']  // Runs on every request
```

**Your Implementation:**
```typescript
matcher: [
  '/rankings',
  '/my-teams',
  '/exposure',
  '/profile-customization',
  '/customer-support',
  '/deposit-history',
  '/mobile-rankings',
  '/mobile-deposit-history',
  '/mobile-profile-customization',
  '/draft/v2/:path*',
  '/draft/v3/:path*',
  '/draft/topdog/:path*',
]
```

**Assessment:** ✅ **Excellent** - Precise matching, only runs on needed routes

**Industry Best Practice:** Use negative lookaheads to exclude static assets:
```typescript
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)).*)'
]
```

**Recommendation:** Consider adding exclusion pattern to avoid unnecessary middleware execution on static assets.

### 2. What Middleware Should & Shouldn't Do

**Industry Standard - Suitable for Middleware:**
- ✅ Quick redirects based on request data
- ✅ A/B testing and experiments
- ✅ Header modifications
- ✅ Authentication checks (lightweight)
- ✅ Request logging
- ✅ Multi-tenancy routing

**Industry Standard - Avoid in Middleware:**
- ❌ Slow data fetching (database queries)
- ❌ Session management (use cookies/headers instead)
- ❌ Heavy computation
- ❌ File system operations
- ❌ External API calls (unless very fast)

**Your Implementation Assessment:**
- ✅ Redirects: Fast, stateless
- ✅ A/B testing: Appropriate use case
- ✅ Header modifications: Standard pattern
- ✅ No slow operations: Good
- ✅ No database queries: Good

**Verdict:** ✅ **Follows industry best practices**

### 3. Modular Organization

**Industry Pattern:**
```typescript
// middleware.ts (or proxy.ts)
import { handleAuth } from './middleware/auth';
import { handleRedirects } from './middleware/redirects';
import { handleABTesting } from './middleware/ab-testing';

export function middleware(request: NextRequest) {
  // Compose multiple handlers
  return handleAuth(request) 
    || handleRedirects(request)
    || handleABTesting(request)
    || NextResponse.next();
}
```

**Your Implementation:**
- Single file with all logic
- Functions are separated but not modularized

**Recommendation:** Consider splitting into modules:
```
middleware/
├── index.ts (main entry)
├── redirects.ts (removed pages)
├── migration.ts (v2/v3/topdog → vx2)
└── ab-testing.ts (rollout logic)
```

**Benefit:** Easier testing, better maintainability, reusable components

---

## A/B Testing Patterns in Production

### Industry Standard Pattern

**Cookie-Based Assignment (Most Common):**
```typescript
export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('ab-variant');
  
  if (!cookie) {
    // First visit: assign variant
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    const response = NextResponse.next();
    response.cookies.set('ab-variant', variant);
    return response;
  }
  
  // Subsequent visits: use existing variant
  // Route based on cookie value
  return NextResponse.next();
}
```

**Hash-Based Assignment (Your Pattern):**
```typescript
// Your implementation uses consistent hashing
const userHash = getUserHash(request);
const shouldRedirect = userHash < rolloutPercentage;
```

**Comparison:**

| Aspect | Cookie-Based | Hash-Based (Yours) |
|--------|-------------|-------------------|
| **Consistency** | ✅ Stable (cookie persists) | ✅ Stable (deterministic hash) |
| **First Visit** | ⚠️ Random assignment | ✅ Deterministic from first visit |
| **Cookie Dependency** | ⚠️ Requires cookie support | ✅ Works without cookies |
| **Privacy** | ⚠️ Cookie tracking | ✅ No cookies needed |
| **Complexity** | ✅ Simple | ⚠️ More complex (hashing logic) |

**Industry Usage:**
- **Vercel/Cloudflare:** Cookie-based (most common)
- **Your Implementation:** Hash-based (less common but valid)

**Assessment:** ✅ **Your approach is valid and has advantages:**
- No cookie dependency (works for anonymous users)
- Deterministic from first visit (no random assignment)
- Privacy-friendly (no tracking cookies)

**Industry Alternative:** Many companies use both:
- Cookie for authenticated users (more stable)
- Hash for anonymous users (fallback)

**Recommendation:** Consider hybrid approach:
```typescript
function getUserIdentifier(request: NextRequest): string {
  // Try cookie first (authenticated users)
  const cookie = request.cookies.get('ab-variant');
  if (cookie) return cookie.value;
  
  // Fallback to hash (anonymous users)
  return getUserHash(request).toString();
}
```

### Gradual Rollout Patterns

**Industry Standard Stages:**
1. **Early Access:** 1-5% (internal/testing)
2. **A/B Test:** 10-25% (validation)
3. **Gradual:** 25% → 50% → 75% (monitoring)
4. **Full:** 100% (complete migration)

**Your Implementation:**
- ✅ Supports all stages (0% to 100%)
- ✅ Environment variable control
- ✅ Tracking headers for monitoring

**Verdict:** ✅ **Matches industry standard**

### Multi-Variant Support

**Industry Pattern:**
```typescript
// Support multiple variants (A, B, C, D...)
const variants = ['control', 'variant-a', 'variant-b', 'variant-c'];
const assignment = getUserHash(request) * variants.length;
const variant = variants[Math.floor(assignment)];
```

**Your Implementation:**
- Binary: VX2 vs Legacy
- Could be extended for multiple variants

**Assessment:** ✅ **Sufficient for current use case**

---

## Security Vulnerabilities & Mitigations

### Critical Next.js Vulnerability (CVE-2025-29927)

**Discovered:** March 2025  
**CVSS Score:** 9.1 (Critical)  
**Status:** Patched in Next.js 14.2.25 and 15.2.3

**How It Works:**
- Attackers craft requests with `x-middleware-subrequest` header
- Next.js treats request as internal sub-request
- Middleware execution is skipped
- Authorization/authentication bypassed

**Affected Deployments:**
- ❌ Self-hosted Next.js (`next start` with `output: 'standalone'`)
- ✅ Vercel, Netlify, Cloudflare Workers (NOT affected)

**Your Deployment:**
- **Question:** Are you self-hosting or using Vercel?
- **If Vercel:** ✅ Not affected
- **If self-hosted:** ⚠️ Must upgrade to patched version

**Mitigation:**
```typescript
// Temporary workaround (if needed)
export function middleware(request: NextRequest) {
  // Filter out suspicious header
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // ... rest of middleware
}
```

**Recommendation:**
1. ✅ Verify Next.js version (must be ≥ 14.2.25 or ≥ 15.2.3)
2. ✅ Check deployment platform (Vercel is safe)
3. ⚠️ If self-hosted, upgrade immediately

### Edge Runtime Security Limitations

**Industry Knowledge:**
- ❌ No `eval()`, `new Function()`, `WebAssembly.instantiate()`
- ❌ Limited Node.js APIs
- ❌ No file system access
- ✅ 25-second timeout limit

**Your Implementation:**
- ✅ No dynamic code execution
- ✅ No file system operations
- ✅ Fast execution (< 1ms)

**Verdict:** ✅ **Complies with security restrictions**

### IP Spoofing Risks

**Industry Pattern:**
```typescript
// Trusted proxy headers (priority order)
const ip = 
  request.headers.get('cf-connecting-ip') ||  // Cloudflare (most trusted)
  request.headers.get('x-real-ip') ||          // Nginx/Vercel
  request.headers.get('x-forwarded-for')?.split(',')[0] ||  // Last resort
  'unknown';
```

**Your Implementation:**
```typescript
const forwardedFor = request.headers.get('x-forwarded-for');
const realIp = request.headers.get('x-real-ip');
const cfIp = request.headers.get('cf-connecting-ip');
const ip = forwardedFor?.split(',')[0] || realIp || cfIp || 'unknown';
```

**Issue:** ⚠️ **Priority order is reversed** - `x-forwarded-for` is least trusted but checked first

**Industry Best Practice:** Trust `cf-connecting-ip` or `x-real-ip` first

**Recommendation:**
```typescript
// Fix priority order
const ip = 
  request.headers.get('cf-connecting-ip') ||  // Most trusted
  request.headers.get('x-real-ip') ||          // Trusted proxy
  request.headers.get('x-forwarded-for')?.split(',')[0] ||  // Last resort
  'unknown';
```

---

## Performance Optimization Strategies

### Edge Runtime Caching Challenge

**Industry Discovery:**
- Edge runtime is **stateless**
- In-memory caching doesn't persist between requests
- Each execution is independent

**Your Implementation:**
```typescript
// Current: Reads env var on every request
const rolloutPercentage = getRolloutPercentage();
```

**Industry Solution:**
- ✅ **Stateless design** (your approach is correct)
- ✅ **External caching** (Redis, Vercel KV)
- ⚠️ **Module-level caching** (limited effectiveness)

**Module-Level Caching Pattern:**
```typescript
let cachedValue: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

function getRolloutPercentage(): number {
  const now = Date.now();
  if (cachedValue !== null && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedValue;
  }
  
  // Recalculate
  cachedValue = /* ... */;
  cacheTimestamp = now;
  return cachedValue;
}
```

**Assessment:**
- ✅ Your current approach (no caching) is fine for env vars
- ⚠️ Module-level cache may help but limited by stateless nature
- ✅ External cache (Redis) would be overkill for env vars

**Verdict:** ✅ **Current implementation is appropriate**

### Execution Time Optimization

**Industry Benchmark:**
- Target: < 10ms per request
- Your estimate: < 1ms ✅

**Optimization Techniques:**
1. ✅ Precise matcher (you're doing this)
2. ✅ Early returns (you're doing this)
3. ✅ Fast hash function (djb2 is fast)
4. ⚠️ Consider Web Crypto API (if available)

**Recommendation:** Your performance is excellent. No changes needed.

---

## Testing Strategies

### Industry Standard Test Structure

**Three-Tier Approach:**
```
tests/
├── unit/           # Individual functions
├── integration/    # Component interactions
└── e2e/            # Full application flow
```

### Unit Testing Middleware

**Industry Pattern:**
```typescript
// __tests__/middleware.test.ts
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  it('should redirect removed pages to home', () => {
    const request = new NextRequest(new URL('http://localhost/rankings'));
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });
  
  it('should redirect legacy draft routes based on rollout', () => {
    process.env.VX2_ROLLOUT_PERCENTAGE = '1.0';
    const request = new NextRequest(new URL('http://localhost/draft/v2/test'));
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/draft/vx2/test');
  });
});
```

**Your Status:** ❌ **No unit tests found**

**Recommendation:** Add comprehensive unit tests:
- `getRolloutPercentage()` - All env var scenarios
- `getUserHash()` - Consistent hashing, edge cases
- `shouldRedirectToVX2()` - All percentage scenarios
- `middleware()` - Route matching, redirects, headers

### Integration Testing

**Industry Pattern:**
```typescript
// __tests__/integration/middleware.integration.test.ts
import { createMocks } from 'node-mocks-http';

describe('middleware integration', () => {
  it('should preserve query parameters during redirect', async () => {
    const { req, res } = createMocks({
      url: '/draft/v2/test?pickNumber=50&teamCount=12',
    });
    
    await middleware(req, res);
    
    expect(res._getRedirectUrl()).toContain('pickNumber=50');
    expect(res._getRedirectUrl()).toContain('teamCount=12');
  });
});
```

**Your Status:** ❌ **No integration tests found**

### E2E Testing

**Industry Pattern (Playwright):**
```typescript
// e2e/middleware.spec.ts
import { test, expect } from '@playwright/test';

test('should redirect legacy draft route to VX2', async ({ page }) => {
  await page.goto('/draft/v2/test-room');
  await expect(page).toHaveURL(/\/draft\/vx2\/test-room/);
  
  // Verify query params preserved
  const url = new URL(page.url());
  expect(url.searchParams.has('pickNumber')).toBeTruthy();
});
```

**Your Status:** ⚠️ **Playwright exists but no middleware-specific tests**

**Recommendation:** Add E2E tests for:
- Redirect flows
- Query parameter preservation
- Header verification
- A/B test assignment consistency

---

## Migration Patterns

### Incremental Migration Strategy

**Industry Standard:**
- **Vertical Migration:** Migrate features incrementally
- **Horizontal Migration:** Migrate user groups incrementally

**Your Approach:**
- ✅ Horizontal migration (user groups via A/B testing)
- ✅ Gradual rollout (10% → 25% → 50% → 75% → 100%)
- ✅ Monitoring and rollback capability

**Verdict:** ✅ **Follows industry best practices**

### Legacy Route Handling

**Industry Patterns:**

1. **Configuration Redirects (vercel.json):**
   - Up to 2048 routes
   - Static redirects
   - Good for simple migrations

2. **Middleware Redirects:**
   - Dynamic redirects
   - No redeployment needed
   - Good for A/B testing

3. **Bulk Redirects:**
   - Thousands of routes
   - Edge-optimized
   - Good for large migrations

**Your Implementation:**
- ✅ Uses middleware (appropriate for dynamic A/B testing)
- ✅ Could use vercel.json for static redirects (after migration complete)

**Recommendation:** After Phase 1E (legacy cleanup), consider moving static redirects to `vercel.json`:
```json
{
  "redirects": [
    { "source": "/draft/v2/:path*", "destination": "/draft/vx2/:path*", "permanent": false },
    { "source": "/draft/v3/:path*", "destination": "/draft/vx2/:path*", "permanent": false },
    { "source": "/draft/topdog/:path*", "destination": "/draft/vx2/:path*", "permanent": false }
  ]
}
```

**Benefit:** Faster (no middleware execution), simpler code

---

## User Identification & Hashing

### IP Hashing Patterns

**Industry Standard:**
- **Deterministic Hashing:** Same IP → same server
- **Consistent Hashing:** Minimizes reassignment when pool changes
- **2-Tuple Hash:** Source IP + Destination IP (Azure, AWS)

**Your Implementation:**
```typescript
// Single-identifier hash (userId or IP+User-Agent)
const identifier = userId || `${ip}-${userAgent}`;
const hash = djb2Hash(identifier);
```

**Industry Comparison:**
- ✅ Deterministic (same identifier → same hash)
- ✅ Good distribution
- ⚠️ Could use consistent hashing for better stability

**Industry Alternative (Consistent Hashing):**
```typescript
// More stable when rollout percentage changes
function getConsistentHash(identifier: string, buckets: number): number {
  // Uses consistent hashing algorithm
  // Minimizes reassignment when percentage changes
}
```

**Assessment:** ✅ **Your approach is valid** - Consistent hashing would be optimization, not requirement

### User Identification Priority

**Industry Pattern:**
1. Authenticated user ID (most stable)
2. Session ID (stable per session)
3. Device fingerprint (IP + User-Agent)
4. IP only (least stable)

**Your Implementation:**
1. ✅ `userId` cookie (authenticated users)
2. ✅ `x-user-id` header (API requests)
3. ✅ IP + User-Agent (anonymous users)

**Verdict:** ✅ **Matches industry standard priority**

**Industry Enhancement:**
```typescript
// Add session ID support
const sessionId = request.cookies.get('session-id')?.value;
const identifier = userId || sessionId || `${ip}-${userAgent}`;
```

---

## Comparison: Your Implementation vs Industry

### Overall Assessment

| Category | Your Implementation | Industry Standard | Status |
|----------|---------------------|-------------------|--------|
| **Path Matching** | Precise matcher | Precise matcher | ✅ Excellent |
| **A/B Testing** | Hash-based | Cookie-based (common) | ✅ Valid alternative |
| **Gradual Rollout** | 0-100% support | 0-100% support | ✅ Matches |
| **Security** | No auth in middleware | Auth at page level | ✅ Appropriate |
| **Performance** | < 1ms | < 10ms target | ✅ Excellent |
| **Testing** | No tests | Comprehensive tests | ❌ Needs improvement |
| **Modularity** | Single file | Modular structure | ⚠️ Could improve |
| **Error Handling** | None | Error wrapper | ⚠️ Should add |
| **IP Priority** | Reversed order | Trusted first | ⚠️ Should fix |
| **Documentation** | Comprehensive | Varies | ✅ Excellent |

### Strengths

✅ **Excellent Path Matching:** Precise matcher reduces unnecessary execution  
✅ **Fast Performance:** < 1ms execution time  
✅ **Good Documentation:** Comprehensive comments and docs  
✅ **Valid A/B Testing:** Hash-based approach has advantages  
✅ **Flexible Rollout:** Supports all rollout stages  

### Areas for Improvement

⚠️ **Testing:** No unit/integration/E2E tests  
⚠️ **Error Handling:** No error wrapper  
⚠️ **IP Priority:** Should trust `cf-connecting-ip` first  
⚠️ **Modularity:** Could split into modules  
⚠️ **Migration:** Should plan `middleware.ts` → `proxy.ts` migration  

---

## Actionable Recommendations

### Priority 1: Critical (Security & Stability)

1. **Fix IP Priority Order** ⚠️
   ```typescript
   // Current (wrong order)
   const ip = forwardedFor || realIp || cfIp;
   
   // Fix (trusted first)
   const ip = cfIp || realIp || forwardedFor?.split(',')[0];
   ```

2. **Verify Next.js Version** ⚠️
   - Check for CVE-2025-29927 patch
   - Must be ≥ 14.2.25 or ≥ 15.2.3
   - If self-hosted, upgrade immediately

3. **Add Error Handling** ⚠️
   ```typescript
   import { withEdgeErrorHandling } from '@/lib/edgeErrorHandler';
   
   export const middleware = withEdgeErrorHandling(async (request) => {
     // ... existing logic
   });
   ```

### Priority 2: Important (Quality & Maintainability)

4. **Add Unit Tests** ⚠️
   - Test all functions individually
   - Cover edge cases
   - Mock NextRequest/NextResponse

5. **Add Integration Tests** ⚠️
   - Test redirect flows
   - Verify query parameter preservation
   - Test header setting

6. **Add E2E Tests** ⚠️
   - Full redirect flow
   - A/B test assignment consistency
   - Cross-browser testing

### Priority 3: Enhancement (Future Improvements)

7. **Plan `proxy.ts` Migration** 📅
   - Run codemod when ready
   - Update documentation
   - Test thoroughly

8. **Modularize Code** 📅
   - Split into separate modules
   - Better testability
   - Reusable components

9. **Consider Consistent Hashing** 📅
   - Better stability when rollout changes
   - Minimizes user reassignment
   - Optional optimization

10. **Move Static Redirects to vercel.json** 📅
    - After Phase 1E (legacy cleanup)
    - Faster execution
    - Simpler code

---

## Industry Tools & Services

### A/B Testing Platforms

**Industry Options:**
- **Vercel:** Built-in edge middleware
- **Cloudflare:** Pages Functions
- **Third-party:** Statsig, ConfigCat, Split, Builder.io, Google Optimize

**Your Implementation:**
- ✅ Custom implementation (valid)
- ⚠️ Could integrate with third-party for analytics

**Recommendation:** Current implementation is fine. Consider third-party if you need:
- Advanced analytics
- Multi-variant testing
- Feature flags beyond rollout percentage

### Monitoring & Analytics

**Industry Standard:**
- Response headers for tracking (you're doing this ✅)
- Analytics integration (Google Analytics, Mixpanel, etc.)
- Error tracking (Sentry - you have this ✅)

**Your Headers:**
- `X-VX2-Migration`: 'redirected' or 'legacy'
- `X-Rollout-Percentage`: Current percentage

**Assessment:** ✅ **Good tracking setup**

---

## Real-World Examples

### Vercel Platforms (Multi-Tenancy)

**Pattern:**
```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const subdomain = hostname?.split('.')[0];
  
  // Route based on subdomain
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin', request.url));
  }
  
  return NextResponse.next();
}
```

**Your Use Case:** Different (migration, not multi-tenancy)

### Cloudflare A/B Testing

**Pattern:**
```typescript
export async function onRequest(context) {
  const cookie = context.request.headers.get('Cookie');
  const variant = cookie?.includes('variant=B') ? 'B' : 'A';
  
  // Route to variant
  return context.next({
    request: {
      headers: {
        'X-Variant': variant,
      },
    },
  });
}
```

**Comparison:** Similar to your hash-based approach but uses cookies

---

## Summary

### Key Takeaways

1. ✅ **Your implementation is solid** - Follows most industry best practices
2. ⚠️ **Security:** Fix IP priority, verify Next.js version
3. ⚠️ **Testing:** Add comprehensive test coverage
4. 📅 **Future:** Plan `proxy.ts` migration, consider modularization
5. ✅ **Performance:** Excellent (< 1ms execution time)

### Industry Alignment Score: 8/10

**Breakdown:**
- Architecture: 9/10 (excellent)
- Security: 7/10 (needs IP fix, error handling)
- Testing: 3/10 (no tests)
- Performance: 10/10 (excellent)
- Documentation: 10/10 (comprehensive)
- Maintainability: 7/10 (could be more modular)

### Next Steps

1. **Immediate:** Fix IP priority order, add error handling
2. **Short-term:** Add unit and integration tests
3. **Medium-term:** Plan `proxy.ts` migration
4. **Long-term:** Modularize, consider consistent hashing

---

## References

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)
- [CVE-2025-29927 Security Advisory](https://nextjs.org/blog/cve-2025-29927)
- [Vercel Edge Middleware Guide](https://vercel.com/docs/edge-middleware)
- [Cloudflare A/B Testing](https://developers.cloudflare.com/pages/functions/examples/ab-testing)
- [Middleware Testing Strategies](https://www.accelq.com/blog/middleware-testing/)

---

**Last Updated:** January 23, 2026  
**Next Review:** After implementing Priority 1 recommendations
