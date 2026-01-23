# Collusion Detection System - Testing Guide

**Date:** January 2025  
**Status:** Ready for Testing

---

## QUICK START - Fix Dev Server Issues

If you're seeing Turbopack/Next.js errors, run these commands:

```bash
# 1. Kill all running processes
lsof -ti:3000,3002,3003 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null

# 2. Clean all caches (including Turbopack)
rm -rf .next node_modules/.cache .turbo

# 3. Start dev server (uses webpack, not Turbopack)
npm run dev
```

The dev script in `package.json` already includes `ensure-manifests.js` which should create the required manifest files.

---

## TESTING THE IMPLEMENTATION

### Step 1: Verify Code Compiles

```bash
# Type check
npm run type-check

# Should show no errors related to integrity system
```

### Step 2: Run Unit Tests

```bash
# Run all integrity tests
npm test -- __tests__/lib/integrity

# Run specific test file
npm test -- __tests__/lib/integrity/validation.test.ts
npm test -- __tests__/lib/integrity/CollusionFlagService.test.ts
```

### Step 3: Deploy Firestore Indexes

**IMPORTANT:** Indexes must be deployed before testing queries.

```bash
# 1. Login to Firebase (if not already)
firebase login

# 2. Deploy indexes
firebase deploy --only firestore:indexes

# 3. Wait for indexes to build (check Firebase Console)
#    Firebase Console → Firestore → Indexes
#    Wait until all show "Enabled" status (5-30 minutes)
```

### Step 4: Manual Testing Checklist

#### Test Flag Recording
1. [ ] Start dev server: `npm run dev`
2. [ ] Create a test draft with 2+ users
3. [ ] Simulate co-location (users within 50ft)
4. [ ] Make picks during the draft
5. [ ] Check Firestore Console → `draftIntegrityFlags` collection
6. [ ] Verify flags are recorded with correct structure

#### Test Post-Draft Analysis
1. [ ] Complete a draft that had flags
2. [ ] Trigger post-draft analysis (or wait for automatic trigger)
3. [ ] Check Firestore Console → `draftRiskScores` collection
4. [ ] Verify risk scores are calculated
5. [ ] Check that pair scores include location, behavior, and benefit scores

#### Test Admin Dashboard
1. [ ] Navigate to admin dashboard
2. [ ] Verify drafts for review are displayed
3. [ ] Click on a draft to view details
4. [ ] Verify pair risk scores are shown correctly
5. [ ] Test recording an admin action
6. [ ] Verify action is saved to `adminActions` collection

#### Test Rate Limiting
1. [ ] Make 100+ requests to `/api/admin/integrity/drafts`
2. [ ] Verify 429 response after limit
3. [ ] Make 20+ requests to `/api/admin/integrity/actions`
4. [ ] Verify 429 response after limit

#### Test Error Handling
1. [ ] Check server logs for structured error messages
2. [ ] Verify transaction retries are logged (if conflicts occur)
3. [ ] Test with intentionally broken data
4. [ ] Verify batch operations continue after individual failures

---

## TROUBLESHOOTING

### Issue: Dev Server Won't Start

**Symptoms:**
- `Cannot find module 'middleware-manifest.json'`
- Turbopack database corruption errors

**Solution:**
```bash
# Clean everything
rm -rf .next node_modules/.cache .turbo

# Run production build first (generates proper structure)
npm run build

# Then start dev server
npm run dev
```

### Issue: Firebase Authentication Error

**Symptoms:**
```
Error: Failed to authenticate, have you run firebase login?
```

**Solution:**
```bash
# Login to Firebase
firebase login

# Verify you're logged in
firebase projects:list

# Then deploy indexes
firebase deploy --only firestore:indexes
```

### Issue: Firestore Query Errors

**Symptoms:**
- Queries fail with "index required" errors
- API routes return 500 errors

**Solution:**
1. Verify indexes are deployed: `firebase deploy --only firestore:indexes`
2. Check Firebase Console → Firestore → Indexes
3. Wait for all indexes to show "Enabled" status
4. If indexes are building, wait 5-30 minutes

### Issue: Tests Fail

**Symptoms:**
- Import errors
- Mock errors
- Type errors

**Solution:**
```bash
# Clear Jest cache
rm -rf node_modules/.cache/jest

# Reinstall dependencies (if needed)
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test -- __tests__/lib/integrity
```

---

## VERIFICATION CHECKLIST

After implementation, verify:

- [ ] All files compile without TypeScript errors
- [ ] All unit tests pass
- [ ] Firestore indexes are deployed and enabled
- [ ] Dev server starts without errors
- [ ] API routes respond correctly
- [ ] Rate limiting works
- [ ] Error logging is structured
- [ ] Admin dashboard loads and displays data

---

## NEXT STEPS AFTER TESTING

1. **If tests pass:** Proceed to staging deployment
2. **If tests fail:** Fix issues and re-run
3. **If indexes not ready:** Wait for them to build, then test queries
4. **If dev server issues persist:** Try production build first approach

---

**Status:** Ready for Testing  
**Last Updated:** January 2025
