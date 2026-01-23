# Tier 1 Testing Status
## Current State & Next Steps

**Date:** January 2025  
**Status:** Ready to test, some setup needed

---

## Quick Status

| Item | Status | Action Needed |
|------|--------|---------------|
| **Sentry Config Files** | ✅ Ready | Install package + add DSN |
| **CI Workflow File** | ✅ Ready | Commit and push to GitHub |
| **Jest Tests** | ⚠️ Needs Fix | Missing dependency |
| **Linter** | ⚠️ Needs Fix | Configuration issue |

---

## 1. Sentry Error Tracking

### ✅ What's Ready
- ✅ `sentry.client.config.ts` - Created
- ✅ `sentry.server.config.ts` - Created
- ✅ `sentry.edge.config.ts` - Created
- ✅ Error boundaries updated

### ⚠️ What's Needed

**1. Install Package (Manual - npm has permission issues):**

Open Terminal (outside Cursor) and run:
```bash
cd /Users/td.d/Documents/bestball-site
npm install @sentry/nextjs --save
```

**Or if that fails, try:**
```bash
npm install @sentry/nextjs --save --legacy-peer-deps
```

**Or use yarn:**
```bash
yarn add @sentry/nextjs
```

**2. Create Sentry Account:**
1. Go to https://sentry.io
2. Sign up (free - 5,000 events/month)
3. Create Next.js project
4. Copy DSN

**3. Add DSN to Environment:**
- Local: Add to `.env.local`
- Vercel: Add to Vercel dashboard environment variables

**4. Test:**
- Add test error button to any page
- Check Sentry dashboard for errors

**Time:** ~15 minutes  
**Priority:** High - You'll immediately see errors users experience

---

## 2. CI/CD Pipeline

### ✅ What's Ready
- ✅ `.github/workflows/ci.yml` - Created and ready
- ✅ File exists and is untracked (needs commit)

### ⚠️ What's Needed

**1. Commit and Push:**

The CI workflow file is ready but not committed. You can:

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
4. Copy contents from the file
5. Commit directly to main

**2. Fix Test Issues First (Recommended):**

Before pushing CI, fix the Jest issue:
```bash
npm install --save-dev @jest/test-sequencer
```

Or reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

**3. Verify It Works:**
- Go to GitHub > Actions tab
- Should see "CI" workflow running
- Check it completes successfully

**Time:** ~5 minutes (after fixing Jest)  
**Priority:** Medium - Vercel already builds, this is extra safety

---

## 3. Test Infrastructure Issues

### Jest Issue

**Problem:** Missing `@jest/test-sequencer` dependency

**Fix:**
```bash
npm install --save-dev @jest/test-sequencer
```

**Or reinstall all dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Linter Issue

**Problem:** Invalid project directory in lint command

**Fix:** Check `package.json` lint script - should be:
```json
"lint": "next lint"
```

Not:
```json
"lint": "next lint lint"  // Wrong
```

---

## Recommended Testing Order

### Step 1: Fix Test Infrastructure (10 minutes)
```bash
# Fix Jest
npm install --save-dev @jest/test-sequencer

# Fix linter (check package.json)
# Verify: "lint": "next lint"
```

### Step 2: Install Sentry (5 minutes)
```bash
npm install @sentry/nextjs --save
```

### Step 3: Set Up Sentry Account (10 minutes)
1. Create account at sentry.io
2. Create Next.js project
3. Copy DSN
4. Add to environment variables

### Step 4: Test Sentry (5 minutes)
1. Add test error button
2. Trigger error
3. Check Sentry dashboard

### Step 5: Commit CI Pipeline (5 minutes)
```bash
git add .github/workflows/ci.yml
git commit -m "Add CI/CD pipeline"
git push
```

### Step 6: Verify CI Works (2 minutes)
1. Check GitHub Actions tab
2. Verify workflow runs

**Total Time:** ~40 minutes

---

## What to Do Right Now

**If you have 5 minutes:**
1. Install Sentry: `npm install @sentry/nextjs --save` (in Terminal, not Cursor)
2. Create Sentry account
3. Add DSN to `.env.local`
4. Test with a simple error

**If you have 15 minutes:**
1. Do the above
2. Fix Jest: `npm install --save-dev @jest/test-sequencer`
3. Commit CI workflow
4. Check GitHub Actions

**If you're busy:**
- Skip CI for now (Vercel already builds)
- Focus on Sentry (biggest immediate value)
- Come back to CI later

---

## Success Indicators

### Sentry Working
- ✅ Package installed in `package.json`
- ✅ DSN in environment variables
- ✅ Test error appears in Sentry dashboard
- ✅ Real user errors start showing up

### CI Working
- ✅ Workflow file committed to GitHub
- ✅ GitHub Actions tab shows workflow runs
- ✅ Tests pass (after fixing Jest)
- ✅ Build completes successfully

---

## Troubleshooting

### npm install Permission Issues

**Solution:** Run in Terminal (outside Cursor):
```bash
cd /Users/td.d/Documents/bestball-site
npm install @sentry/nextjs --save
```

**If still fails:**
- Try: `npm install @sentry/nextjs --save --legacy-peer-deps`
- Or: `yarn add @sentry/nextjs`
- Or: Check npm permissions: `npm config get prefix`

### Jest Missing Dependency

**Solution:**
```bash
npm install --save-dev @jest/test-sequencer
```

**Or reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### CI Not Running

**Check:**
1. File is at `.github/workflows/ci.yml` (exact path)
2. File is committed and pushed
3. GitHub Actions is enabled (Settings > Actions)

---

## Bottom Line

**Sentry:** High value, quick setup (~20 minutes)  
**CI/CD:** Nice to have, not urgent (Vercel already builds)

**My recommendation:** Set up Sentry first (you'll immediately see errors you didn't know about), then fix Jest and commit CI when you have time.

---

**See `TIER1_TESTING_GUIDE.md` for detailed step-by-step instructions.**
