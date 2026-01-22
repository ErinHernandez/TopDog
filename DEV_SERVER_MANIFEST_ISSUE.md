# Dev Server Manifest Files Issue - Investigation & Solution

## Problem

After removing Turbopack and switching to webpack (`--webpack` flag), the dev server fails with missing manifest file errors:

**Errors:**
- `Cannot find module '/Users/td.d/Documents/bestball-site/.next/dev/server/middleware-manifest.json'`
- `ENOENT: no such file or directory, open '/Users/td.d/Documents/bestball-site/.next/dev/server/pages-manifest.json'`
- `ENOENT: no such file or directory, open '/Users/td.d/Documents/bestball-site/.next/dev/server/routes-manifest.json'`
- `Cannot find module '/Users/td.d/Documents/bestball-site/.next/dev/server/pages/_document.js'`

**Result:** All page requests return `500 Internal Server Error`

## Root Cause Analysis

1. **Next.js 16.1.3 with webpack** expects manifest files to exist before serving pages
2. **Manifest files are generated** during successful page compilation
3. **Chicken-and-egg problem:** Pages can't compile without manifests, but manifests aren't generated until pages compile successfully
4. **TypeScript errors** were also blocking successful compilation (Stripe API version mismatch)

## Fixes Applied

### ✅ Fixed Stripe API Version Mismatch

**Files Updated:**
- `lib/payments/providers/stripe.ts` - Updated to `'2025-08-27.basil'`
- `lib/stripe/stripeService.ts` - Updated to `'2025-08-27.basil'`
- `pages/api/stripe/cancel-payment.ts` - Updated to `'2025-08-27.basil'`
- `pages/api/stripe/webhook.ts` - Updated to `'2025-08-27.basil'`
- `pages/api/stripe/pending-payments.ts` - Updated to `'2025-08-27.basil'`

**Reason:** Stripe types expect `'2025-08-27.basil'` but code was using `'2025-07-30.basil'`, causing TypeScript compilation errors that prevented manifest generation.

### ✅ Fixed TypeScript Build Errors

**Files Fixed:**
- `components/vx2/tabs/slow-drafts/components/PositionNeedsIndicator.tsx` - Fixed return type
- `components/vx2/tabs/slow-drafts/hooks/useSlowDrafts.ts` - Fixed filter type and boolean type
- `components/vx2/tabs/slow-drafts/constants.ts` - Added `'needsAttention'` to FilterOption

## Workaround Applied

Created minimal stub manifest files to bootstrap the webpack compilation process:

- `.next/dev/server/middleware-manifest.json` - Empty middleware manifest
- `.next/dev/server/pages-manifest.json` - Empty pages manifest  
- `.next/dev/server/routes-manifest.json` - Basic routes manifest

**Why this works:** Next.js webpack needs these files to exist before it can compile pages, but they're normally generated during the first successful compilation. This creates a chicken-and-egg problem. The stub files allow the first compilation to succeed, which then generates proper manifests.

## Next Steps

### 1. Restart Dev Server

```bash
# Kill all processes
lsof -ti:3000,3002,3003 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Start dev server (stub manifests should allow compilation)
npm run dev
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Expected Behavior

**If TypeScript errors were blocking compilation:**
- ✅ Server should start successfully
- ✅ First page compilation should succeed
- ✅ Manifest files should be generated automatically
- ✅ Subsequent page requests should work

**If manifest issue persists:**
- This is likely a Next.js 16.1.3 webpack initialization bug
- May need to wait for Next.js update or use a workaround

## Known Issues

### Next.js 16.1.3 Webpack Initialization

There appears to be a bug where webpack doesn't generate manifest files on initial startup in some cases. This is separate from the TypeScript errors.

**Potential Workarounds:**
1. Access root page (`/`) first to trigger initial build
2. Wait 10-15 seconds after "Ready" message before accessing pages
3. Try production build first: `npm run build` (may generate required structure)

## Verification

After fixes, verify:
1. ✅ No TypeScript compilation errors
2. ✅ Server starts without errors
3. ✅ Root page (`/`) loads successfully
4. ✅ Manifest files exist: `.next/dev/server/*.json`

---

**Status:** TypeScript errors fixed. Manifest issue may still require Next.js update or additional troubleshooting.
