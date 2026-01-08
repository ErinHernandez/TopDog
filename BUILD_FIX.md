# Build Error Fix - Missing Dependencies

## Error: `Module not found: Can't resolve 'firebase-admin/app'`

### ✅ Fix Applied

I've added `firebase-admin` to your `package.json` dependencies.

### 🔧 Action Required

**You need to install the new dependency:**

```bash
npm install
```

This will install `firebase-admin` which is required for:
- Server-side Firebase authentication in API routes
- Token verification in `/api/analytics.js`
- Token verification in `/api/auth/username/change.js`
- Token verification in `/lib/apiAuth.js`

### 📋 What Was Changed

- ✅ Added `"firebase-admin": "^13.0.1"` to `package.json` dependencies

### 🔍 Files Using firebase-admin

The following files require `firebase-admin`:
- `pages/api/analytics.js`
- `pages/api/auth/username/change.js`
- `pages/api/auth/username/reserve.js`
- `lib/apiAuth.js`
- `lib/adminAuth.js`

### ⚠️ Additional Setup

After installing `firebase-admin`, you also need:

1. **Firebase Service Account** (for server-side operations):
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Add to `.env.local` as `FIREBASE_SERVICE_ACCOUNT` (JSON string)

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### ✅ Verification

After running `npm install`, the build should succeed. If you still see errors:
- Check that `node_modules/firebase-admin` exists
- Verify `FIREBASE_SERVICE_ACCOUNT` is set in `.env.local` (optional for development)
- Restart the development server

---

**Note:** `firebase-admin` is a server-side package and is only used in API routes, not in client-side code.

