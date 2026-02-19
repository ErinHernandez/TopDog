# Soft Launch Code Review - Implementation Handoff

**Project:** Bestball Site
**Date:** January 22, 2026
**Review Type:** Pre-Launch Security & Quality Audit

---

## Quick Stats
- **Source Files:** 1,119
- **Critical Issues:** 5 (MUST fix before launch)
- **High Priority:** 8 (fix within first week)
- **Console Statements:** 588 (cleanup recommended)
- **npm Vulnerabilities:** 23 (20 high severity)

---

# PART 1: CRITICAL ISSUES (Block Launch)

These MUST be fixed before any public traffic hits the site.

---

## Issue 1: Debug Console Logs in Production Entry Points

### Problem
Debug console.log statements will fire for every user, exposing internal state variables.

### Files to Fix

#### Fix 1.1: `pages/index.js`

**DELETE lines 10-13:**
```javascript
// DELETE THIS ENTIRE BLOCK:
  // Debug: Log state values to identify loading issue
  useEffect(() => {
    console.log('[DEBUG index] isLoaded:', isLoaded, 'isMobile:', isMobile);
  }, [isLoaded, isMobile]);
```

**After deletion, the file should go from:**
```javascript
export default function Home() {
  const router = useRouter();
  const { isMobile, isLoaded } = useIsMobileDevice();

  // Debug: Log state values to identify loading issue   // <-- DELETE
  useEffect(() => {                                       // <-- DELETE
    console.log('[DEBUG index] isLoaded:', isLoaded...    // <-- DELETE
  }, [isLoaded, isMobile]);                               // <-- DELETE

  // Automatically redirect mobile devices to mobile app
  useEffect(() => {
```

**To:**
```javascript
export default function Home() {
  const router = useRouter();
  const { isMobile, isLoaded } = useIsMobileDevice();

  // Automatically redirect mobile devices to mobile app
  useEffect(() => {
```

---

#### Fix 1.2: `pages/testing-grounds/vx2-draft-room.js`

**DELETE lines 135-138:**
```javascript
// DELETE THIS ENTIRE BLOCK:
  // Debug: Log state values to identify loading issue
  useEffect(() => {
    console.log('[DEBUG vx2-draft-room] isLoaded:', isLoaded, 'isMobile:', isMobile, 'isAuthorized:', isAuthorized);
  }, [isLoaded, isMobile, isAuthorized]);
```

**ALSO DELETE lines 87, 92, 100, 105 (the VX2 DEBUG console.warn statements):**
```javascript
// DELETE these individual lines:
console.warn('[VX2 DEBUG] handleLeaveDraft called in page component');  // line 87
console.warn('[VX2 DEBUG] Session flag set successfully');               // line 92
console.warn('[VX2 DEBUG] About to navigate to:', targetPath);           // line 100
console.warn('[VX2 DEBUG] Executing navigation now');                    // line 105
```

---

#### Fix 1.3: `components/vx2/auth/components/AuthGateVX2.tsx`

**DELETE lines 97-100:**
```typescript
// DELETE THIS ENTIRE BLOCK:
  // Debug: Log state values to identify loading issue
  useEffect(() => {
    console.log('[DEBUG] isMounted:', isMounted, 'isLoaded:', isMobileLoaded, 'isMobile:', isMobile);
  }, [isMounted, isMobileLoaded, isMobile]);
```

---

## Issue 2: Location Verification Bypass

### Problem
The deposit page bypasses location verification if `window.location.hostname === 'localhost'`. This is dangerous because the `NODE_ENV` check alone should be sufficient, and hostname checks can be spoofed.

### File: `pages/deposit.js`

**CHANGE line 305 FROM:**
```javascript
    if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
```

**TO:**
```javascript
    if (process.env.NODE_ENV === 'development') {
```

**Full context (lines 303-320):**
```javascript
  const getUserLocation = async () => {
    if (locationRequested) return;

    setLocationRequested(true);
    setLoading(true);
    setError('');

    // Development bypass - ONLY check NODE_ENV, never hostname
    if (process.env.NODE_ENV === 'development') {
      console.log('🏠 Development mode: Bypassing location verification');
      setUserLocation({
        latitude: 40.7128,
        longitude: -74.0060,
        country: 'United States',
        state: 'NY'
      });
      // ... rest of function
    }
```

---

## Issue 3: NPM Security Vulnerabilities

### Problem
23 vulnerabilities found (20 high severity). The `overrides` section in package.json already attempts to fix some issues but is incomplete.

### File: `package.json`

**Run this command first to see current state:**
```bash
npm audit
```

**Then run:**
```bash
npm audit fix
```

**If issues remain, update the `overrides` section (lines 35-56). ADD these overrides if not present:**

