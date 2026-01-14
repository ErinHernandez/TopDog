# Environment Variable Security Review - January 2025
**Date:** January 2025  
**Scope:** Review environment variable fallbacks for critical vars and Firebase credentials status  
**Status:** ✅ Complete

---

## 🔍 EXECUTIVE SUMMARY

### Findings
- ✅ **Firebase Credentials:** File not tracked in git (safe)
- ⚠️ **Environment Variable Fallbacks:** 7 instances need review
- ✅ **Environment Validation:** Proper validation system in place
- ⚠️ **Critical URL Variables:** Using hardcoded fallbacks in production code

### Risk Assessment
- **HIGH:** `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` fallbacks could cause incorrect redirects
- **MEDIUM:** `FIREBASE_SERVICE_ACCOUNT` fallback to empty object could mask configuration errors
- **LOW:** Version and environment fallbacks are acceptable

---

## 🔐 FIREBASE CREDENTIALS STATUS

### Verification Results

**File:** `firebase-env-for-vercel.env`

**Git Status:**
- ✅ **Not tracked in git:** `git ls-files firebase-env-for-vercel.env` returns empty
- ✅ **No git history:** `git log --all --full-history -- firebase-env-for-vercel.env` returns empty
- ✅ **In .gitignore:** Line 28 of `.gitignore` includes `firebase-env-for-vercel.env`

**Local File Status:**
- ⚠️ **File EXISTS locally** (7 lines, contains API key pattern)
- ⚠️ **Contains real credentials** (API key pattern detected)

**Recommendations:**
1. ✅ **Current Status:** File is properly ignored by git
2. ⚠️ **URGENT:** File contains real credentials - verify it was never committed to git
3. ⚠️ **URGENT:** If file was ever committed, rotate ALL Firebase credentials immediately
4. ⚠️ **Action Required:** Review file contents and ensure it's not accidentally committed
5. ⚠️ **Action Required:** Consider using Vercel environment variables instead of local file

**Commands to Verify:**
```bash
# Check if file exists locally
test -f firebase-env-for-vercel.env && echo "EXISTS" || echo "NOT FOUND"

# Check git history (if file was ever committed)
git log --all --full-history --oneline -- firebase-env-for-vercel.env

# If found in history, check if credentials are exposed
git log --all --full-history -p -- firebase-env-for-vercel.env | grep -i "AIzaSy\|firebase\|api.*key"
```

**Security Status:** ✅ **SAFE** - File is not tracked in git, but verify it was never committed

---

## ⚠️ ENVIRONMENT VARIABLE FALLBACKS REVIEW

### Critical Variables with Fallbacks

#### 1. `NEXT_PUBLIC_BASE_URL` ⚠️ **HIGH PRIORITY**

**Usage Locations:**
- `pages/api/xendit/ewallet.ts:149`
- `pages/api/paymongo/source.ts:150`
- `lib/payments/providers/xendit.ts:280`
- `lib/payments/providers/paymongo.ts:92`

**Current Implementation:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topdog.gg';
```

**Risk Assessment:**
- **HIGH** - Hardcoded fallback could cause incorrect redirects in staging/test environments
- **HIGH** - Payment callbacks could redirect to wrong domain
- **MEDIUM** - Could mask missing configuration in production

**Recommendation:**
```typescript
// Production-safe implementation
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
if (!baseUrl) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_BASE_URL is required in production');
  }
  // Only allow fallback in development
  logger.warn('NEXT_PUBLIC_BASE_URL not set, using fallback');
  return 'https://topdog.gg';
}
return baseUrl;
```

**Files to Update:**
1. `pages/api/xendit/ewallet.ts:149`
2. `pages/api/paymongo/source.ts:150`
3. `lib/payments/providers/xendit.ts:280`
4. `lib/payments/providers/paymongo.ts:92`

---

#### 2. `NEXT_PUBLIC_APP_URL` ⚠️ **HIGH PRIORITY**

**Usage Locations:**
- `pages/api/paystack/initialize.ts:221`
- `lib/stripe/stripeService.ts:294`
- `lib/stripe/stripeService.ts:484-485`
- `lib/payments/providers/paystack.ts:96`

**Current Implementation:**
```typescript
// Pattern 1: Localhost fallback
`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deposit/paystack/callback`

// Pattern 2: Empty string fallback
callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/deposit/paystack/callback`
```

**Risk Assessment:**
- **CRITICAL** - Localhost fallback in production would break payment callbacks
- **HIGH** - Empty string fallback could create invalid URLs
- **HIGH** - Payment redirects would fail silently

