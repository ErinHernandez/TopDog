# Tier 1 Testing Guide
## How to Test Completed Items

**Last Updated:** January 2025

---

## Overview

This guide helps you test the Tier 1 items that are complete:
1. ✅ Error Tracking (Sentry)
2. ✅ CI/CD Pipeline (GitHub Actions)

---

## 1. Test Error Tracking (Sentry)

### Step 1: Install Sentry Package

**If npm install works:**
```bash
npm install @sentry/nextjs --save
```

**If npm install has permission issues:**
1. Open Terminal manually (outside Cursor)
2. Navigate to project: `cd /Users/td.d/Documents/bestball-site`
3. Run: `npm install @sentry/nextjs --save`

**Or use yarn:**
```bash
yarn add @sentry/nextjs
```

### Step 2: Create Sentry Account

1. Go to https://sentry.io
2. Sign up (free tier available - 5,000 events/month)
3. Create a new project:
   - Platform: **Next.js**
   - Project name: `topdog-production`
4. Copy your **DSN** from Project Settings > Client Keys
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### Step 3: Add DSN to Environment

**Local (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Vercel Production:**
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add `NEXT_PUBLIC_SENTRY_DSN` with your DSN value
3. Make sure it's enabled for "Production, Preview, and Development"
4. Redeploy

### Step 4: Verify Configuration Files Exist

Check these files exist:
- ✅ `sentry.client.config.ts`
- ✅ `sentry.server.config.ts`
- ✅ `sentry.edge.config.ts`

These were already created - they're ready to use.

### Step 5: Test Error Tracking

**Test Client-Side Errors:**

1. Create a test page or add to any existing page:
```tsx
// pages/test-sentry.js or add to any page
export default function TestSentry() {
  const triggerError = () => {
    throw new Error('Test Sentry error tracking');
  };

  return (
    <button onClick={triggerError}>
      Trigger Test Error
    </button>
  );
}
```

2. Click the button
3. Check Sentry dashboard (https://sentry.io) > Issues
4. You should see the error within 30 seconds

**Test Server-Side Errors:**

1. Add to any API route temporarily:
```ts
// pages/api/test-sentry.js
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  try {
    throw new Error('Test API error');
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Test error sent to Sentry' });
  }
}
```

2. Visit the API route: `http://localhost:3000/api/test-sentry`
3. Check Sentry dashboard for the error

### Step 6: Verify Error Boundaries

Error boundaries have been updated to automatically send errors to Sentry:
- ✅ `components/draft/v2/ui/ErrorBoundary.js` - Updated
- ✅ `components/vx2/navigation/components/TabErrorBoundary.tsx` - Already using error tracking

**To test:**
1. Cause a React error in a component
2. Error boundary should catch it
3. Check Sentry for the error

---

## 2. Test CI/CD Pipeline

### Step 1: Verify Workflow File Exists

The CI workflow file is already created:
- ✅ `.github/workflows/ci.yml`

**Check it exists:**
```bash
ls -la .github/workflows/ci.yml
```

### Step 2: Commit and Push the Workflow

**Option A: Using Git (if you have access):**
```bash
git add .github/workflows/ci.yml
git commit -m "Add CI/CD pipeline"
git push origin main
```

**Option B: Using GitHub Web Interface:**
1. Go to https://github.com/ErinHernandez/TopDog
2. Click "Add file" > "Create new file"
3. Path: `.github/workflows/ci.yml`
4. Copy contents from the file in your project
5. Commit directly to main branch

### Step 3: Verify Pipeline Runs

1. Go to https://github.com/ErinHernandez/TopDog
2. Click "Actions" tab
3. You should see "CI" workflow running
4. Click on it to see the progress

**What it does:**
- Runs tests (`npm test`)
- Builds the app (`npm run build`)
- Checks for security issues (`npm audit`)

### Step 4: Test with a PR (Optional)

1. Create a new branch: `git checkout -b test-ci`
2. Make a small change (add a comment)
3. Push: `git push origin test-ci`
4. Create a Pull Request on GitHub
5. Check the "Checks" tab - CI should run automatically

### Step 5: Enable Branch Protection (Recommended)

Once CI is working:
1. Go to GitHub repo > Settings > Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Select "test" job
   - ✅ Require branches to be up to date

This prevents merging broken code.

---

## Quick Verification Checklist

### Sentry Error Tracking
- [ ] `@sentry/nextjs` package installed
- [ ] Sentry account created
- [ ] DSN added to environment variables
- [ ] Configuration files exist (3 files)
- [ ] Test error appears in Sentry dashboard

### CI/CD Pipeline
- [ ] `.github/workflows/ci.yml` file exists
- [ ] File committed and pushed to GitHub
- [ ] GitHub Actions tab shows workflow runs
- [ ] Tests run successfully
- [ ] Build completes successfully

---

## Troubleshooting

### Sentry Not Working

**Issue:** Errors not appearing in Sentry
- Check DSN is set: `echo $NEXT_PUBLIC_SENTRY_DSN`
- Check Sentry dashboard for "Issues" (not "Events")
- Verify you're in production mode or have `localStorage.setItem('sentry_debug', 'true')`
- Check browser console for Sentry initialization messages

**Issue:** Package not installing
- Try: `npm install @sentry/nextjs --save --legacy-peer-deps`
- Or use yarn: `yarn add @sentry/nextjs`
- Check Node.js version: `node --version` (should be 16+)

### CI Pipeline Not Running

**Issue:** Workflow not appearing in GitHub Actions
- Verify file is at `.github/workflows/ci.yml` (exact path)
- Check file is committed and pushed
- Verify you're on the correct branch (main or develop)
- Check GitHub Actions is enabled for your repo (Settings > Actions)

**Issue:** Tests failing in CI
- Run tests locally: `npm test`
- Check test output in GitHub Actions logs
- Fix failing tests before merging

**Issue:** Build failing in CI
- Run build locally: `npm run build`
- Check build output in GitHub Actions logs
- Common issues: TypeScript errors, missing environment variables

---

## Success Criteria

### Sentry
✅ Errors appear in Sentry dashboard within 30 seconds  
✅ Error boundaries capture React errors  
✅ API route errors are tracked  
✅ You can see real user errors you didn't know about

### CI/CD
✅ Pipeline runs on every push/PR  
✅ Tests must pass before merging (if branch protection enabled)  
✅ Build succeeds  
✅ You catch broken code before it reaches production

---

## Next Steps After Testing

1. **Monitor Sentry** - Check daily for new errors
2. **Fix Critical Errors** - Prioritize errors affecting most users
3. **Set Up Alerts** - Get notified of new error types
4. **Review CI Results** - Fix any failing tests
5. **Enable Branch Protection** - Require CI to pass before merging

---

## Related Documents

- `TIER1_ERROR_TRACKING_SETUP.md` - Detailed Sentry setup
- `TIER1_CICD_SETUP.md` - Detailed CI/CD setup
- `GITHUB_ACTIONS_EXPLAINED.md` - What GitHub Actions is
- `TIER1_COMPLETE_SUMMARY.md` - Tier 1 completion summary

---

**Ready to test!** Start with Sentry (it's the quickest win - you'll immediately see errors you didn't know about).
