# Dev Server Fix - Missing Manifest Files

## Problem

After switching from Turbopack to webpack, the dev server fails with missing manifest file errors:
- `middleware-manifest.json`
- `pages-manifest.json`
- `routes-manifest.json`
- `next-font-manifest.json`

## Root Cause

When switching between Turbopack and webpack, the `.next` directory structure gets corrupted. Webpack expects different manifest file formats and locations than Turbopack.

## Solution

**Run these commands in order:**

```bash
# 1. Kill all running processes
lsof -ti:3000,3002,3003 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null

# 2. Deep clean all cache directories
rm -rf .next node_modules/.cache .next/cache

# 3. Start dev server with webpack (should be in package.json already)
npm run dev
```

## Expected Behavior

1. Server should start with: `▲ Next.js 16.1.3 (webpack)` (NOT Turbopack)
2. First page access may take longer as webpack generates manifests
3. After first successful compile, manifest files should exist
4. Subsequent requests should work normally

## If Still Failing

If you still see manifest errors after the above:

1. **Try accessing the root page first** (`/`) to trigger initial build
2. **Wait for "Ready" message** - then wait an additional 5-10 seconds
3. **Check if manifest files exist:**
   ```bash
   ls -la .next/dev/server/*.json
   ```

If files still don't generate, there may be a Next.js 16 webpack compatibility issue.