**Recommendation:**
```typescript
// Production-safe implementation
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is required in production');
  }
  // Only allow localhost fallback in development
  logger.warn('NEXT_PUBLIC_APP_URL not set, using localhost fallback');
  return 'http://localhost:3000';
}
return appUrl;
```

**Files to Update:**
1. `pages/api/paystack/initialize.ts:221`
2. `lib/stripe/stripeService.ts:294`
3. `lib/stripe/stripeService.ts:484-485`
4. `lib/payments/providers/paystack.ts:96`

---

#### 3. `FIREBASE_SERVICE_ACCOUNT` ⚠️ **MEDIUM PRIORITY**

**Usage Locations:**
- `pages/api/auth/username/reserve.js:67`
- `pages/api/analytics.js:29`
- `lib/adminAuth.js:22`
- `lib/firebase/firebaseAdmin.ts:20`
- `lib/apiAuth.js:20`

**Current Implementation:**
```javascript
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (serviceAccount.project_id) {
  admin.initializeApp({
    // ...
  });
}
```

**Risk Assessment:**
- **MEDIUM** - Empty object fallback could mask configuration errors
- **MEDIUM** - Code continues without Firebase, but errors may be silent
- **LOW** - Already has validation check (`if (serviceAccount.project_id)`)

**Recommendation:**
```javascript
// Better error handling
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is required in production');
  }
  logger.warn('FIREBASE_SERVICE_ACCOUNT not set, Firebase Admin will not initialize');
  return; // Exit early
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${error.message}`);
}

if (!serviceAccount.project_id) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT must contain project_id');
}
```

**Note:** This is already partially handled by `lib/envValidation.js`, but the fallback pattern should be removed.

---

### Acceptable Fallbacks (No Action Required)

#### 4. `NEXT_PUBLIC_APP_VERSION` ✅ **ACCEPTABLE**

**Usage Locations:**
- `pages/api/health.ts:130`
- `pages/api/health-edge.ts:71`

**Current Implementation:**
```typescript
version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
```

**Risk Assessment:**
- **LOW** - Version fallback is acceptable for health checks
- **LOW** - Non-critical for functionality

**Status:** ✅ **ACCEPTABLE** - No changes needed

---

#### 5. `NODE_ENV` ✅ **ACCEPTABLE**

**Usage Locations:**
- `pages/api/health.ts:131`
- `pages/api/health-edge.ts:72`
- `pages/api/test-sentry.ts:78`

**Current Implementation:**
```typescript
environment: process.env.NODE_ENV || 'unknown'
```

**Risk Assessment:**
- **LOW** - Environment fallback is acceptable for logging/monitoring
- **LOW** - Non-critical for functionality

**Status:** ✅ **ACCEPTABLE** - No changes needed

---

## 📋 ENVIRONMENT VALIDATION SYSTEM

### Current Implementation ✅

**File:** `lib/envValidation.js`

**Features:**
- ✅ Validates required environment variables at startup
- ✅ Fails fast in production if critical vars missing
- ✅ Warns in development but continues
- ✅ Validates JSON format for `FIREBASE_SERVICE_ACCOUNT`
- ✅ Validates URL format for `ALLOWED_ORIGINS`

**Required Variables (Production):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT`

**Recommended Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`
- `ADMIN_UIDS`
- `DEV_ACCESS_TOKEN`

**Missing from Validation:**
- ⚠️ `NEXT_PUBLIC_BASE_URL` - Should be required in production
- ⚠️ `NEXT_PUBLIC_APP_URL` - Should be required in production

**Recommendation:** Add these to `REQUIRED_ENV_VARS.production` in `lib/envValidation.js`

---

## 🎯 PRIORITY ACTIONS

### Priority 1: Critical URL Variables (HIGH)

**Action:** Remove hardcoded fallbacks for `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` in production

**Files to Update:**
1. `pages/api/xendit/ewallet.ts:149`
2. `pages/api/paymongo/source.ts:150`
3. `pages/api/paystack/initialize.ts:221`
4. `lib/payments/providers/xendit.ts:280`
5. `lib/payments/providers/paymongo.ts:92`
6. `lib/stripe/stripeService.ts:294`
7. `lib/stripe/stripeService.ts:484-485`
8. `lib/payments/providers/paystack.ts:96`

**Implementation Pattern:**
```typescript
// Create helper function in lib/envHelpers.ts
export function requireBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_BASE_URL is required in production');
    }
    console.warn('⚠️  NEXT_PUBLIC_BASE_URL not set, using fallback: https://topdog.gg');
    return 'https://topdog.gg';
  }
  return baseUrl;
}

