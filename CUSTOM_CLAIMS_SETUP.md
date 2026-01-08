# Custom Claims Setup Guide

## Overview
This codebase now uses Firebase Auth custom claims for admin and developer access control instead of hardcoded user IDs. This is more secure, scalable, and maintainable.

## What Changed

### 1. Admin Access
- **Before**: Hardcoded admin UIDs in code and Firestore rules
- **After**: Custom claim `admin: true` set via Firebase Admin SDK

### 2. Developer Access
- **Before**: Hardcoded developer user IDs in `AUTHORIZED_DEVELOPERS` array
- **After**: Custom claim `developer: true` set via Firebase Admin SDK

## Setting Custom Claims

### For Admins

Use Firebase Admin SDK to set admin custom claims:

```javascript
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin (if not already done)
// ... initialization code ...

// Set admin custom claim for a user
async function setAdminClaim(uid) {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim set for user: ${uid}`);
}

// Example: Set admin for a specific user
setAdminClaim('user-uid-here');
```

### For Developers

```javascript
async function setDeveloperClaim(uid) {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { developer: true });
  console.log(`Developer claim set for user: ${uid}`);
}

// Example: Set developer claim
setDeveloperClaim('user-uid-here');
```

### Setting Both Claims

```javascript
async function setAdminAndDeveloperClaims(uid) {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { 
    admin: true,
    developer: true 
  });
  console.log(`Admin and developer claims set for user: ${uid}`);
}
```

## Migration Script

Create a script to migrate existing admins/developers to custom claims:

```javascript
// scripts/migrate-to-custom-claims.js
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = getAuth();

// List of admin UIDs to migrate (from your old system)
const adminUids = [
  'uid1',
  'uid2',
  'uid3',
];

// List of developer UIDs to migrate
const developerUids = [
  'uid4',
  'uid5',
];

async function migrateAdmins() {
  console.log('Migrating admins to custom claims...');
  for (const uid of adminUids) {
    try {
      await auth.setCustomUserClaims(uid, { admin: true });
      console.log(`✓ Admin claim set for ${uid}`);
    } catch (error) {
      console.error(`✗ Failed to set admin claim for ${uid}:`, error.message);
    }
  }
}

async function migrateDevelopers() {
  console.log('Migrating developers to custom claims...');
  for (const uid of developerUids) {
    try {
      await auth.setCustomUserClaims(uid, { developer: true });
      console.log(`✓ Developer claim set for ${uid}`);
    } catch (error) {
      console.error(`✗ Failed to set developer claim for ${uid}:`, error.message);
    }
  }
}

async function main() {
  await migrateAdmins();
  await migrateDevelopers();
  console.log('Migration complete!');
  process.exit(0);
}

main().catch(console.error);
```

## Verification

### Check if User Has Custom Claim

```javascript
// Server-side (Node.js)
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

async function checkUserClaims(uid) {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  console.log('User custom claims:', user.customClaims);
  // Output: { admin: true } or { developer: true } or { admin: true, developer: true }
}
```

### Client-Side Verification

After setting custom claims, users need to:
1. Sign out
2. Sign back in (to refresh their ID token)

The custom claims will then be available in the ID token:

```javascript
// Client-side
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const tokenResult = await user.getIdTokenResult();
  console.log('Custom claims:', tokenResult.claims);
  // Check: tokenResult.claims.admin === true
  // Check: tokenResult.claims.developer === true
}
```

## Firestore Rules

The Firestore rules now check for custom claims:

```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}

function isDeveloper() {
  return isAuthenticated() && request.auth.token.developer == true;
}
```

## Environment Variables (Fallback)

While migrating, you can still use environment variables as a fallback:

```bash
# Optional: For migration period only
ADMIN_UIDS=uid1,uid2,uid3
AUTHORIZED_DEVELOPER_UIDS=uid4,uid5
```

**Note**: The code will log a warning when using UID-based checks. Once all users have custom claims, you can remove these environment variables.

## Best Practices

1. **Set custom claims via server-side code only** - Never set them from client-side
2. **Use Firebase Admin SDK** - This is the only secure way to set custom claims
3. **Refresh tokens after setting claims** - Users must sign out and back in
4. **Remove fallback UID lists** - Once migration is complete, remove environment variable fallbacks
5. **Audit regularly** - Review who has admin/developer claims periodically

## Troubleshooting

### Custom Claims Not Appearing

1. **User must refresh token**: Sign out and sign back in
2. **Check token**: Use `getIdTokenResult(true)` to force refresh
3. **Verify claims were set**: Check via Firebase Admin SDK `getUser()`

### Firestore Rules Not Working

1. **Check token refresh**: Rules use the token from the client
2. **Verify claim format**: Should be `request.auth.token.admin == true` (not `request.auth.token.admin === true`)
3. **Check authentication**: User must be authenticated (`request.auth != null`)

## Security Notes

- Custom claims are included in ID tokens, so keep them small
- Claims are verified server-side via Firebase Admin SDK
- Never trust client-side claim checks alone - always verify server-side
- Custom claims are cached, so changes may take a few minutes to propagate

