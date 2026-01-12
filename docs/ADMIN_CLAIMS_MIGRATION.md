# Admin Claims Migration Guide

**Date:** January 12, 2025  
**Status:** ✅ **READY FOR EXECUTION**  
**Script:** `scripts/migrate-admin-claims.js`

---

## Overview

Migrate existing admin users from UID-based authentication (environment variable) to Firebase custom claims. This improves security, scalability, and maintainability.

---

## What Changed

### Before
- Admin UIDs hardcoded in `ADMIN_UIDS` environment variable
- `lib/adminAuth.js` checks UID list as fallback
- Less secure, harder to manage

### After
- Admin status stored in Firebase Auth custom claims
- `lib/adminAuth.js` checks custom claims first
- UID fallback kept for safety during migration
- More secure, easier to manage

---

## Migration Process

### Step 1: Run Migration Script (Dry Run)

Test the migration without making changes:

```bash
DRY_RUN=true ADMIN_UIDS="uid1,uid2,uid3" node scripts/migrate-admin-claims.js
```

This will:
- Check each admin UID
- Show what would be done
- **Not actually set any claims**

---

### Step 2: Run Migration Script (Actual)

After verifying the dry run:

```bash
ADMIN_UIDS="uid1,uid2,uid3" node scripts/migrate-admin-claims.js
```

**Required Environment Variables:**
- `ADMIN_UIDS` - Comma-separated list of admin UIDs
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin service account JSON

**Example:**
```bash
export ADMIN_UIDS="abc123,def456,ghi789"
export FIREBASE_SERVICE_ACCOUNT='{"project_id":"...","private_key":"...","client_email":"..."}'
node scripts/migrate-admin-claims.js
```

---

### Step 3: Verify Claims

Use the verification endpoint:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/admin/verify-claims
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "withClaims": 3,
    "withoutClaims": 0,
    "admins": [
      {
        "uid": "abc123",
        "email": "admin1@example.com",
        "hasAdminClaim": true,
        "claims": { "admin": true }
      },
      {
        "uid": "def456",
        "email": "admin2@example.com",
        "hasAdminClaim": true,
        "claims": { "admin": true }
      }
    ],
    "adminUidsFromEnv": ["abc123", "def456", "ghi789"]
  }
}
```

---

### Step 4: Refresh Admin Tokens

**Important:** After setting custom claims, admins must:
1. Sign out of the application
2. Sign back in

This refreshes their ID token with the new custom claims.

---

### Step 5: Test Admin Access

Verify admins can:
- Access admin endpoints
- Use admin features
- Verify claims work correctly

---

### Step 6: Remove UID Fallback (Optional)

After verifying all admins work with custom claims:

1. Edit `lib/adminAuth.js`
2. Remove lines 95-109 (UID fallback code)
3. Keep only custom claims check

**Before removal:**
```javascript
// PRIMARY METHOD: Check admin status via custom claim (recommended)
if (decodedToken.admin === true) {
  return { isAdmin: true, uid: decodedToken.uid, email: decodedToken.email };
}

// FALLBACK: Check against admin UIDs list from environment variable
// ... remove this section ...
```

**After removal:**
```javascript
// Check admin status via custom claim
if (decodedToken.admin === true) {
  return { isAdmin: true, uid: decodedToken.uid, email: decodedToken.email };
}

return { isAdmin: false, error: 'User is not an admin' };
```

---

## Migration Script Features

### Dry Run Mode
```bash
DRY_RUN=true ADMIN_UIDS="uid1,uid2" node scripts/migrate-admin-claims.js
```

### Error Handling
- Handles user not found errors
- Preserves existing custom claims
- Reports detailed error messages

### Verification
- Checks if claims already exist
- Verifies claims after setting
- Provides migration summary

### Output
```
═══════════════════════════════════════════════════════════
  Admin Claims Migration Script
═══════════════════════════════════════════════════════════

Found 3 admin UID(s) to migrate:
  1. abc123
  2. def456
  3. ghi789

Migrating admin: abc123
──────────────────────────────────────────────────
  ✓ Admin claim set successfully (admin1@example.com)

═══════════════════════════════════════════════════════════
  Migration Summary
═══════════════════════════════════════════════════════════

Total admins: 3
✓ Successful: 3
  - Already had claim: 0
  - Newly set: 3
✗ Failed: 0

✅ All admins migrated successfully!
```

---

## Verification Endpoint

### Endpoint
`GET /api/admin/verify-claims`

### Authentication
Requires admin access (uses `verifyAdminAccess`)

### Response

**Success (200):**
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "withClaims": 2,
    "withoutClaims": 1,
    "admins": [
      {
        "uid": "abc123",
        "email": "admin1@example.com",
        "hasAdminClaim": true,
        "claims": { "admin": true }
      },
      {
        "uid": "def456",
        "email": "admin2@example.com",
        "hasAdminClaim": false,
        "claims": {},
        "error": "User not found"
      }
    ],
    "adminUidsFromEnv": ["abc123", "def456", "ghi789"]
  }
}
```

**Error (403):**
```json
{
  "error": {
    "type": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

---

## Troubleshooting

### User Not Found
**Error:** `User not found`

**Solution:**
- Verify UID is correct
- Check user exists in Firebase Auth
- Verify Firebase Admin has permissions

### Claims Not Reflecting
**Issue:** Claims set but not visible to user

**Solution:**
1. User must sign out and sign back in
2. ID token must be refreshed
3. Check claims were set: `GET /api/admin/verify-claims`

### Migration Fails
**Error:** `Failed to set admin claim`

**Solution:**
- Check Firebase Admin permissions
- Verify service account is correct
- Check Firebase project settings
- Review error message for details

---

## Security Notes

### Custom Claims
- Set via Firebase Admin SDK only
- Cannot be modified by users
- Stored in ID token (not in database)
- Automatically verified on each request

### Migration Safety
- UID fallback kept during migration
- No disruption to existing admins
- Can be removed after verification
- Rollback: Remove custom claims if needed

### Best Practices
1. Test migration in development first
2. Use dry run mode before actual migration
3. Verify all admins after migration
4. Have admins refresh tokens
5. Test admin access before removing fallback

---

## Related Documentation

- `lib/adminAuth.js` - Admin verification implementation
- `CUSTOM_CLAIMS_SETUP.md` - Custom claims setup guide
- `scripts/migrate-admin-claims.js` - Migration script
- `pages/api/admin/verify-claims.ts` - Verification endpoint

---

## Next Steps After Migration

1. ✅ Run migration script
2. ✅ Verify all admins have claims
3. ✅ Have admins refresh tokens
4. ✅ Test admin access
5. ⏳ Remove UID fallback (after verification)
6. ⏳ Remove `ADMIN_UIDS` from environment (optional)

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **READY FOR EXECUTION**