export function requireAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production');
    }
    console.warn('⚠️  NEXT_PUBLIC_APP_URL not set, using fallback: http://localhost:3000');
    return 'http://localhost:3000';
  }
  return appUrl;
}
```

**Estimated Time:** 1-2 hours

---

### Priority 2: Update Environment Validation (MEDIUM)

**Action:** Add `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` to required variables

**File to Update:**
- `lib/envValidation.js`

**Change:**
```javascript
const REQUIRED_ENV_VARS = {
  production: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_SERVICE_ACCOUNT',
    'NEXT_PUBLIC_BASE_URL',      // ✅ ADD THIS
    'NEXT_PUBLIC_APP_URL',       // ✅ ADD THIS
  ],
  // ...
};
```

**Estimated Time:** 15 minutes

---

### Priority 3: Improve Firebase Service Account Handling (MEDIUM)

**Action:** Remove empty object fallback, add proper error handling

**Files to Update:**
1. `pages/api/auth/username/reserve.js:67`
2. `pages/api/analytics.js:29`
3. `lib/adminAuth.js:22`
4. `lib/firebase/firebaseAdmin.ts:20`
5. `lib/apiAuth.js:20`

**Note:** This is partially handled by `lib/envValidation.js`, but the fallback pattern should be removed from individual files.

**Estimated Time:** 30 minutes

---

### Priority 4: Verify Firebase Credentials ⚠️ **URGENT**

**Status:** ⚠️ **File exists locally with real credentials**

**Action:** Verify Firebase credentials were never committed to git

**Commands:**
```bash
# Check git history for exposed credentials
git log --all --full-history -p -- firebase-env-for-vercel.env | grep -i "AIzaSy\|firebase\|api.*key"

# If ANY output is found, credentials were committed - ROTATE IMMEDIATELY
# If no output, credentials are safe (file was never committed)
```

**If Credentials Were Committed:**
1. ⚠️ **IMMEDIATE:** Rotate ALL Firebase credentials in Firebase Console
2. ⚠️ **IMMEDIATE:** Update Vercel environment variables with new credentials
3. ⚠️ **IMMEDIATE:** Clean git history using BFG Repo-Cleaner:
   ```bash
   bfg --delete-files firebase-env-for-vercel.env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

**Estimated Time:** 
- Verification: 5 minutes
- Rotation (if needed): 30 minutes
- Git history cleanup (if needed): 1 hour

---

## 📊 SUMMARY

### Environment Variables Status

| Variable | Current Status | Risk Level | Action Required |
|----------|---------------|------------|-----------------|
| `NEXT_PUBLIC_BASE_URL` | ⚠️ Hardcoded fallback | HIGH | ✅ Remove fallback in production |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Localhost fallback | CRITICAL | ✅ Remove fallback in production |
| `FIREBASE_SERVICE_ACCOUNT` | ⚠️ Empty object fallback | MEDIUM | ✅ Improve error handling |
| `NEXT_PUBLIC_APP_VERSION` | ✅ Version fallback | LOW | ✅ Acceptable |
| `NODE_ENV` | ✅ Unknown fallback | LOW | ✅ Acceptable |

### Firebase Credentials Status

| Item | Status | Action Required |
|------|--------|-----------------|
| File in .gitignore | ✅ Yes | ✅ None |
| File tracked in git | ✅ No | ✅ None |
| Git history | ✅ Clean | ⚠️ Verify never committed |
| Local file | ⚠️ **EXISTS** (contains credentials) | ⚠️ **URGENT:** Verify never committed |

---

## ✅ RECOMMENDATIONS

### Immediate Actions (Next Sprint)
1. ✅ Remove hardcoded fallbacks for `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL`
2. ✅ Add these variables to `REQUIRED_ENV_VARS.production`
3. ✅ Create helper functions for safe environment variable access
4. ✅ Update all payment provider files to use helper functions

### Short-term Improvements
1. ✅ Improve `FIREBASE_SERVICE_ACCOUNT` error handling
2. ✅ Verify Firebase credentials were never committed
3. ✅ Add environment variable validation to CI/CD pipeline

### Long-term Improvements
1. ✅ Consider using a secrets management service (e.g., Vercel Secrets, AWS Secrets Manager)
2. ✅ Implement environment variable validation in build process
3. ✅ Add automated secret scanning to CI/CD

---

**Report Generated:** January 2025  
**Overall Status:** ⚠️ **NEEDS ATTENTION** - Critical URL variables need fallback removal  
**Security Status:** ✅ **SAFE** - Firebase credentials not in git