```json
"overrides": {
  "debug": "4.3.1",
  "semver": "7.5.4",
  "path-to-regexp": "6.2.2",
  "undici": "7.14.0",
  "tar": "6.2.1",
  "esbuild": "0.25.9",
  "@vercel/routing-utils": {
    "path-to-regexp": "6.2.2"
  },
  "express": {
    "path-to-regexp": "6.2.2"
  },
  "path-match": {
    "path-to-regexp": "6.2.2"
  },
  "superstatic": {
    "path-to-regexp": "6.2.2"
  },
  "uuid": "^11.0.0",
  "source-map": "^0.7.4",
  "sourcemap-codec": "npm:@jridgewell/sourcemap-codec@^1.4.15",
  "rollup-plugin-terser": "npm:@rollup/plugin-terser@^0.4.4",
  "whatwg-encoding": "npm:@exodus/bytes@^1.0.0"
}
```

**After editing, run:**
```bash
rm -rf node_modules package-lock.json
npm install
npm audit
```

---

## Issue 4: Test Page Exposes Dev Token

### Problem
`pages/test-create-monitor-account.js` uses `dev-admin-token` and should not be deployed to production.

### Solution Options

**Option A: Delete the file entirely**
```bash
rm pages/test-create-monitor-account.js
```

**Option B: Add to .gitignore and next.config.js exclusion**

Add to `.gitignore`:
```
pages/test-*.js
```

Add to `next.config.js` in the `pageExtensions` or use a custom webpack config:
```javascript
// In next.config.js, add:
module.exports = {
  // ... existing config

  // Exclude test pages from production build
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('ExcludeTestPages', () => {
            const fs = require('fs');
            const path = require('path');
            const testPages = [
              '.next/server/pages/test-create-monitor-account.html',
              '.next/server/pages/test-create-monitor-account.js',
            ];
            testPages.forEach(file => {
              const fullPath = path.join(process.cwd(), file);
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            });
          });
        }
      });
    }
    return config;
  }
};
```

**Option C (Recommended): Add environment check at top of file**

Add to the VERY TOP of `pages/test-create-monitor-account.js`:
```javascript
// Block this page in production
export async function getServerSideProps() {
  if (process.env.NODE_ENV === 'production') {
    return { notFound: true };
  }
  return { props: {} };
}
```

---

## Issue 5: Verify NODE_ENV in Deployment

### Problem
Dev tokens (`dev-token`, `dev-admin-token`) are accepted when `NODE_ENV !== 'production'`. Misconfigured deployments could expose admin access.

### Verification Steps

**1. Check Vercel environment variables:**
```bash
vercel env ls
```

Ensure `NODE_ENV=production` is set.

**2. Add this test to your CI/CD pipeline (`__tests__/security/dev-token-rejection.test.js`):**

**CREATE NEW FILE: `__tests__/security/dev-token-rejection.test.js`**
```javascript
/**
 * Security Test: Verify dev tokens are rejected in production mode
 *
 * CRITICAL: This test MUST pass before any production deployment
 */

describe('Dev Token Security', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('apiAuth', () => {
    it('rejects dev-token when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      // Clear module cache to pick up new NODE_ENV
      jest.resetModules();
      const { verifyAuthToken } = require('../../lib/apiAuth');

      const result = await verifyAuthToken('Bearer dev-token');

      expect(result.uid).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('accepts dev-token ONLY when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { verifyAuthToken } = require('../../lib/apiAuth');

      const result = await verifyAuthToken('Bearer dev-token');

      expect(result.uid).toBe('dev-uid');
    });
  });

  describe('adminAuth', () => {
    it('rejects dev-admin-token when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { verifyAdminAccess } = require('../../lib/adminAuth');

      const result = await verifyAdminAccess('Bearer dev-admin-token');

      expect(result.isAdmin).toBe(false);
    });
  });
});
```

**3. Add to CI pipeline (`.github/workflows/ci.yml` or similar):**
```yaml
- name: Run security tests
  run: npm test -- --testPathPattern="security" --passWithNoTests
  env:
    NODE_ENV: production
```

---

# PART 2: HIGH PRIORITY ISSUES (First Week Post-Launch)

---

## Issue 6: Rate Limiter Fails Open

### Problem
When Firestore errors occur, the rate limiter allows ALL requests (lines 205-216 in `lib/rateLimiter.js`). This is intentional for availability but needs monitoring.

### File: `lib/rateLimiter.js`

**MODIFY the catch block (lines 205-216) to add alerting:**

**CHANGE FROM:**
```javascript
    } catch (error) {
      console.error('Rate limiter error:', error);

      // On error, allow request (fail open for availability)
      // But log the error for monitoring
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
      };
    }
```

**TO:**
```javascript
    } catch (error) {
      console.error('Rate limiter error:', error);

      // On error, allow request (fail open for availability)
      // But log the error for monitoring and alerting

      // Track rate limiter failures for alerting
      if (typeof window === 'undefined') {
        // Server-side: report to Sentry
        try {
          const Sentry = require('@sentry/nextjs');
          Sentry.captureException(error, {
            tags: {
              component: 'rate_limiter',
              endpoint: this.config.endpoint,
              action: 'fail_open'
            },
            level: 'warning'
          });
        } catch (sentryError) {
          // Sentry not available, continue
        }
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
        _failedOpen: true, // Flag for downstream tracking
      };
    }
```

---

