# Security Fixes Implementation

## Summary
This document outlines the security fixes implemented to address critical vulnerabilities identified in the codebase.

## Fixed Issues

### 1. ✅ DEV_ACCESS_TOKEN Environment Variable (CRITICAL)
**File**: `lib/devAuth.js`

**Issue**: Hardcoded development access token was a security risk.

**Fix**:
- Token now requires `DEV_ACCESS_TOKEN` environment variable in production
- Throws error if not set in production environment
- Falls back to default only in development mode

**Configuration Required**:
```bash
# Production .env file
DEV_ACCESS_TOKEN=your-secure-random-token-here
```

### 2. ✅ Admin Authentication (CRITICAL)
**Files**: 
- `pages/payment-security-dashboard.js`
- `lib/adminAuth.js` (new)
- `pages/api/auth/verify-admin.ts` (new)

**Issue**: Weak admin authentication using URL parameters that could be easily spoofed.

**Fix**:
- Created `lib/adminAuth.js` utility with Firebase Admin SDK integration
- Created `/api/auth/verify-admin` API endpoint for server-side verification
- Updated payment security dashboard to use proper Firebase Auth token verification
- Removed insecure URL parameter checks
- Supports both custom claims (`admin: true`) and admin UID list

**Configuration Required**:
```bash
# Production .env file
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON string
ADMIN_UIDS=uid1,uid2,uid3  # Comma-separated admin user IDs
```

**Usage**:
```typescript
// Server-side
import { verifyAdminAccess } from '@/lib/adminAuth';
const result = await verifyAdminAccess(req.headers.authorization);

// Client-side
const auth = getAuth();
const token = await auth.currentUser?.getIdToken();
const response = await fetch('/api/auth/verify-admin', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. ✅ CORS Configuration (HIGH)
**Files**:
- `pages/api/export/[...params].js`
- `pages/api/analytics.js`

**Issue**: Wildcard CORS (`*`) allowed any origin, creating security risks.

**Fix**:
- Production now requires `ALLOWED_ORIGINS` environment variable
- Only allows requests from explicitly configured origins
- Returns 403 for unauthorized origins in production
- Development mode still allows all origins for local testing
- Added `Access-Control-Allow-Credentials` header for authenticated requests

**Configuration Required**:
```bash
# Production .env file
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Behavior**:
- **Development**: Allows all origins (`*`)
- **Production**: 
  - Requires `ALLOWED_ORIGINS` to be set
  - Only allows origins in the configured list
  - Returns 500 if not configured
  - Returns 403 for unauthorized origins

### 4. ✅ Constant-Time Token Comparison (HIGH)
**File**: `pages/api/auth/username/claim.js`

**Issue**: Simple string comparison (`===`) was vulnerable to timing attacks.

**Fix**:
- Implemented constant-time comparison using `crypto.timingSafeEqual`
- Buffers are padded to same length to prevent length-based timing attacks
- Prevents attackers from inferring token values through timing analysis

**Implementation**:
```javascript
const crypto = require('crypto');
const expectedBuffer = Buffer.from(reservation.claimToken, 'utf8');
const providedBuffer = Buffer.from(claimToken || '', 'utf8');

// Pad to same length
const maxLength = Math.max(expectedBuffer.length, providedBuffer.length);
const expectedPadded = Buffer.alloc(maxLength);
const providedPadded = Buffer.alloc(maxLength);
expectedBuffer.copy(expectedPadded);
providedBuffer.copy(providedPadded);

// Constant-time comparison
if (!crypto.timingSafeEqual(expectedPadded, providedPadded)) {
  return res.status(403).json({ error: 'INVALID_TOKEN' });
}
```

## Environment Variables Summary

Add these to your production `.env` file:

```bash
# Required for admin authentication
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
ADMIN_UIDS=uid1,uid2,uid3

# Required for CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Required for dev access token
DEV_ACCESS_TOKEN=your-secure-random-token-here
```

## Testing

### Test Admin Authentication
1. Sign in as a user with admin privileges
2. Navigate to `/payment-security-dashboard`
3. Should verify admin status via API
4. Non-admin users should see "Access denied"

### Test CORS
1. In production, make request from unauthorized origin
2. Should receive 403 error
3. Make request from authorized origin (in `ALLOWED_ORIGINS`)
4. Should succeed

### Test Token Comparison
1. Attempt to claim username with incorrect token
2. Timing should be constant regardless of how many characters match
3. Should not be able to infer token through timing analysis

## Migration Notes

### Breaking Changes
- **Payment Security Dashboard**: Now requires proper authentication. URL parameter `?admin=true` no longer works.
- **CORS**: Production API endpoints will reject requests from unauthorized origins.

### Backward Compatibility
- Development mode maintains permissive settings for local testing
- All changes are production-focused; development workflow unchanged

### 5. ✅ Replace Hardcoded User IDs (MEDIUM)
**Files**: 
- `lib/devAuth.js`
- `lib/adminAuth.js`
- `pages/dev-access.js`
- `components/Navbar.js`

**Issue**: Hardcoded user IDs in `AUTHORIZED_DEVELOPERS` array and admin UID lists.

**Fix**:
- Removed hardcoded `AUTHORIZED_DEVELOPERS` array
- Updated `isDeveloper()` to use Firebase Auth custom claims (`developer: true`)
- Falls back to `AUTHORIZED_DEVELOPER_UIDS` environment variable during migration
- Updated all components to use proper authentication context
- Removed hardcoded user ID checks in favor of token-based verification

**Configuration Required**:
```bash
# Optional: For migration period only
AUTHORIZED_DEVELOPER_UIDS=uid1,uid2,uid3
```

### 6. ✅ Remove Hardcoded Admin UIDs from Firestore Rules (MEDIUM)
**File**: `firestore.rules.production`

**Issue**: Hardcoded admin UIDs in Firestore security rules.

**Fix**:
- Removed hardcoded UID lists from `isAdmin()` function
- Now uses only custom claims: `request.auth.token.admin == true`
- Updated `devTournaments` rules to use `developer` custom claim instead of hardcoded UIDs
- All admin checks now rely on Firebase Auth custom claims

**Before**:
```javascript
function isAdmin() {
  return isAuthenticated() && 
    (request.auth.token.admin == true || 
     request.auth.uid in ['admin1', 'admin2']);
}
```

**After**:
```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
```

## Next Steps

1. Set environment variables in production deployment
2. Configure Firebase Admin SDK with service account
3. Set admin and developer custom claims for users (see `CUSTOM_CLAIMS_SETUP.md`)
4. Run migration script to set custom claims for existing admins/developers
5. Test all endpoints in production environment
6. Monitor logs for CORS violations and authentication failures
7. Remove fallback UID environment variables once all users have custom claims