## Issue 7: Add ESLint Rule to Prevent Console Statements

### File: `.eslintrc.json`

**ADD the `no-console` rule to prevent future console.log commits:**

**CHANGE FROM:**
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    // existing rules...
  }
}
```

**TO:**
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "no-console": ["warn", {
      "allow": ["warn", "error"]
    }]
  }
}
```

This will:
- WARN on `console.log()` and `console.debug()`
- ALLOW `console.warn()` and `console.error()` (for legitimate error reporting)

---

## Issue 8: Add Content-Security-Policy Headers

### File: `next.config.js`

**ADD security headers to the config:**

```javascript
// Add this to next.config.js

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  }
];

module.exports = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Issue 9: Remove AUTOPICK DEBUG Logs

### File: `components/draft/v3/mobile/apple/DraftRoomApple.js`

**Find line ~1480 and DELETE:**
```javascript
// DELETE this block:
      console.log('🔍 AUTOPICK DEBUG - Top 5 available players by ADP:');
```

**Search the file for all instances of `AUTOPICK DEBUG` and delete them.**

---

## Issue 10: Clean Up Duplicate Files

The codebase has both `.js` and `.ts` versions of several files. This causes confusion and potential bugs.

### Files to Consolidate

| Keep (TypeScript) | Delete (JavaScript) |
|-------------------|---------------------|
| `lib/firebase.ts` | `lib/firebase.js` |
| `lib/adminAuth.ts` | `lib/adminAuth.js` |
| `lib/apiErrorHandler.ts` | `lib/apiErrorHandler.js` |

**Before deleting, verify no imports reference the .js versions:**
```bash
grep -r "from.*firebase\.js" --include="*.ts" --include="*.tsx" --include="*.js" pages/ components/ lib/
grep -r "from.*adminAuth\.js" --include="*.ts" --include="*.tsx" --include="*.js" pages/ components/ lib/
grep -r "from.*apiErrorHandler\.js" --include="*.ts" --include="*.tsx" --include="*.js" pages/ components/ lib/
```

**If no results, safe to delete the .js versions:**
```bash
rm lib/firebase.js
rm lib/adminAuth.js
rm lib/apiErrorHandler.js
```

---

# PART 3: POSITIVE FINDINGS (No Action Needed)

These are good practices already in place:

1. ✅ **Stripe webhook signature verification** with timing-safe comparison and 5-minute replay protection
2. ✅ **Idempotency handling** - webhook events tracked in Firestore
3. ✅ **Input sanitization library** (`lib/inputSanitization.js`) with XSS prevention
4. ✅ **Centralized error handling** (`lib/apiErrorHandler.ts`)
5. ✅ **Firebase Admin singleton pattern** prevents double initialization
6. ✅ **Fraud detection system** with velocity checks and geographic anomaly detection
7. ✅ **Firestore query limits** - all queries use `limit()` clauses
8. ✅ **Admin auth via Firebase custom claims**
9. ✅ **Secrets management** - `.env.local` is gitignored
10. ✅ **Payment security logging** with severity levels

---

# PART 4: RECOMMENDED CI/CD ADDITIONS

Add these scripts to `package.json`:

```json
{
  "scripts": {
    // ... existing scripts
    "precommit": "npm run lint && npm run type-check",
    "security:check": "npm audit --audit-level=high && npm run test:tier0",
    "prebuild": "npm run security:check"
  }
}
```

---

# PART 5: QUICK REFERENCE CHECKLIST

## Before Soft Launch (Required)
- [ ] Delete debug console.logs from `pages/index.js`
- [ ] Delete debug console.logs from `pages/testing-grounds/vx2-draft-room.js`
- [ ] Delete debug console.logs from `components/vx2/auth/components/AuthGateVX2.tsx`
- [ ] Remove hostname check from `pages/deposit.js` line 305
- [ ] Run `npm audit fix`
- [ ] Block test pages from production OR delete them
- [ ] Verify `NODE_ENV=production` in Vercel dashboard
- [ ] Run full test suite: `npm test`

## First Week Post-Launch (Recommended)
- [ ] Add Sentry alerting to rate limiter
- [ ] Add `no-console` ESLint rule
- [ ] Add security headers to `next.config.js`
- [ ] Remove AUTOPICK DEBUG logs
- [ ] Consolidate duplicate JS/TS files
- [ ] Add security tests to CI pipeline

## First Month Post-Launch (Nice to Have)
- [ ] Increase test coverage for payment flows
- [ ] Run `npm run console:plan` and replace remaining console statements with structured logging
- [ ] Security audit of all 4 payment processor integrations

---

# PART 6: TESTING VERIFICATION

After making changes, run:

```bash
# 1. Type check
npm run type-check

# 2. Lint check
npm run lint

# 3. Run tests
npm test

# 4. Build locally
npm run build

# 5. Test production build
npm start
# Then visit http://localhost:3000 and verify:
# - No console logs in browser DevTools
# - Login flow works
# - Deposit page loads (if logged in)
```

---

**Document Version:** 1.0
**Generated:** January 22, 2026
**Reviewer:** Claude Code Review
